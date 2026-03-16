package com.geoagent.app.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.CloudQueue
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Composable
fun ConnectionIndicator(
    isConnected: Boolean,
    modifier: Modifier = Modifier,
) {
    val backgroundColor by animateColorAsState(
        targetValue = if (isConnected) Color(0xFF22C55E) else Color(0xFFEF4444),
        label = "connectionColor",
    )

    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(backgroundColor.copy(alpha = 0.15f))
            .padding(horizontal = 16.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center,
    ) {
        Icon(
            imageVector = if (isConnected) Icons.Default.CloudQueue else Icons.Default.CloudOff,
            contentDescription = null,
            modifier = Modifier.size(16.dp),
            tint = if (isConnected) Color(0xFF22C55E) else Color(0xFFEF4444),
        )

        Text(
            text = if (isConnected) "Conectado" else "Sin conexion - Modo offline",
            style = MaterialTheme.typography.labelSmall,
            color = if (isConnected) Color(0xFF22C55E) else Color(0xFFEF4444),
            modifier = Modifier.padding(start = 6.dp),
        )
    }
}
