package br.com.rotina.investimentos

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import br.com.rotina.investimentos.ui.screens.InvestmentDashboardScreen
import br.com.rotina.investimentos.ui.theme.NeonTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            NeonTheme {
                InvestmentDashboardScreen()
            }
        }
    }
}
