package br.com.rotina.investimentos.ui.components

import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/** Formatadores pt-BR reaproveitados (usados apenas na thread principal). */
object Formats {
    private val ptBR: Locale = Locale.forLanguageTag("pt-BR")
    private val currency = NumberFormat.getCurrencyInstance(ptBR)
    private val points = NumberFormat.getNumberInstance(ptBR).apply { maximumFractionDigits = 0 }
    private val clock = SimpleDateFormat("HH:mm:ss", ptBR)

    fun brl(value: Double): String = currency.format(value)
    fun points(value: Double): String = points.format(value)
    fun percent(value: Double, signed: Boolean = true): String =
        String.format(ptBR, if (signed) "%+.2f%%" else "%.2f%%", value)
    fun rate(value: Double, decimals: Int = 2): String = String.format(ptBR, "%.${decimals}f%%", value)
    fun bps(value: Double): String = String.format(ptBR, "%+.1f bps", value)
    fun clock(millis: Long): String = if (millis == 0L) "--:--:--" else clock.format(Date(millis))
}
