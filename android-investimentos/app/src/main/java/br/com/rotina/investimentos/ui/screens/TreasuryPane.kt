package br.com.rotina.investimentos.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import br.com.rotina.investimentos.data.BondKind
import br.com.rotina.investimentos.data.MacroIndicator
import br.com.rotina.investimentos.ui.LiveBond
import br.com.rotina.investimentos.ui.components.Formats
import br.com.rotina.investimentos.ui.components.GlassCard
import br.com.rotina.investimentos.ui.components.LiveNumber
import br.com.rotina.investimentos.ui.components.Sparkline
import br.com.rotina.investimentos.ui.theme.Neon
import br.com.rotina.investimentos.ui.theme.TabularNumbers

@Composable
fun TreasuryPane(
    bonds: List<LiveBond>,
    macro: List<MacroIndicator>,
    columns: Int,
    modifier: Modifier = Modifier,
) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(columns),
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(20.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp),
        contentPadding = PaddingValues(top = 8.dp, bottom = 32.dp),
    ) {
        item(key = "macro", span = { GridItemSpan(maxLineSpan) }) { MacroStrip(macro) }
        items(bonds, key = { it.id }) { BondCard(it) }
    }
}

@Composable
private fun MacroStrip(macro: List<MacroIndicator>) {
    GlassCard(Modifier.fillMaxWidth(), accent = Neon.Purple, contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp)) {
        Row {
            macro.forEachIndexed { i, indicator ->
                if (i > 0) Spacer(Modifier.width(1.dp).height(40.dp).background(Neon.Hairline))
                Column(Modifier.weight(1f).padding(horizontal = 16.dp)) {
                    Text(indicator.label.uppercase(), color = Neon.TextMuted, style = MaterialTheme.typography.labelSmall)
                    Spacer(Modifier.height(4.dp))
                    Text(indicator.value, color = Neon.Purple, style = MaterialTheme.typography.titleLarge.merge(TabularNumbers))
                }
            }
        }
    }
}

@Composable
private fun BondCard(bond: LiveBond) {
    GlassCard(Modifier.fillMaxWidth(), accent = Neon.Purple) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                bond.kind.label.uppercase(),
                color = Neon.Purple,
                style = MaterialTheme.typography.labelSmall,
                modifier = Modifier
                    .clip(RoundedCornerShape(50))
                    .background(Neon.Purple.copy(alpha = 0.14f))
                    .padding(horizontal = 10.dp, vertical = 4.dp),
            )
            Spacer(Modifier.weight(1f))
            Text("Venc. ${bond.maturity}", color = Neon.TextMuted, style = MaterialTheme.typography.labelMedium)
        }
        Spacer(Modifier.height(14.dp))
        Text(bond.title, color = Neon.TextPrimary, style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(10.dp))
        Row(verticalAlignment = Alignment.Bottom) {
            BondRate(bond)
            Spacer(Modifier.width(12.dp))
            BondRateChange(bond)
        }
        Spacer(Modifier.height(12.dp))
        Sparkline(
            points = bond.history,
            color = { Neon.Purple },
            modifier = Modifier.fillMaxWidth().height(56.dp),
        )
        Spacer(Modifier.height(14.dp))
        Spacer(Modifier.fillMaxWidth().height(1.dp).background(Neon.Hairline))
        Spacer(Modifier.height(12.dp))
        Row {
            StatCell("Preço unitário", Modifier.weight(1f)) { Formats.brl(bond.unitPrice) }
            StatCell("Invest. mínimo", Modifier.weight(1f)) { Formats.brl(bond.minimumInvestment) }
        }
    }
}

@Composable
private fun BondRate(bond: LiveBond) {
    val format: (Double) -> String = when (bond.kind) {
        BondKind.SELIC -> { r -> "SELIC + ${Formats.rate(r, decimals = 4)}" }
        BondKind.IPCA -> { r -> "IPCA + ${Formats.rate(r)}" }
        BondKind.PREFIXADO -> { r -> "${Formats.rate(r)} a.a." }
    }
    // Taxa subindo derruba o PU: o brilho segue a ótica de quem já tem o título.
    LiveNumber(bond.rate, format, MaterialTheme.typography.headlineSmall, invertTrend = true)
}

@Composable
private fun BondRateChange(bond: LiveBond) {
    val bps = bond.changeBps
    Text(
        Formats.bps(bps),
        color = if (bps <= 0) Neon.Lime else Neon.Red,
        style = MaterialTheme.typography.labelMedium.merge(TabularNumbers),
        fontWeight = FontWeight.SemiBold,
        modifier = Modifier.padding(bottom = 4.dp),
    )
}
