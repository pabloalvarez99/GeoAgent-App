package com.geoagent.app.ui.screens.drillhole

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.geoagent.app.ui.components.ConfirmDeleteDialog
import com.geoagent.app.ui.components.SyncStatusBadge
import com.geoagent.app.util.FormValidation
import com.geoagent.app.data.local.entity.DrillHoleEntity
import com.geoagent.app.data.local.entity.DrillIntervalEntity
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DrillHoleDetailScreen(
    drillHoleId: Long,
    onNavigateToInterval: (Long?) -> Unit,
    onNavigateToPhotos: () -> Unit,
    onNavigateToCamera: () -> Unit,
    onNavigateToEdit: () -> Unit,
    onNavigateBack: () -> Unit,
    viewModel: DrillHoleDetailViewModel = hiltViewModel(),
) {
    val drillHole by viewModel.drillHole.collectAsState()
    val intervals by viewModel.intervals.collectAsState()
    val photoCount by viewModel.photoCount.collectAsState()
    var showDeleteDialog by rememberSaveable { mutableStateOf(false) }
    var intervalToDelete by rememberSaveable { mutableStateOf<Long?>(null) }

    if (showDeleteDialog) {
        ConfirmDeleteDialog(
            title = "Eliminar sondaje",
            message = "Se eliminara el sondaje ${drillHole?.holeId ?: ""} y todos sus intervalos. Esta accion no se puede deshacer.",
            onConfirm = {
                showDeleteDialog = false
                viewModel.deleteDrillHole(onNavigateBack)
            },
            onDismiss = { showDeleteDialog = false },
        )
    }

    intervalToDelete?.let { intervalId ->
        val interval = intervals.find { it.id == intervalId }
        if (interval != null) {
            ConfirmDeleteDialog(
                title = "Eliminar intervalo",
                message = "Se eliminara el intervalo ${"%.1f".format(interval.fromDepth)}-${"%.1f".format(interval.toDepth)} m. Esta accion no se puede deshacer.",
                onConfirm = {
                    viewModel.deleteInterval(interval)
                    intervalToDelete = null
                },
                onDismiss = { intervalToDelete = null },
            )
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = drillHole?.holeId ?: "Sondaje",
                        fontWeight = FontWeight.SemiBold,
                    )
                },
                navigationIcon = {
                    IconButton(
                        onClick = onNavigateBack,
                        modifier = Modifier.size(48.dp),
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Volver",
                        )
                    }
                },
                actions = {
                    IconButton(
                        onClick = onNavigateToEdit,
                        modifier = Modifier.size(48.dp),
                    ) {
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = "Editar sondaje",
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer,
                    navigationIconContentColor = MaterialTheme.colorScheme.onPrimaryContainer,
                    actionIconContentColor = MaterialTheme.colorScheme.onPrimaryContainer,
                ),
            )
        },
    ) { innerPadding ->
        val hole = drillHole
        if (hole == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentAlignment = Alignment.Center,
            ) {
                CircularProgressIndicator()
            }
            return@Scaffold
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            // Info card
            item {
                Spacer(modifier = Modifier.height(4.dp))
                DrillHoleInfoCard(drillHole = hole)
            }

            // Status selector
            item {
                StatusSelector(
                    currentStatus = hole.status,
                    onStatusSelected = { viewModel.updateStatus(it) },
                )
            }

            // Quick depth update
            item {
                DepthUpdateCard(
                    currentDepth = hole.actualDepth ?: 0.0,
                    plannedDepth = hole.plannedDepth,
                    onUpdateDepth = { viewModel.updateActualDepth(it) },
                )
            }

            // Intervals section header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Text(
                            text = "Intervalos de Logging",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                        if (intervals.isNotEmpty()) {
                            Text(
                                text = "(${intervals.size})",
                                style = MaterialTheme.typography.bodyLarge,
                                color = MaterialTheme.colorScheme.outline,
                            )
                        }
                    }

                    Button(
                        onClick = { onNavigateToInterval(null) },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary,
                        ),
                    ) {
                        Icon(
                            imageVector = Icons.Default.Add,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp),
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Agregar")
                    }
                }
            }

            // Interval items
            if (intervals.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant,
                        ),
                    ) {
                        Text(
                            text = "Sin intervalos registrados",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(20.dp),
                        )
                    }
                }
            } else {
                items(intervals, key = { it.id }) { interval ->
                    IntervalCard(
                        interval = interval,
                        onClick = { onNavigateToInterval(interval.id) },
                        onDeleteClick = { intervalToDelete = interval.id },
                    )
                }
            }

            // Bottom actions
            item {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    OutlinedButton(
                        onClick = onNavigateToCamera,
                        modifier = Modifier
                            .weight(1f)
                            .height(52.dp),
                    ) {
                        Icon(
                            imageVector = Icons.Default.CameraAlt,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp),
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Camara")
                    }

                    OutlinedButton(
                        onClick = onNavigateToPhotos,
                        modifier = Modifier
                            .weight(1f)
                            .height(52.dp),
                    ) {
                        Icon(
                            imageVector = Icons.Default.PhotoLibrary,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp),
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Fotos ($photoCount)")
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))

                // Delete button
                OutlinedButton(
                    onClick = { showDeleteDialog = true },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = MaterialTheme.colorScheme.error,
                    ),
                ) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp),
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Eliminar sondaje")
                }

                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}

