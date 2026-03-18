package com.geoagent.app.ui.screens.export

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.repository.DrillHoleRepository
import com.geoagent.app.data.repository.LithologyRepository
import com.geoagent.app.data.repository.ProjectRepository
import com.geoagent.app.data.repository.SampleRepository
import com.geoagent.app.data.repository.StationRepository
import com.geoagent.app.data.repository.StructuralRepository
import com.geoagent.app.util.ExportHelper
import com.geoagent.app.util.PdfReportGenerator
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.io.BufferedOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.FileWriter
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream
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
    private val lithologyRepository: LithologyRepository,
    private val structuralRepository: StructuralRepository,
    private val sampleRepository: SampleRepository,
    private val pdfReportGenerator: PdfReportGenerator,
    private val exportHelper: ExportHelper,
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
                    ExportType.EXCEL_CSV -> exportExcel()
                    ExportType.PDF_REPORT -> exportPdfReport()
                    ExportType.COLLAR_SURVEY_ASSAY -> exportCollarSurveyAssay()
                    ExportType.GEOJSON -> exportGeoJson()
                }
                _exportState.value = ExportState(currentExport = type, lastExportedFile = file)
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
                file.name.endsWith(".xlsx") -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                file.name.endsWith(".csv") -> "text/csv"
                file.name.endsWith(".pdf") -> "application/pdf"
                file.name.endsWith(".geojson") -> "application/geo+json"
                file.name.endsWith(".zip") -> "application/zip"
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

    private suspend fun exportExcel(): File {
        val project = projectRepository.getById(projectId).first() ?: error("Proyecto no encontrado")
        val stations = stationRepository.getByProject(projectId).first()
        val drillHoles = drillHoleRepository.getByProject(projectId).first()
        val lithologies = stations.associate { it.id to lithologyRepository.getByStation(it.id).first() }
        val structuralData = stations.associate { it.id to structuralRepository.getByStation(it.id).first() }
        val samples = stations.associate { it.id to sampleRepository.getByStation(it.id).first() }
        val intervals = drillHoles.associate { it.id to drillHoleRepository.getIntervals(it.id).first() }
        return exportHelper.exportToExcel(project, stations, lithologies, structuralData, samples, drillHoles, intervals)
    }

    private suspend fun exportPdfReport(): File {
        val project = projectRepository.getById(projectId).first() ?: error("Proyecto no encontrado")
        val stations = stationRepository.getByProject(projectId).first()
        val drillHoles = drillHoleRepository.getByProject(projectId).first()

        val lithologies = stations.associate { station ->
            station.id to lithologyRepository.getByStation(station.id).first()
        }
        val structuralData = stations.associate { station ->
            station.id to structuralRepository.getByStation(station.id).first()
        }
        val samples = stations.associate { station ->
            station.id to sampleRepository.getByStation(station.id).first()
        }
        val intervals = drillHoles.associate { dh ->
            dh.id to drillHoleRepository.getIntervals(dh.id).first()
        }

        return pdfReportGenerator.generateProjectReport(
            project = project,
            stations = stations,
            lithologies = lithologies,
            structuralData = structuralData,
            samples = samples,
            drillHoles = drillHoles,
            intervals = intervals,
        )
    }

    private suspend fun exportCollarSurveyAssay(): File {
        val drillHoles = drillHoleRepository.getByProject(projectId).first()
        val project = projectRepository.getById(projectId).first()
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

        // ZIP all files together for easy sharing
        val projectName = project?.name?.replace(Regex("[^a-zA-Z0-9_-]"), "_") ?: "project"
        val zipFile = File(getExportDir(), "${projectName}_mining_$timestamp.zip")
        ZipOutputStream(BufferedOutputStream(FileOutputStream(zipFile))).use { zos ->
            listOf(collarFile, surveyFile, assayFile).forEach { file ->
                zos.putNextEntry(ZipEntry(file.name))
                file.inputStream().use { it.copyTo(zos) }
                zos.closeEntry()
            }
        }

        // Clean up individual files
        exportDir.deleteRecursively()

        return zipFile
    }

    private suspend fun exportGeoJson(): File {
        val project = projectRepository.getById(projectId).first() ?: error("Proyecto no encontrado")
        val stations = stationRepository.getByProject(projectId).first()
        val drillHoles = drillHoleRepository.getByProject(projectId).first()
        return exportHelper.exportGeoJson(project, stations, drillHoles)
    }
}
