package br.com.rotina.investimentos.ui.screens

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Devices
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.repeatOnLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import br.com.rotina.investimentos.ui.DashboardTab
import br.com.rotina.investimentos.ui.MarketViewModel
import br.com.rotina.investimentos.ui.components.Formats
import br.com.rotina.investimentos.ui.components.LiveBadge
import br.com.rotina.investimentos.ui.components.NeonTabs
import br.com.rotina.investimentos.ui.components.neonBackdrop
import br.com.rotina.investimentos.ui.theme.Neon
import br.com.rotina.investimentos.ui.theme.NeonTheme
import br.com.rotina.investimentos.ui.theme.TabularNumbers

@Composable
fun InvestmentDashboardScreen(viewModel: MarketViewModel = viewModel()) {
    // Loop em tempo real: a corrotina do LaunchedEffect consome o fluxo de 1 s do
    // ViewModel enquanto a tela estiver visível (STARTED) e pausa em segundo plano.
    val lifecycleOwner = LocalLifecycleOwner.current
    LaunchedEffect(viewModel, lifecycleOwner) {
        lifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
            viewModel.streamQuotes()
        }
    }

    BoxWithConstraints(
        Modifier
            .fillMaxSize()
            .neonBackdrop()
            .safeDrawingPadding(),
    ) {
        val screenWidth = maxWidth
        val isTablet = screenWidth >= 600.dp
        if (isTablet) {
            Row(Modifier.fillMaxSize().padding(28.dp)) {
                Column(Modifier.width(260.dp).fillMaxHeight()) {
                    Text("MERCADO", color = Neon.TextMuted, style = MaterialTheme.typography.labelSmall)
                    Spacer(Modifier.height(18.dp))
                    NeonTabs(viewModel.selectedTab, viewModel::selectTab, vertical = true)
                    Spacer(Modifier.weight(1f))
                    Text(
                        "Dados simulados para demonstração.\nAtualização a cada 1 segundo.",
                        color = Neon.TextMuted,
                        style = MaterialTheme.typography.labelMedium,
                    )
                }
                Spacer(Modifier.width(28.dp))
                Column(Modifier.weight(1f).fillMaxHeight()) {
                    DashboardHeader(viewModel)
                    Spacer(Modifier.height(20.dp))
                    // 2 colunas no tablet, mesmo em retrato (área útil >= 520 dp).
                    val columns = if (screenWidth - 316.dp >= 520.dp) 2 else 1
                    DashboardContent(viewModel, columns, Modifier.weight(1f))
                }
            }
        } else {
            Column(Modifier.fillMaxSize().padding(horizontal = 16.dp, vertical = 16.dp)) {
                DashboardHeader(viewModel)
                Spacer(Modifier.height(16.dp))
                NeonTabs(viewModel.selectedTab, viewModel::selectTab, vertical = false, Modifier.fillMaxWidth())
                Spacer(Modifier.height(16.dp))
                DashboardContent(viewModel, columns = 1, Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun DashboardHeader(viewModel: MarketViewModel) {
    val tab = viewModel.selectedTab
    val accent by animateColorAsState(tab.accent, tween(450), label = "header-accent")
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text("PAINEL DE INVESTIMENTOS", color = accent, style = MaterialTheme.typography.labelSmall)
            Spacer(Modifier.height(4.dp))
            AnimatedContent(
                targetState = tab,
                transitionSpec = {
                    (slideInVertically(tween(320)) { it } + fadeIn(tween(320))) togetherWith
                        (slideOutVertically(tween(220)) { -it } + fadeOut(tween(180)))
                },
                label = "header-title",
            ) { shown ->
                Text(shown.title, color = Neon.TextPrimary, style = MaterialTheme.typography.headlineSmall)
            }
        }
        LastUpdate(viewModel)
        Spacer(Modifier.width(14.dp))
        LiveBadge()
    }
}

@Composable
private fun LastUpdate(viewModel: MarketViewModel) {
    Text(
        Formats.clock(viewModel.lastUpdateMillis),
        color = Neon.TextSecondary,
        style = MaterialTheme.typography.titleMedium.merge(TabularNumbers),
    )
}

@Composable
private fun DashboardContent(viewModel: MarketViewModel, columns: Int, modifier: Modifier = Modifier) {
    AnimatedContent(
        targetState = viewModel.selectedTab,
        modifier = modifier,
        transitionSpec = {
            // slideUp ao avançar de aba, slideDown ao voltar.
            val forward = targetState.ordinal > initialState.ordinal
            (slideInVertically(tween(420)) { h -> if (forward) h / 8 else -h / 8 } + fadeIn(tween(420))) togetherWith
                (slideOutVertically(tween(260)) { h -> if (forward) -h / 12 else h / 12 } + fadeOut(tween(200)))
        },
        label = "tab-content",
    ) { tab ->
        when (tab) {
            DashboardTab.STOCKS -> StocksPane(viewModel.index, viewModel.blueChips, columns, Modifier.fillMaxSize())
            DashboardTab.MOVERS -> MoversPane(viewModel.universe, columns, Modifier.fillMaxSize())
            DashboardTab.TREASURY -> TreasuryPane(viewModel.bonds, viewModel.macro, columns, Modifier.fillMaxSize())
        }
    }
}

@Preview(device = Devices.PIXEL_TABLET, showBackground = true, backgroundColor = 0xFF000000)
@Composable
private fun DashboardTabletPreview() {
    NeonTheme { InvestmentDashboardScreen(MarketViewModel()) }
}