@Composable
private fun DrillHoleInfoCard(drillHole: DrillHoleEntity) {
    val dateFormat = SimpleDateFormat("dd/MM/yyyy", Locale("es"))

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant,
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(
                text = "Informacion del Sondaje",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            HorizontalDivider()

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                DetailField(label = "Tipo", value = drillHole.type)
                DetailField(
                    label = "Estado",
                    value = drillHole.status,
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                DetailField(
                    label = "Coordenadas",
                    value = "${"%.6f".format(drillHole.latitude)}, ${"%.6f".format(drillHole.longitude)}"
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                DetailField(label = "Azimut", value = "${"%.1f".format(drillHole.azimuth)} grados")
                DetailField(label = "Inclinacion", value = "${"%.1f".format(drillHole.inclination)} grados")
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                DetailField(
                    label = "Prof. Planificada",
                    value = "${"%.1f".format(drillHole.plannedDepth)} m",
                )
                DetailField(
                    label = "Prof. Actual",
                    value = "${"%.1f".format(drillHole.actualDepth ?: 0.0)} m",
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                DetailField(
                    label = "Fecha Inicio",
                    value = drillHole.startDate?.let { dateFormat.format(Date(it)) } ?: "No registrada",
                )
                DetailField(
                    label = "Fecha Fin",
                    value = drillHole.endDate?.let { dateFormat.format(Date(it)) } ?: "No registrada",
                )
            }

            DetailField(label = "Geologo", value = drillHole.geologist)

            if (!drillHole.notes.isNullOrBlank()) {
                DetailField(label = "Notas", value = drillHole.notes)
            }

            HorizontalDivider()
            SyncStatusBadge(syncStatus = drillHole.syncStatus)
        }
    }
}

@Composable
private fun DetailField(label: String, value: String) {
    Column {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onSurface,
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun StatusSelector(
    currentStatus: String,
    onStatusSelected: (String) -> Unit,
) {
    val statuses = listOf("En Progreso", "Completado", "Suspendido", "Abandonado")

    Column {
        Text(
            text = "Estado del Sondaje",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSurface,
        )
        Spacer(modifier = Modifier.height(8.dp))
        FlowRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            statuses.forEach { status ->
                FilterChip(
                    selected = currentStatus == status,
                    onClick = { onStatusSelected(status) },
                    label = {
                        Text(
                            text = status,
                            style = MaterialTheme.typography.labelLarge,
                        )
                    },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = when (status) {
                            "En Progreso" -> MaterialTheme.colorScheme.tertiaryContainer
                            "Completado" -> MaterialTheme.colorScheme.primaryContainer
                            "Suspendido" -> MaterialTheme.colorScheme.secondaryContainer
                            "Abandonado" -> MaterialTheme.colorScheme.errorContainer
                            else -> MaterialTheme.colorScheme.surfaceVariant
                        },
                    ),
                    modifier = Modifier.height(40.dp),
                )
            }
        }
    }
}

@Composable
private fun IntervalCard(
    interval: DrillIntervalEntity,
    onClick: () -> Unit,
    onDeleteClick: () -> Unit,
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface,
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(start = 14.dp, top = 8.dp, bottom = 14.dp, end = 4.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "${"%.1f".format(interval.fromDepth)} - ${"%.1f".format(interval.toDepth)} m",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.weight(1f),
                )
                Text(
                    text = interval.rockType,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f),
                )
                IconButton(
                    onClick = onDeleteClick,
                    modifier = Modifier.size(36.dp),
                ) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Eliminar intervalo",
                        tint = MaterialTheme.colorScheme.error,
                        modifier = Modifier.size(18.dp),
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                if (!interval.alteration.isNullOrBlank()) {
                    Text(
                        text = "Alt: ${interval.alteration}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                if (!interval.mineralization.isNullOrBlank()) {
                    Text(
                        text = "Min: ${interval.mineralization}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                if (interval.mineralizationPercent != null) {
                    Text(
                        text = "${"%.1f".format(interval.mineralizationPercent)}%",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}

@Composable
private fun DepthUpdateCard(
    currentDepth: Double,
    plannedDepth: Double,
    onUpdateDepth: (Double) -> Unit,
) {
    var isEditing by rememberSaveable { mutableStateOf(false) }
    var depthText by rememberSaveable { mutableStateOf("") }
    val progress = if (plannedDepth > 0) (currentDepth / plannedDepth).toFloat().coerceIn(0f, 1f) else 0f

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.tertiaryContainer,
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "Profundidad Actual",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onTertiaryContainer,
                )

                if (!isEditing) {
                    TextButton(
                        onClick = {
                            depthText = "%.1f".format(currentDepth)
                            isEditing = true
                        },
                    ) {
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Actualizar")
                    }
                }
            }

            if (isEditing) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    OutlinedTextField(
                        value = depthText,
                        onValueChange = { depthText = it },
                        label = { Text("Metros") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                    )

                    Button(
                        onClick = {
                            FormValidation.parseDouble(depthText)?.let { depth ->
                                onUpdateDepth(depth)
                                isEditing = false
                            }
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary,
                        ),
                    ) {
                        Text("Guardar")
                    }

                    TextButton(onClick = { isEditing = false }) {
                        Text("Cancelar")
                    }
                }
            } else {
                Text(
                    text = "${"%.1f".format(currentDepth)} / ${"%.1f".format(plannedDepth)} m  (${"%.0f".format(progress * 100)}%)",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onTertiaryContainer,
                )
            }

            androidx.compose.material3.LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(10.dp),
                color = MaterialTheme.colorScheme.tertiary,
                trackColor = MaterialTheme.colorScheme.onTertiaryContainer.copy(alpha = 0.15f),
            )
        }
    }
}
