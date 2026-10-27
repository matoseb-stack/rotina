package br.com.rotina.investimentos.ui.components

import androidx.compose.animation.animateColor
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutLinearInEasing
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.keyframes
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.State
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import br.com.rotina.investimentos.ui.DashboardTab
import br.com.rotina.investimentos.ui.theme.Neon
import kotlinx.coroutines.delay
import kotlin.math.abs

/**
 * Abas neon com efeito "shuffle":
 *  - a aba selecionada sobe (slideUp com mola) e assume sua cor neon;
 *  - ao trocar de aba, uma onda percorre todas as abas, em cascata pela distância;
 *  - o brilho da aba ativa pulsa e alterna entre limão, ciano e roxo.
 */
@Composable
fun NeonTabs(
    selected: DashboardTab,
    onSelect: (DashboardTab) -> Unit,
    vertical: Boolean,
    modifier: Modifier = Modifier,
) {
    // Uma única InfiniteTransition compartilhada; as abas leem os States só no desenho.
    val transition = rememberInfiniteTransition(label = "neon-tabs")
    val pulse = transition.animateFloat(
        initialValue = 0.45f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(1300, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "pulse",
    )
    val shuffleColor = transition.animateColor(
        initialValue = Neon.Lime,
        targetValue = Neon.Lime,
        animationSpec = infiniteRepeatable(
            keyframes {
                durationMillis = 4800
                Neon.Lime at 0 using LinearEasing
                Neon.Cyan at 1600 using LinearEasing
                Neon.Purple at 3200 using LinearEasing
                Neon.Lime at 4800
            },
        ),
        label = "shuffle-color",
    )

    if (vertical) {
        Column(modifier.selectableGroup(), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            DashboardTab.entries.forEach { tab ->
                NeonTab(tab, selected, pulse, shuffleColor, showSubtitle = true, onClick = { onSelect(tab) }, Modifier.fillMaxWidth())
            }
        }
    } else {
        Row(modifier.selectableGroup(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            DashboardTab.entries.forEach { tab ->
                NeonTab(tab, selected, pulse, shuffleColor, showSubtitle = false, onClick = { onSelect(tab) }, Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun NeonTab(
    tab: DashboardTab,
    selectedTab: DashboardTab,
    pulse: State<Float>,
    shuffleColor: State<Color>,
    showSubtitle: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val selected = tab == selectedTab
    val accent = tab.accent

    val lift = animateDpAsState(
        targetValue = if (selected) (-6).dp else 0.dp,
        animationSpec = spring(dampingRatio = 0.5f, stiffness = Spring.StiffnessMediumLow),
        label = "lift",
    )
    // Onda do shuffle: dispara em cascata a partir da aba escolhida.
    val wave = remember { Animatable(0f) }
    LaunchedEffect(selectedTab) {
        delay(abs(tab.ordinal - selectedTab.ordinal) * 70L)
        wave.animateTo(1f, tween(120, easing = FastOutLinearInEasing))
        wave.animateTo(0f, spring(dampingRatio = 0.35f, stiffness = Spring.StiffnessLow))
    }
    val glowStrength = animateFloatAsState(if (selected) 1f else 0f, tween(450), label = "glow")
    val contentColor by animateColorAsState(if (selected) accent else Neon.TextSecondary, tween(380), label = "content")
    val fill by animateColorAsState(
        if (selected) accent.copy(alpha = 0.10f) else Color.White.copy(alpha = 0.03f),
        tween(380),
        label = "fill",
    )
    val border by animateColorAsState(if (selected) accent.copy(alpha = 0.85f) else Neon.Hairline, tween(380), label = "border")
    val shape = RoundedCornerShape(18.dp)

    Box(
        modifier
            .offset { IntOffset(0, (lift.value - 5.dp * wave.value).roundToPx()) }
            .neonGlow(
                color = { lerp(accent, shuffleColor.value, 0.35f) },
                alpha = { glowStrength.value * pulse.value },
            )
            .clip(shape)
            .background(Brush.verticalGradient(listOf(fill, Color.Transparent)))
            .background(Color.Black.copy(alpha = 0.55f))
            .border(1.dp, border, shape)
            .selectable(selected = selected, onClick = onClick, role = Role.Tab)
            // Barra indicadora na lateral, crescendo com a seleção.
            .drawBehind {
                val h = size.height * 0.5f * glowStrength.value
                if (h > 0f) {
                    drawRoundRect(
                        color = accent,
                        topLeft = Offset(0f, (size.height - h) / 2),
                        size = Size(3.dp.toPx(), h),
                        cornerRadius = CornerRadius(2.dp.toPx()),
                    )
                }
            }
            .padding(horizontal = 18.dp, vertical = if (showSubtitle) 16.dp else 12.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(tab.number, color = contentColor.copy(alpha = 0.7f), style = MaterialTheme.typography.labelSmall)
            Spacer(Modifier.width(12.dp))
            Column {
                Text(
                    tab.title,
                    color = contentColor,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                    maxLines = 1,
                )
                if (showSubtitle) {
                    Spacer(Modifier.height(2.dp))
                    Text(tab.subtitle, color = if (selected) Neon.TextSecondary else Neon.TextMuted, style = MaterialTheme.typography.labelMedium, maxLines = 1)
                }
            }
        }
    }
}

/** Ponto "AO VIVO" pulsante; o alpha é aplicado no desenho, sem recomposição. */
@Composable
fun LiveBadge(modifier: Modifier = Modifier) {
    val transition = rememberInfiniteTransition(label = "live")
    val alpha = transition.animateFloat(
        initialValue = 1f,
        targetValue = 0.25f,
        animationSpec = infiniteRepeatable(tween(900), RepeatMode.Reverse),
        label = "live-alpha",
    )
    Row(
        modifier
            .clip(RoundedCornerShape(50))
            .border(1.dp, Neon.Lime.copy(alpha = 0.35f), RoundedCornerShape(50))
            .padding(horizontal = 12.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            Modifier
                .padding(end = 8.dp)
                .width(8.dp)
                .height(8.dp)
                .drawBehind { drawCircle(Neon.Lime.copy(alpha = alpha.value)) },
        )
        Text("AO VIVO", color = Neon.Lime, style = MaterialTheme.typography.labelSmall)
    }
}
