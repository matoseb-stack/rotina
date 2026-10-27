package br.com.rotina.investimentos.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

object Neon {
    val Background = Color(0xFF000000)
    val Lime = Color(0xFFC6FF00)
    val Cyan = Color(0xFF00F0FF)
    val Purple = Color(0xFFB026FF)
    val Red = Color(0xFFFF3B6B)

    val TextPrimary = Color(0xFFF4F7FA)
    val TextSecondary = Color(0xFFA3ABB8)
    val TextMuted = Color(0xFF5E6672)

    val GlassTop = Color.White.copy(alpha = 0.07f)
    val GlassBottom = Color.White.copy(alpha = 0.02f)
    val Hairline = Color.White.copy(alpha = 0.08f)

    fun trend(value: Double): Color = if (value >= 0) Lime else Red
}

/** Números com largura fixa (tnum) para os preços não "pularem" a cada tick. */
val TabularNumbers = TextStyle(fontFeatureSettings = "tnum")

private val NeonTypography = Typography(
    displaySmall = TextStyle(fontSize = 34.sp, fontWeight = FontWeight.SemiBold, letterSpacing = (-0.5).sp),
    headlineSmall = TextStyle(fontSize = 26.sp, fontWeight = FontWeight.SemiBold),
    titleLarge = TextStyle(fontSize = 20.sp, fontWeight = FontWeight.SemiBold),
    titleMedium = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.SemiBold),
    bodyMedium = TextStyle(fontSize = 14.sp),
    labelMedium = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Medium, letterSpacing = 0.6.sp),
    labelSmall = TextStyle(fontSize = 11.sp, fontWeight = FontWeight.Medium, letterSpacing = 1.4.sp),
)

@Composable
fun NeonTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Neon.Lime,
            secondary = Neon.Cyan,
            tertiary = Neon.Purple,
            background = Neon.Background,
            surface = Neon.Background,
            onBackground = Neon.TextPrimary,
            onSurface = Neon.TextPrimary,
            error = Neon.Red,
        ),
        typography = NeonTypography,
        content = content,
    )
}
