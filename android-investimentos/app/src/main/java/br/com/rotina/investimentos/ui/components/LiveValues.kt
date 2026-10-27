package br.com.rotina.investimentos.ui.components

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.SizeTransform
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.snapshots.SnapshotStateList
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import br.com.rotina.investimentos.ui.theme.Neon
import br.com.rotina.investimentos.ui.theme.TabularNumbers

/**
 * Valor que "embaralha" a cada atualização: o número novo entra deslizando de
 * baixo (alta) ou de cima (baixa) e pisca na cor da tendência.
 * O piscar usa ColorProducer, ou seja, é só redesenho, sem recomposição.
 */
@Composable
fun LiveNumber(
    value: Double,
    format: (Double) -> String,
    style: TextStyle,
    modifier: Modifier = Modifier,
    baseColor: Color = Neon.TextPrimary,
    invertTrend: Boolean = false,
) {
    val tint = remember { Animatable(baseColor) }
    val previous = remember { mutableDoubleStateOf(value) }
    LaunchedEffect(value) {
        val delta = value - previous.doubleValue
        previous.doubleValue = value
        if (delta != 0.0) {
            tint.snapTo(Neon.trend(if (invertTrend) -delta else delta))
            tint.animateTo(baseColor, tween(durationMillis = 850))
        }
    }

    AnimatedContent(
        targetState = value,
        transitionSpec = {
            val up = targetState >= initialState
            val enter = slideInVertically(tween(280)) { h -> if (up) h / 2 else -h / 2 } + fadeIn(tween(280))
            val exit = slideOutVertically(tween(220)) { h -> if (up) -h / 2 else h / 2 } + fadeOut(tween(180))
            (enter togetherWith exit).using(SizeTransform(clip = true))
        },
        modifier = modifier,
        label = "live-number",
    ) { shown ->
        BasicText(text = format(shown), style = style.merge(TabularNumbers), color = { tint.value })
    }
}

@Composable
fun ChangeChip(changePct: Double, modifier: Modifier = Modifier) {
    val color by animateColorAsState(Neon.trend(changePct), tween(400), label = "chip-color")
    val arrow = if (changePct >= 0) "▲" else "▼"
    Text(
        text = "$arrow ${Formats.percent(changePct)}",
        color = color,
        style = TabularNumbers.copy(fontWeight = FontWeight.SemiBold),
        modifier = modifier
            .clip(RoundedCornerShape(50))
            .background(color.copy(alpha = 0.12f))
            .padding(horizontal = 10.dp, vertical = 5.dp),
    )
}

/**
 * Mini gráfico do histórico recente. A lista é lida dentro do bloco de desenho:
 * cada tick invalida só o draw do Canvas, nunca a composição.
 */
@Composable
fun Sparkline(
    points: SnapshotStateList<Float>,
    color: () -> Color,
    modifier: Modifier = Modifier,
) {
    Canvas(modifier) {
        val data = points.toList()
        if (data.size < 2) return@Canvas
        val min = data.min()
        val max = data.max()
        val range = (max - min).takeIf { it > 0f } ?: 1f
        val stepX = size.width / (data.size - 1)
        val pad = 4.dp.toPx()
        val usable = size.height - pad * 2
        fun y(v: Float) = pad + usable - (v - min) / range * usable

        val line = Path().apply {
            moveTo(0f, y(data[0]))
            for (i in 1 until data.size) lineTo(i * stepX, y(data[i]))
        }
        val fill = Path().apply {
            addPath(line)
            lineTo(size.width, size.height)
            lineTo(0f, size.height)
            close()
        }
        val c = color()
        drawPath(fill, Brush.verticalGradient(listOf(c.copy(alpha = 0.26f), Color.Transparent)))
        drawPath(line, c, style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round))
        val last = Offset(size.width, y(data.last()))
        drawCircle(c.copy(alpha = 0.25f), radius = 7.dp.toPx(), center = last)
        drawCircle(c, radius = 3.dp.toPx(), center = last)
    }
}
