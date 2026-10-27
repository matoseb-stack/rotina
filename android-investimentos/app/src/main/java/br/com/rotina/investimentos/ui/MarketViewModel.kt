package br.com.rotina.investimentos.ui

import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshots.Snapshot
import androidx.compose.runtime.snapshots.SnapshotStateList
import androidx.lifecycle.ViewModel
import br.com.rotina.investimentos.data.BondKind
import br.com.rotina.investimentos.data.BondSeed
import br.com.rotina.investimentos.data.MarketTick
import br.com.rotina.investimentos.data.MockMarketDataSource
import br.com.rotina.investimentos.data.StockSeed

private const val HISTORY_SIZE = 60

/**
 * Cotação viva. Cada campo é um State próprio: um tick só invalida os
 * Composables que leem aquele campo (o texto do preço, o chip de variação,
 * o desenho do sparkline), e não a tela inteira.
 */
@Stable
class LiveQuote(seed: StockSeed) {
    val symbol = seed.symbol
    val name = seed.name
    val sector = seed.sector
    val previousClose = seed.previousClose

    var price by mutableDoubleStateOf(seed.previousClose)
        private set
    var dayLow by mutableDoubleStateOf(Double.MAX_VALUE)
        private set
    var dayHigh by mutableDoubleStateOf(0.0)
        private set
    val history: SnapshotStateList<Float> = mutableStateListOf()

    val change: Double get() = price - previousClose
    val changePct: Double get() = change / previousClose * 100

    internal fun update(newPrice: Double) {
        price = newPrice
        if (newPrice < dayLow) dayLow = newPrice
        if (newPrice > dayHigh) dayHigh = newPrice
        history.add(newPrice.toFloat())
        if (history.size > HISTORY_SIZE) history.removeAt(0)
    }
}

@Stable
class LiveBond(private val seed: BondSeed) {
    val id = seed.id
    val kind = seed.kind
    val title = seed.title
    val maturity = seed.maturity
    val openRate = seed.openRate

    var rate by mutableDoubleStateOf(seed.openRate)
        private set
    var unitPrice by mutableDoubleStateOf(seed.openUnitPrice)
        private set
    val history: SnapshotStateList<Float> = mutableStateListOf()

    /** Variação da taxa desde a abertura, em pontos-base. */
    val changeBps: Double get() = (rate - openRate) * 100

    /** Tesouro exige no mínimo 1% do PU, respeitando o piso de R$ 30. */
    val minimumInvestment: Double get() = maxOf(unitPrice * 0.01, 30.0)

    internal fun update(newRate: Double) {
        rate = newRate
        // Para Selic o "rate" é só o spread, então o PU praticamente não reage.
        val sensitivity = if (kind == BondKind.SELIC) seed.duration else seed.duration / (1 + newRate / 100)
        unitPrice = seed.openUnitPrice * (1 - sensitivity * (newRate - seed.openRate) / 100)
        history.add(newRate.toFloat())
        if (history.size > HISTORY_SIZE) history.removeAt(0)
    }
}

class MarketViewModel(
    private val source: MockMarketDataSource = MockMarketDataSource(),
) : ViewModel() {

    val index = LiveQuote(source.index)

    /** Universo completo, usado no ranking de Top Gainers/Losers. */
    val universe: List<LiveQuote> = source.stocks.map(::LiveQuote)
    private val bySymbol = universe.associateBy { it.symbol }

    val blueChips: List<LiveQuote> = listOf("PETR4", "VALE3", "ITUB4", "WEGE3").map(bySymbol::getValue)

    val bonds: List<LiveBond> = source.bonds.map(::LiveBond)

    val macro = source.macro

    var selectedTab by mutableStateOf(DashboardTab.STOCKS)
        private set

    var lastUpdateMillis by mutableLongStateOf(0L)
        private set

    fun selectTab(tab: DashboardTab) {
        selectedTab = tab
    }

    /**
     * Consome o fluxo em tempo real até a corrotina ser cancelada. É chamado por
     * um LaunchedEffect na tela, então o loop para sozinho quando a UI sai de cena.
     */
    suspend fun streamQuotes() {
        source.ticks().collect(::apply)
    }

    private fun apply(tick: MarketTick) {
        // Aplica o tick inteiro de forma atômica: a UI nunca vê um frame "meio atualizado".
        Snapshot.withMutableSnapshot {
            tick.prices[index.symbol]?.let(index::update)
            for (quote in universe) tick.prices[quote.symbol]?.let(quote::update)
            for (bond in bonds) tick.rates[bond.id]?.let(bond::update)
            lastUpdateMillis = tick.timestampMillis
        }
    }
}
