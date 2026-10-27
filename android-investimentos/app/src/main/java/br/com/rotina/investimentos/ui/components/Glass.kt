package br.com.rotina.investimentos.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import br.com.rotina.investimentos.ui.theme.Neon

/** Card com glassmorphism sutil: gradiente translúcido + hairline que puxa a cor de destaque. */
@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    accent: Color = Color.White,
    contentPadding: PaddingValues = PaddingValues(20.dp),
    content: @Composable ColumnScope.() -> Unit,
) {
    val shape = RoundedCornerShape(22.dp)
    Column(
        modifier = modifier
            .clip(shape)
            .background(Brush.linearGradient(listOf(Neon.GlassTop, Neon.GlassBottom)))
            .border(
                width = 1.dp,
                brush = Brush.linearGradient(listOf(Color.White.copy(alpha = 0.14f), accent.copy(alpha = 0.06f))),
                shape = shape,
            )
            .padding(contentPadding),
        content = content,
    )
}

/**
 * Brilho neon desenhado atrás do elemento. Cor e intensidade são lambdas lidas
 * só na fase de desenho, então animá-las não causa recomposição.
 */
fun Modifier.neonGlow(
    color: () -> Color,
    alpha: () -> Float,
    radius: Dp = 18.dp,
    cornerRadius: Dp = 18.dp,
): Modifier = drawWithCache {
    val paint = Paint().asFrameworkPaint()
    val blur = radius.toPx()
    val corner = cornerRadius.toPx()
    onDrawBehind {
        val strength = alpha().coerceIn(0f, 1f)
        if (strength > 0.01f) {
            val glow = color()
            paint.color = glow.copy(alpha = 0.18f * strength).toArgb()
            paint.setShadowLayer(blur, 0f, 0f, glow.copy(alpha = 0.85f * strength).toArgb())
            drawIntoCanvas {
                it.nativeCanvas.drawRoundRect(0f, 0f, size.width, size.height, corner, corner, paint)
            }
        }
    }
}

/** Fundo preto com halos neon bem discretos para o vidro ter o que "refratar". */
fun Modifier.neonBackdrop(): Modifier = drawBehind {
    drawRect(Neon.Background)
    fun halo(color: Color, center: Offset, radius: Float) = drawCircle(
        brush = Brush.radialGradient(listOf(color.copy(alpha = 0.10f), Color.Transparent), center, radius),
        radius = radius,
        center = center,
    )
    halo(Neon.Purple, Offset(size.width * 0.05f, size.height * 0.1f), size.minDimension * 0.6f)
    halo(Neon.Cyan, Offset(size.width * 0.95f, size.height * 0.2f), size.minDimension * 0.5f)
    halo(Neon.Lime, Offset(size.width * 0.6f, size.height * 1.05f), size.minDimension * 0.55f)
}
