package br.com.rotina.investimentos.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import br.com.rotina.investimentos.ui.LiveQuote
import br.com.rotina.investimentos.ui.components.ChangeChip
import br.com.rotina.investimentos.ui.components.Formats
import br.com.rotina.investimentos.ui.components.GlassCard
import br.com.rotina.investimentos.ui.components.LiveNumber
import br.com.rotina.investimentos.ui.components.Sparkline
import br.com.rotina.investimentos.ui.theme.Neon
import br.com.rotina.investimentos.ui.theme.TabularNumbers

@Composable
fun StocksPane(
    index: LiveQuote,
    quotes: List<LiveQuote>,
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
        item(key = index.symbol, span = { GridItemSpan(maxLineSpan) }) { IndexBanner(index) }
        items(quotes, key = { it.symbol }) { StockCard(it) }
    }
}

@Composable
private fun IndexBanner(index: LiveQuote) {
    GlassCard(Modifier.fillMaxWidth(), accent = Neon.Lime) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text("IBOVESPA", color = Neon.TextSecondary, style = MaterialTheme.typography.labelSmall)
                Spacer(Modifier.height(6.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    QuoteValue(index, MaterialTheme.typography.headlineSmall) { "${Formats.points(it)} pts" }
                    Spacer(Modifier.width(14.dp))
                    QuoteChange(index)
                }
            }
            Sparkline(
                points = index.history,
                color = { Neon.trend(index.changePct) },
                modifier = Modifier.weight(1f).height(56.dp),
            )
        }
    }
}

@Composable
private fun StockCard(quote: LiveQuote) {
    GlassCard(Modifier.fillMaxWidth(), accent = Neon.Lime) {
        Row(verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f)) {
                Text(quote.symbol, color = Neon.TextPrimary, style = MaterialTheme.typography.titleLarge)
                Text(
                    "${quote.name} · ${quote.sector}",
                    color = Neon.TextMuted,
                    style = MaterialTheme.typography.labelMedium,
                    maxLines = 1,
                )
            }
            QuoteChange(quote)
        }
        Spacer(Modifier.height(18.dp))
        QuoteValue(quote, MaterialTheme.typography.displaySmall, Formats::brl)
        Text(
            "Fech. anterior ${Formats.brl(quote.previousClose)}",
            color = Neon.TextMuted,
            style = MaterialTheme.typography.labelMedium.merge(TabularNumbers),
        )
        Spacer(Modifier.height(14.dp))
        Sparkline(
            points = quote.history,
            color = { Neon.trend(quote.changePct) },
            modifier = Modifier.fillMaxWidth().height(72.dp),
        )
        Spacer(Modifier.height(14.dp))
        Spacer(Modifier.fillMaxWidth().height(1.dp).background(Neon.Hairline))
        Spacer(Modifier.height(12.dp))
        Row {
            StatCell("Mínima", Modifier.weight(1f)) { Formats.brl(quote.dayLow) }
            StatCell("Máxima", Modifier.weight(1f)) { Formats.brl(quote.dayHigh) }
            StatCell("Variação", Modifier.weight(1f)) { Formats.brl(quote.change) }
        }
    }
}

/*
 * Os Composables abaixo são os únicos que leem o estado vivo da cotação.
 * Como cada um tem seu próprio escopo de recomposição, um tick atualiza só eles,
 * deixando cabeçalhos, nomes e o layout dos cards intactos.
 */

@Composable
internal fun QuoteValue(
    quote: LiveQuote,
    style: androidx.compose.ui.text.TextStyle,
    format: (Double) -> String,
) {
    LiveNumber(value = quote.price, format = format, style = style)
}

@Composable
internal fun QuoteChange(quote: LiveQuote) {
    ChangeChip(quote.changePct)
}

@Composable
internal fun StatCell(label: String, modifier: Modifier = Modifier, value: () -> String) {
    Column(modifier) {
        Text(label.uppercase(), color = Neon.TextMuted, style = MaterialTheme.typography.labelSmall)
        Spacer(Modifier.height(4.dp))
        Text(value(), color = Neon.TextSecondary, style = MaterialTheme.typography.bodyMedium.merge(TabularNumbers))
    }
}
