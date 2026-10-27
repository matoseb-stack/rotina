package br.com.rotina.investimentos.data

/** Ação ou índice listado na B3, com o fechamento do pregão anterior como referência. */
data class StockSeed(
    val symbol: String,
    val name: String,
    val sector: String,
    val previousClose: Double,
    /** Desvio-padrão do retorno a cada tick (1 s). */
    val volatility: Double,
)

enum class BondKind(val label: String) {
    SELIC("Tesouro Selic"),
    IPCA("Tesouro IPCA+"),
    PREFIXADO("Tesouro Prefixado"),
}

data class BondSeed(
    val id: String,
    val kind: BondKind,
    val title: String,
    val maturity: String,
    /** Taxa de abertura: spread sobre a Selic, juro real sobre o IPCA ou taxa nominal (% a.a.). */
    val openRate: Double,
    val openUnitPrice: Double,
    /** Duration aproximada em anos, usada para mover o PU quando a taxa oscila. */
    val duration: Double,
)

data class MacroIndicator(val label: String, val value: String)

/** Um "frame" do mercado: preços e taxas de todos os ativos no mesmo instante. */
data class MarketTick(
    val prices: Map<String, Double>,
    val rates: Map<String, Double>,
    val timestampMillis: Long,
)
