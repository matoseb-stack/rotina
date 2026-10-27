package br.com.rotina.investimentos.ui.screens

import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.structuralEqualityPolicy
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import br.com.rotina.investimentos.ui.LiveQuote
import br.com.rotina.investimentos.ui.components.Formats
import br.com.rotina.investimentos.ui.components.GlassCard
import br.com.rotina.investimentos.ui.components.LiveNumber
import br.com.rotina.investimentos.ui.theme.Neon
import kotlin.math.abs

private const val RANK_SIZE = 6

@Composable
fun MoversPane(
    universe: List<LiveQuote>,
    columns: Int,
    modifier: Modifier = Modifier,
) {
    // derivedStateOf com igualdade estrutural: a lista só recompõe quando o
    // ranking muda de fato (entrada, saída ou troca de posição), não a cada tick.
    val gainers by remember(universe) {
        derivedStateOf(structuralEqualityPolicy()) {
            universe.filter { it.changePct >= 0 }.sortedByDescending { it.changePct }.take(RANK_SIZE)
        }
    }
    val losers by remember(universe) {
        derivedStateOf(structuralEqualityPolicy()) {
            universe.filter { it.changePct < 0 }.sortedBy { it.changePct }.take(RANK_SIZE)
        }
    }
    val advancers by remember(universe) { derivedStateOf { universe.count { it.changePct >= 0 } } }
    // O maior módulo de variação define a escala das barras; lido só no desenho.
    val scale = remember(universe) { derivedStateOf { universe.maxOf { abs(it.changePct) }.coerceAtLeast(0.5) } }

    Column(modifier.padding(top = 8.dp, bottom = 32.dp)) {
        BreadthBar(advancers = advancers, total = universe.size)
        Spacer(Modifier.height(20.dp))
        if (columns >= 2) {
            Row(Modifier.fillMaxSize(), horizontalArrangement = Arrangement.spacedBy(20.dp)) {
                MoversList("Maiores altas", gainers, Neon.Lime, { scale.value }, Modifier.weight(1f).fillMaxHeight())
                MoversList("Maiores baixas", losers, Neon.Red, { scale.value }, Modifier.weight(1f).fillMaxHeight())
            }
        } else {
            Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(20.dp)) {
                MoversList("Maiores altas", gainers, Neon.Lime, { scale.value }, Modifier.weight(1f).fillMaxWidth())
                MoversList("Maiores baixas", losers, Neon.Red, { scale.value }, Modifier.weight(1f).fillMaxWidth())
            }
        }
    }
}

@Composable
private fun BreadthBar(advancers: Int, total: Int) {
    val decliners = total - advancers
    GlassCard(Modifier.fillMaxWidth(), accent = Neon.Cyan, contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("AMPLITUDE DO MERCADO", color = Neon.TextSecondary, style = MaterialTheme.typography.labelSmall)
            Spacer(Modifier.weight(1f))
            Text("$advancers altas", color = Neon.Lime, style = MaterialTheme.typography.labelMedium)
            Text("  ·  ", color = Neon.TextMuted, style = MaterialTheme.typography.labelMedium)
            Text("$decliners baixas", color = Neon.Red, style = MaterialTheme.typography.labelMedium)
        }
        Spacer(Modifier.height(12.dp))
        val ratio = if (total == 0) 0.5f else advancers / total.toFloat()
        Canvas(Modifier.fillMaxWidth().height(6.dp)) {
            val r = CornerRadius(size.height / 2)
            val split = size.width * ratio
            val gap = if (ratio in 0.01f..0.99f) 3.dp.toPx() else 0f
            drawRoundRect(Neon.Lime, size = Size((split - gap / 2).coerceAtLeast(0f), size.height), cornerRadius = r)
            drawRoundRect(
                Neon.Red,
                topLeft = Offset(split + gap / 2, 0f),
                size = Size((size.width - split - gap / 2).coerceAtLeast(0f), size.height),
                cornerRadius = r,
            )
        }
    }
}

@Composable
private fun MoversList(
    title: String,
    items: List<LiveQuote>,
    accent: Color,
    scale: () -> Double,
    modifier: Modifier = Modifier,
) {
    GlassCard(modifier, accent = accent) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(title.uppercase(), color = accent, style = MaterialTheme.typography.labelSmall)
            Spacer(Modifier.weight(1f))
            Text("${items.size} ativos", color = Neon.TextMuted, style = MaterialTheme.typography.labelMedium)
        }
        Spacer(Modifier.height(14.dp))
        if (items.isEmpty()) {
            Text("Nenhum ativo neste lado agora.", color = Neon.TextMuted, style = MaterialTheme.typography.bodyMedium)
        }
        LazyColumn(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            itemsIndexed(items, key = { _, quote -> quote.symbol }) { rank, quote ->
                MoverRow(
                    rank = rank + 1,
                    quote = quote,
                    accent = accent,
                    scale = scale,
                    // Reordenação animada: o "shuffle" do ranking em tempo real.
                    modifier = Modifier.animateItem(
                        fadeInSpec = tween(300),
                        placementSpec = spring(dampingRatio = 0.7f, stiffness = Spring.StiffnessMediumLow),
                        fadeOutSpec = tween(200),
                    ),
                )
            }
        }
    }
}

@Composable
private fun MoverRow(rank: Int, quote: LiveQuote, accent: Color, scale: () -> Double, modifier: Modifier = Modifier) {
    Column(modifier.padding(vertical = 8.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                "#$rank",
                color = accent.copy(alpha = 0.8f),
                style = MaterialTheme.typography.labelMedium,
                modifier = Modifier.width(36.dp),
            )
            Column(Modifier.weight(1f)) {
                Text(quote.symbol, color = Neon.TextPrimary, style = MaterialTheme.typography.titleMedium)
                Text(quote.name, color = Neon.TextMuted, style = MaterialTheme.typography.labelMedium, maxLines = 1)
            }
            Column(horizontalAlignment = Alignment.End) {
                MoverPrice(quote)
                MoverPercent(quote)
            }
        }
        Spacer(Modifier.height(8.dp))
        Canvas(Modifier.fillMaxWidth().height(3.dp)) {
            val fraction = (abs(quote.changePct) / scale()).toFloat().coerceIn(0f, 1f)
            val r = CornerRadius(size.height / 2)
            drawRoundRect(Neon.Hairline, cornerRadius = r)
            drawRoundRect(accent, size = Size(size.width * fraction, size.height), cornerRadius = r)
        }
    }
}

@Composable
private fun MoverPrice(quote: LiveQuote) {
    LiveNumber(quote.price, Formats::brl, MaterialTheme.typography.titleMedium)
}

@Composable
private fun MoverPercent(quote: LiveQuote) {
    val pct = quote.changePct
    Text(Formats.percent(pct), color = Neon.trend(pct), style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold)
}
