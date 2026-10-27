package br.com.rotina.investimentos.ui

import androidx.compose.ui.graphics.Color
import br.com.rotina.investimentos.ui.theme.Neon

enum class DashboardTab(
    val number: String,
    val title: String,
    val subtitle: String,
    val accent: Color,
) {
    STOCKS("01", "B3 / Ações", "Blue chips em tempo real", Neon.Lime),
    MOVERS("02", "Top Gainers/Losers", "Destaques do dia", Neon.Cyan),
    TREASURY("03", "Tesouro Direto", "Selic · IPCA+ · Prefixado", Neon.Purple),
}
