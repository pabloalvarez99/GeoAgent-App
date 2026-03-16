package com.geoagent.app.ui.screens.export

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.local.entity.DrillHoleEntity
import com.geoagent.app.data.local.entity.DrillIntervalEntity
import com.geoagent.app.data.local.entity.StationEntity
import com.geoagent.app.data.repository.DrillHoleRepository
import com.geoagent.app.data.repository.ProjectRepository
import com.geoagent.app.data.repository.StationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileWriter
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import javax.inject.Inject

enum class ExportType {
    EXCEL_CSV,
    PDF_REPORT,
    COLLAR_SURVEY_ASSAY,
    GEOJSON,
}

data class ExportState(
    val isExporting: Boolean = false,
    val currentExport: ExportType? = null,
    val lastExportedFile: File? = null,
    val error: String? = null,
)

@HiltViewModel
class ExportViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    @ApplicationContext private val context: Context,
    private val projectRepository: ProjectRepository,
    private val stationRepository: StationRepository,
    private val drillHoleRepository: DrillHoleRepository,
) : ViewModel() {

    private val projectId: Long = savedStateHandle["projectId"] ?: 0L

    private val _exportState = MutableStateFlow(ExportState())
    val exportState: StateFlow<ExportState> = _exportState.asStateFlow()

    private fun getExportDir(): File {
        val dir = File(context.getExternalFilesDir(null), "exports")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    fun export(type: ExportType) {
        if (_exportState.value.isExporting) return

        viewModelScope.launch {
            _exportState.value = ExportState(isExporting = true, currentExport = type)
            try {
                val file = when (type) {
                    ExportType.EXCEL_CSV -> exportCsv()
                    ExportType.PDF_REPORT -> exportPdfReport()
                    ExportType.COLLAR_SURVEY_ASSAY -> exportCollarSurveyAssay()
                    ExportType.GEOJSON -> exportGeoJson()
                }
                _exportState.value = ExportState(lastExportedFile = file)
            } catch (e: Exception) {
                _exportState.value = ExportState(error = e.message ?: "Error al exportar")
            }
        }
    }

    fun shareFile(file: File) {
        val uri: Uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            file,
        )

        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            putExtra(Intent.EXTRA_STREAM, uri)
            type = when {
                file.name.endsWith(".csv") -> "text/csv"
                file.name.endsWith(".pdf") -> "application/pdf"
                file.name.endsWith(".geojson") -> "application/geo+json"
                else -> "application/octet-stream"
            }
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        context.startActivity(Intent.createChooser(shareIntent, "Compartir archivo").apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        })
    }

    fun clearState() {
        _exportState.value = ExportState()
    }

    private suspend fun exportCsv(): File {
        val project = projectRepository.getById(projectId).first()
        val stations = stationRepository.getByProject(projectId).first()
        val drillHoles = drillHoleRepository.getByProject(projectId).first()

        val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
        val file = File(getExportDir(), "proyecto_${project?.name?.replace(" ", "_") ?: projectId}_$timestamp.csv")

        FileWriter(file).use { writer ->
            // Stations section
            writer.append("ESTACIONES\n")
            writer.append("Codigo,Latitud,Longitud,Altitud,Geologo,Descripcion,Fecha\n")
            val dateFormat = SimpleDateFormat("dd/MM/yyyy", Locale("es"))
            stations.forEach { station ->
                writer.append("${station.code},${station.latitude},${station.longitude},${station.altitude ?: ""},${station.geologist},\"${station.description}\",${dateFormat.format(Date(station.date))}\n")
            }

            writer.append("\n")

            // Drill holes section
            writer.append("SONDAJES\n")
            writer.append("HoleID,Tipo,Latitud,Longitud,Azimut,Inclinacion,Prof.Planificada,Prof.Actual,Estado,Geologo\n")
            drillHoles.forEach { dh ->
                writer.append("${dh.holeId},${dh.type},${dh.latitude},${dh.longitude},${dh.azimuth},${dh.inclination},${dh.plannedDepth},${dh.actualDepth ?: ""},${dh.status},${dh.geologist}\n")
            }
        }

        return file
    }

    private suspend fun exportPdfReport(): File {
        // PDF generation is placeholder -- produces a text-based report
        val project = projectRepository.getById(projectId).first()
        val stations = stationRepository.getByProject(projectId).first()
        val drillHoles = drillHoleRepository.getByProject(projectId).first()

        val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
        val file = File(getExportDir(), "reporte_${project?.name?.replace(" ", "_") ?: projectId}_$timestamp.txt")

        FileWriter(file).use { writer ->
            writer.append("REPORTE DE PROYECTO\n")
            writer.append("==================\n\n")
            writer.append("Proyecto: ${project?.name ?: "N/A"}\n")
            writer.append("Descripcion: ${project?.description ?: "N/A"}\n")
            writer.append("Ubicacion: ${project?.location ?: "N/A"}\n")
            writer.append("Fecha de reporte: ${SimpleDateFormat("dd/MM/yyyy HH:mm", Locale("es")).format(Date())}\n\n")

            writer.append("ESTACIONES (${stations.size})\n")
            writer.append("---------\n")
            stations.forEach { station ->
                writer.append("  ${station.code} - Lat: ${station.latitude}, Lng: ${station.longitude}\n")
                writer.append("  Geologo: ${station.geologist}\n")
                writer.append("  ${station.description}\n\n")
            }

            writer.append("SONDAJES (${drillHoles.size})\n")
            writer.append("--------\n")
            drillHoles.forEach { dh ->
                writer.append("  ${dh.holeId} - ${dh.type} - ${dh.status}\n")
                writer.append("  Coordenadas: ${dh.latitude}, ${dh.longitude}\n")
                writer.append("  Azimut: ${dh.azimuth}, Inclinacion: ${dh.inclination}\n")
                writer.append("  Profundidad: ${dh.actualDepth ?: 0.0} / ${dh.plannedDepth} m\n\n")
            }
        }

        return file
    }

    private suspend fun exportCollarSurveyAssay(): File {
        val drillHoles = drillHoleRepository.getByProject(projectId).first()
        val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
        val exportDir = File(getExportDir(), "mining_$timestamp")
        if (!exportDir.exists()) exportDir.mkdirs()

        // collar.csv
        val collarFile = File(exportDir, "collar.csv")
        FileWriter(collarFile).use { writer ->
            writer.append("HOLEID,EAST,NORTH,ELEV,DEPTH\n")
            drillHoles.forEach { dh ->
                writer.append("${dh.holeId},${dh.longitude},${dh.latitude},${dh.altitude ?: 0.0},${dh.plannedDepth}\n")
            }
        }

        // survey.csv
        val surveyFile = File(exportDir, "survey.csv")
        FileWriter(surveyFile).use { writer ->
            writer.append("HOLEID,DEPTH,AZIMUTH,DIP\n")
            drillHoles.forEach { dh ->
                writer.append("${dh.holeId},0,${dh.azimuth},${dh.inclination}\n")
                // Add end-of-hole survey
                val depth = dh.actualDepth ?: dh.plannedDepth
                writer.append("${dh.holeId},$depth,${dh.azimuth},${dh.inclination}\n")
            }
        }

        // assay.csv (intervals)
        val assayFile = File(exportDir, "assay.csv")
        FileWriter(assayFile).use { writer ->
            writer.append("HOLEID,FROM,TO,ROCKTYPE,ALTERATION,MINERALIZATION,MINERALIZATION_PCT\n")
            drillHoles.forEach { dh ->
                val intervals = drillHoleRepository.getIntervals(dh.id).first()
                intervals.forEach { interval ->
                    writer.append("${dh.holeId},${interval.fromDepth},${interval.toDepth},${interval.rockType},${interval.alteration ?: ""},${interval.mineralization ?: ""},${interval.mineralizationPercent ?: ""}\n")
                }
            }
        }

        // Return collar file for sharing (user can navigate to directory)
        return collarFile
    }

    private suspend fun exportGeoJson(): File {
        val project = projectRepository.getById(projectId).first()
        val stations = stationRepository.getByProject(projectId).first()
        val drillHoles = drillHoleRepository.getByProject(projectId).first()

        val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
        val file = File(getExportDir(), "proyecto_${project?.name?.replace(" ", "_") ?: projectId}_$timestamp.geojson")

        val features = buildString {
            val allFeatures = mutableListOf<String>()

            stations.forEach { station ->
                allFeatures.add(
                    """{"type":"Feature","geometry":{"type":"Point","coordinates":[${station.longitude},${station.latitude}]},"properties":{"type":"station","code":"${station.code}","geologist":"${station.geologist}","description":"${station.description.replace("\"", "\\\"")}"}}"""
                )
            }

            drillHoles.forEach { dh ->
                allFeatures.add(
                    """{"type":"Feature","geometry":{"type":"Point","coordinates":[${dh.longitude},${dh.latitude}]},"properties":{"type":"drillhole","holeId":"${dh.holeId}","drillType":"${dh.type}","status":"${dh.status}","plannedDepth":${dh.plannedDepth},"actualDepth":${dh.actualDepth ?: 0.0}}}"""
                )
            }

            append("""{"type":"FeatureCollection","features":[${allFeatures.joinToString(",")}]}""")
        }

        FileWriter(file).use { writer ->
            writer.append(features)
        }

        return file
    }
}
