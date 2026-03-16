package com.geoagent.app.ui.screens.export

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.PictureAsPdf
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.TableChart
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExportScreen(
    projectId: Long,
    onNavigateBack: () -> Unit,
    viewModel: ExportViewModel = hiltViewModel(),
) {
    val exportState by viewModel.exportState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(exportState.error) {
        exportState.error?.let { error ->
            snackbarHostState.showSnackbar(error)
            viewModel.clearState()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Exportar Datos") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Volver",
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer,
                ),
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            ExportCard(
                icon = Icons.Default.TableChart,
                title = "Excel / CSV",
                description = "Exporta todos los datos del proyecto (estaciones, sondajes) en formato CSV compatible con Excel.",
                isExporting = exportState.isExporting && exportState.currentExport == ExportType.EXCEL_CSV,
                exportedFile = if (exportState.currentExport == ExportType.EXCEL_CSV) exportState.lastExportedFile else null,
                onExport = { viewModel.export(ExportType.EXCEL_CSV) },
                onShare = { exportState.lastExportedFile?.let { viewModel.shareFile(it) } },
            )

            ExportCard(
                icon = Icons.Default.PictureAsPdf,
                title = "Reporte PDF",
                description = "Genera un reporte formateado con toda la informacion del proyecto, estaciones y sondajes.",
                isExporting = exportState.isExporting && exportState.currentExport == ExportType.PDF_REPORT,
                exportedFile = if (exportState.currentExport == ExportType.PDF_REPORT) exportState.lastExportedFile else null,
                onExport = { viewModel.export(ExportType.PDF_REPORT) },
                onShare = { exportState.lastExportedFile?.let { viewModel.shareFile(it) } },
            )

            ExportCard(
                icon = Icons.Default.Description,
                title = "Collar / Survey / Assay",
                description = "Exporta datos de sondajes en formatos estandar de mineria (collar.csv, survey.csv, assay.csv).",
                isExporting = exportState.isExporting && exportState.currentExport == ExportType.COLLAR_SURVEY_ASSAY,
                exportedFile = if (exportState.currentExport == ExportType.COLLAR_SURVEY_ASSAY) exportState.lastExportedFile else null,
                onExport = { viewModel.export(ExportType.COLLAR_SURVEY_ASSAY) },
                onShare = { exportState.lastExportedFile?.let { viewModel.shareFile(it) } },
            )

            ExportCard(
                icon = Icons.Default.Map,
                title = "GeoJSON",
                description = "Exporta estaciones y sondajes como GeoJSON para usar en sistemas GIS (QGIS, ArcGIS, etc.).",
                isExporting = exportState.isExporting && exportState.currentExport == ExportType.GEOJSON,
                exportedFile = if (exportState.currentExport == ExportType.GEOJSON) exportState.lastExportedFile else null,
                onExport = { viewModel.export(ExportType.GEOJSON) },
                onShare = { exportState.lastExportedFile?.let { viewModel.shareFile(it) } },
            )

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
private fun ExportCard(
    icon: ImageVector,
    title: String,
    description: String,
    isExporting: Boolean,
    exportedFile: java.io.File?,
    onExport: () -> Unit,
    onShare: () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface,
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    modifier = Modifier.size(32.dp),
                    tint = MaterialTheme.colorScheme.primary,
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface,
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Button(
                    onClick = onExport,
                    enabled = !isExporting,
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary,
                    ),
                ) {
                    if (isExporting) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = MaterialTheme.colorScheme.onPrimary,
                            strokeWidth = 2.dp,
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Exportando...")
                    } else {
                        Text("Exportar")
                    }
                }

                if (exportedFile != null) {
                    OutlinedButton(
                        onClick = onShare,
                        modifier = Modifier.height(48.dp),
                    ) {
                        Icon(
                            imageVector = Icons.Default.Share,
                            contentDescription = "Compartir",
                            modifier = Modifier.size(18.dp),
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Compartir")
                    }
                }
            }
        }
    }
}
