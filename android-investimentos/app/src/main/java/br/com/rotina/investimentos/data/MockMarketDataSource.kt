package br.com.rotina.investimentos.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.isActive
import java.util.Random

/**
 * Fonte de dados simulada. Gera um passeio aleatório com reversão à média para
 * ações e taxas do Tesouro, emitindo um [MarketTick] por intervalo.
 * Troque por um WebSocket/REST real mantendo a mesma assinatura de [ticks].
 */
class MockMarketDataSource(private val random: Random = Random()) {

    val index = StockSeed("IBOV", "Ibovespa", "Índice", 128_450.0, 0.0005)

    val stocks = listOf(
        StockSeed("PETR4", "Petrobras PN", "Petróleo e Gás", 37.85, 0.0016),
        StockSeed("VALE3", "Vale ON", "Mineração", 61.20, 0.0015),
        StockSeed("ITUB4", "Itaú Unibanco PN", "Bancos", 35.40, 0.0011),
        StockSeed("WEGE3", "WEG ON", "Bens Industriais", 52.30, 0.0013),
        StockSeed("BBAS3", "Banco do Brasil ON", "Bancos", 27.90, 0.0013),
        StockSeed("BBDC4", "Bradesco PN", "Bancos", 14.85, 0.0015),
        StockSeed("ABEV3", "Ambev ON", "Bebidas", 13.40, 0.0010),
        StockSeed("B3SA3", "B3 ON", "Serviços Financeiros", 12.95, 0.0016),
        StockSeed("RENT3", "Localiza ON", "Aluguel de Carros", 41.60, 0.0020),
        StockSeed("SUZB3", "Suzano ON", "Papel e Celulose", 56.10, 0.0014),
        StockSeed("PRIO3", "PRIO ON", "Petróleo e Gás", 43.20, 0.0022),
        StockSeed("MGLU3", "Magazine Luiza ON", "Varejo", 9.85, 0.0032),
        StockSeed("ELET3", "Eletrobras ON", "Energia Elétrica", 42.70, 0.0015),
        StockSeed("RDOR3", "Rede D'Or ON", "Saúde", 30.15, 0.0017),
        StockSeed("EMBR3", "Embraer ON", "Aeroespacial", 68.40, 0.0021),
    )

    val bonds = listOf(
        BondSeed("selic-2029", BondKind.SELIC, "Tesouro Selic 2029", "01/03/2029", 0.0921, 16_874.32, 0.05),
        BondSeed("selic-2031", BondKind.SELIC, "Tesouro Selic 2031", "01/03/2031", 0.1050, 16_712.10, 0.08),
        BondSeed("ipca-2035", BondKind.IPCA, "Tesouro IPCA+ 2035", "15/05/2035", 7.42, 2_048.55, 7.2),
        BondSeed("ipca-2045", BondKind.IPCA, "Tesouro IPCA+ 2045", "15/05/2045", 7.18, 1_022.30, 13.5),
        BondSeed("pre-2028", BondKind.PREFIXADO, "Tesouro Prefixado 2028", "01/01/2028", 13.95, 834.10, 1.1),
        BondSeed("pre-2032", BondKind.PREFIXADO, "Tesouro Prefixado 2032", "01/01/2032", 13.48, 455.70, 4.3),
    )

    val macro = listOf(
        MacroIndicator("Selic Meta", "15,00%"),
        MacroIndicator("CDI", "14,90%"),
        MacroIndicator("IPCA 12m", "5,17%"),
    )

    fun ticks(intervalMillis: Long = 1_000L): Flow<MarketTick> = flow {
        val allStocks = stocks + index
        // Abre o "pregão" com um gap aleatório para que altas e baixas já apareçam.
        val opens = allStocks.associate { it.symbol to it.previousClose * (1 + uniform(0.035)) }
        val prices = opens.toMutableMap()
        val rates = bonds.associate { it.id to it.openRate }.toMutableMap()

        while (currentCoroutineContext().isActive) {
            for (seed in allStocks) {
                val price = prices.getValue(seed.symbol)
                val reversion = (opens.getValue(seed.symbol) - price) / price * 0.01
                val shock = random.nextGaussian() * seed.volatility
                prices[seed.symbol] = (price * (1 + shock + reversion)).coerceAtLeast(0.01)
            }
            for (bond in bonds) {
                val rate = rates.getValue(bond.id)
                val step = if (bond.kind == BondKind.SELIC) 0.0004 else 0.006
                val reversion = (bond.openRate - rate) * 0.05
                rates[bond.id] = rate + random.nextGaussian() * step + reversion
            }
            emit(MarketTick(prices.toMap(), rates.toMap(), System.currentTimeMillis()))
            delay(intervalMillis)
        }
    }.flowOn(Dispatchers.Default)

    private fun uniform(amplitude: Double) = (random.nextDouble() * 2 - 1) * amplitude
}
