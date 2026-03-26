package com.geoagent.app.util

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import com.geoagent.app.data.local.entity.DrillHoleEntity
import com.geoagent.app.data.local.entity.DrillIntervalEntity
import com.geoagent.app.data.local.entity.LithologyEntity
import com.geoagent.app.data.local.entity.ProjectEntity
import com.geoagent.app.data.local.entity.SampleEntity
import com.geoagent.app.data.local.entity.StationEntity
import com.geoagent.app.data.local.entity.StructuralEntity
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import org.apache.poi.xssf.usermodel.XSSFWorkbook
import java.io.File
import java.io.FileOutputStream
import java.io.FileWriter
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ExportHelper @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private fun getExportDir(): File {
        val dir = File(context.getExternalFilesDir(null), "exports")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    fun exportToExcel(
        project: ProjectEntity,
        stations: List<StationEntity>,
        lithologies: Map<Long, List<LithologyEntity>>,
        structuralData: Map<Long, List<StructuralEntity>>,
        samples: Map<Long, List<SampleEntity>>,
        drillHoles: List<DrillHoleEntity>,
        intervals: Map<Long, List<DrillIntervalEntity>>,
    ): File {
        val workbook = XSSFWorkbook()
        val fileName = "GeoAgent_${project.name}_${DateFormatter.formatForFileName(System.currentTimeMillis())}.xlsx"
        val file = File(getExportDir(), fileName)

        // Stations sheet
        val stationSheet = workbook.createSheet("Estaciones")
        val stationHeader = stationSheet.createRow(0)
        listOf("Codigo", "Latitud", "Longitud", "Altitud", "Fecha", "Geologo", "Descripcion", "Clima")
            .forEachIndexed { i, h -> stationHeader.createCell(i).setCellValue(h) }
        stations.forEachIndexed { idx, s ->
            val row = stationSheet.createRow(idx + 1)
            row.createCell(0).setCellValue(s.code)
            row.createCell(1).setCellValue(s.latitude)
            row.createCell(2).setCellValue(s.longitude)
            row.createCell(3).setCellValue(s.altitude ?: 0.0)
            row.createCell(4).setCellValue(DateFormatter.formatDateTime(s.date))
            row.createCell(5).setCellValue(s.geologist)
            row.createCell(6).setCellValue(s.description)
            row.createCell(7).setCellValue(s.weatherConditions ?: "")
        }

        // Lithology sheet
        val lithoSheet = workbook.createSheet("Litologia")
        val lithoHeader = lithoSheet.createRow(0)
        listOf("Estacion", "Grupo", "Tipo Roca", "Color", "Textura", "Tamano Grano",
            "Mineralogia", "Alteracion", "Intensidad", "Mineralizacion", "%Min",
            "Estructura", "Meteorizacion", "Notas")
            .forEachIndexed { i, h -> lithoHeader.createCell(i).setCellValue(h) }
        var lithoRow = 1
        stations.forEach { station ->
            lithologies[station.id]?.forEach { l ->
                val row = lithoSheet.createRow(lithoRow++)
                row.createCell(0).setCellValue(station.code)
                row.createCell(1).setCellValue(l.rockGroup)
                row.createCell(2).setCellValue(l.rockType)
                row.createCell(3).setCellValue(l.color)
                row.createCell(4).setCellValue(l.texture)
                row.createCell(5).setCellValue(l.grainSize)
                row.createCell(6).setCellValue(l.mineralogy)
                row.createCell(7).setCellValue(l.alteration ?: "")
                row.createCell(8).setCellValue(l.alterationIntensity ?: "")
                row.createCell(9).setCellValue(l.mineralization ?: "")
                row.createCell(10).setCellValue(l.mineralizationPercent ?: 0.0)
                row.createCell(11).setCellValue(l.structure ?: "")
                row.createCell(12).setCellValue(l.weathering ?: "")
                row.createCell(13).setCellValue(l.notes ?: "")
            }
        }

        // Structural sheet
        val structSheet = workbook.createSheet("Estructural")
        val structHeader = structSheet.createRow(0)
        listOf("Estacion", "Tipo", "Rumbo", "Manteo", "Dir. Manteo", "Movimiento",
            "Espesor", "Relleno", "Rugosidad", "Continuidad", "Notas")
            .forEachIndexed { i, h -> structHeader.createCell(i).setCellValue(h) }
        var structRow = 1
        stations.forEach { station ->
            structuralData[station.id]?.forEach { s ->
                val row = structSheet.createRow(structRow++)
                row.createCell(0).setCellValue(station.code)
                row.createCell(1).setCellValue(s.type)
                row.createCell(2).setCellValue(s.strike)
                row.createCell(3).setCellValue(s.dip)
                row.createCell(4).setCellValue(s.dipDirection)
                row.createCell(5).setCellValue(s.movement ?: "")
                row.createCell(6).setCellValue(s.thickness ?: 0.0)
                row.createCell(7).setCellValue(s.filling ?: "")
                row.createCell(8).setCellValue(s.roughness ?: "")
                row.createCell(9).setCellValue(s.continuity ?: "")
                row.createCell(10).setCellValue(s.notes ?: "")
            }
        }

        // Samples sheet
        val sampleSheet = workbook.createSheet("Muestras")
        val sampleHeader = sampleSheet.createRow(0)
        listOf("Estacion", "Codigo", "Tipo", "Peso (kg)", "Largo (m)", "Descripcion",
            "Latitud", "Longitud", "Destino", "Analisis", "Estado", "Notas")
            .forEachIndexed { i, h -> sampleHeader.createCell(i).setCellValue(h) }
        var sampleRow = 1
        stations.forEach { station ->
            samples[station.id]?.forEach { s ->
                val row = sampleSheet.createRow(sampleRow++)
                row.createCell(0).setCellValue(station.code)
                row.createCell(1).setCellValue(s.code)
                row.createCell(2).setCellValue(s.type)
                row.createCell(3).setCellValue(s.weight ?: 0.0)
                row.createCell(4).setCellValue(s.length ?: 0.0)
                row.createCell(5).setCellValue(s.description)
                row.createCell(6).setCellValue(s.latitude ?: 0.0)
                row.createCell(7).setCellValue(s.longitude ?: 0.0)
                row.createCell(8).setCellValue(s.destination ?: "")
                row.createCell(9).setCellValue(s.analysisRequested ?: "")
                row.createCell(10).setCellValue(s.status)
                row.createCell(11).setCellValue(s.notes ?: "")
            }
        }

        // Drill Holes sheet
        val dhSheet = workbook.createSheet("Sondajes")
        val dhHeader = dhSheet.createRow(0)
        listOf("ID Sondaje", "Tipo", "Latitud", "Longitud", "Altitud", "Azimut",
            "Inclinacion", "Prof. Planificada", "Prof. Real", "Estado", "Geologo", "Notas")
            .forEachIndexed { i, h -> dhHeader.createCell(i).setCellValue(h) }
        drillHoles.forEachIndexed { idx, dh ->
            val row = dhSheet.createRow(idx + 1)
            row.createCell(0).setCellValue(dh.holeId)
            row.createCell(1).setCellValue(dh.type)
            row.createCell(2).setCellValue(dh.latitude)
            row.createCell(3).setCellValue(dh.longitude)
            row.createCell(4).setCellValue(dh.altitude ?: 0.0)
            row.createCell(5).setCellValue(dh.azimuth)
            row.createCell(6).setCellValue(dh.inclination)
            row.createCell(7).setCellValue(dh.plannedDepth)
            row.createCell(8).setCellValue(dh.actualDepth ?: 0.0)
            row.createCell(9).setCellValue(dh.status)
            row.createCell(10).setCellValue(dh.geologist)
            row.createCell(11).setCellValue(dh.notes ?: "")
        }

        // Drill Intervals sheet
        val intSheet = workbook.createSheet("Intervalos")
        val intHeader = intSheet.createRow(0)
        listOf("Sondaje", "Desde (m)", "Hasta (m)", "Grupo Roca", "Tipo Roca", "Color",
            "Textura", "Tamano Grano", "Mineralogia", "Alteracion", "Intensidad",
            "Mineralizacion", "%Min", "RQD%", "Recuperacion%", "Estructura", "Meteorizacion", "Notas")
            .forEachIndexed { i, h -> intHeader.createCell(i).setCellValue(h) }
        var intRow = 1
        drillHoles.forEach { dh ->
            intervals[dh.id]?.forEach { iv ->
                val row = intSheet.createRow(intRow++)
                row.createCell(0).setCellValue(dh.holeId)
                row.createCell(1).setCellValue(iv.fromDepth)
                row.createCell(2).setCellValue(iv.toDepth)
                row.createCell(3).setCellValue(iv.rockGroup)
                row.createCell(4).setCellValue(iv.rockType)
                row.createCell(5).setCellValue(iv.color)
                row.createCell(6).setCellValue(iv.texture)
                row.createCell(7).setCellValue(iv.grainSize)
                row.createCell(8).setCellValue(iv.mineralogy)
                row.createCell(9).setCellValue(iv.alteration ?: "")
                row.createCell(10).setCellValue(iv.alterationIntensity ?: "")
                row.createCell(11).setCellValue(iv.mineralization ?: "")
                row.createCell(12).setCellValue(iv.mineralizationPercent ?: 0.0)
                row.createCell(13).setCellValue(iv.rqd ?: 0.0)
                row.createCell(14).setCellValue(iv.recovery ?: 0.0)
                row.createCell(15).setCellValue(iv.structure ?: "")
                row.createCell(16).setCellValue(iv.weathering ?: "")
                row.createCell(17).setCellValue(iv.notes ?: "")
            }
        }

        FileOutputStream(file).use { workbook.write(it) }
        workbook.close()
        return file
    }

    fun exportCollarSurveyAssay(
        project: ProjectEntity,
        drillHoles: List<DrillHoleEntity>,
        intervals: Map<Long, List<DrillIntervalEntity>>,
    ): List<File> {
        val timestamp = DateFormatter.formatForFileName(System.currentTimeMillis())
        val files = mutableListOf<File>()

        // Collar file
        val collarFile = File(getExportDir(), "collar_${project.name}_$timestamp.csv")
        FileWriter(collarFile).use { writer ->
            writer.write("HoleID,Easting,Northing,Elevation,MaxDepth,Type,Azimuth,Dip\n")
            drillHoles.forEach { dh ->
                writer.write("${csvEscape(dh.holeId)},${dh.longitude},${dh.latitude},${dh.altitude ?: 0.0},${dh.actualDepth ?: dh.plannedDepth},${csvEscape(dh.type)},${dh.azimuth},${dh.inclination}\n")
            }
        }
        files.add(collarFile)

        // Survey file
        val surveyFile = File(getExportDir(), "survey_${project.name}_$timestamp.csv")
        FileWriter(surveyFile).use { writer ->
            writer.write("HoleID,Depth,Azimuth,Dip\n")
            drillHoles.forEach { dh ->
                writer.write("${csvEscape(dh.holeId)},0,${dh.azimuth},${dh.inclination}\n")
                val maxDepth = dh.actualDepth ?: dh.plannedDepth
                if (maxDepth > 0) {
                    writer.write("${csvEscape(dh.holeId)},$maxDepth,${dh.azimuth},${dh.inclination}\n")
                }
            }
        }
        files.add(surveyFile)

        // Assay/Lithology file
        val assayFile = File(getExportDir(), "litho_${project.name}_$timestamp.csv")
        FileWriter(assayFile).use { writer ->
            writer.write("HoleID,From,To,RockType,RockGroup,Alteration,Mineralization,MineralPct,RQD,Recovery\n")
            drillHoles.forEach { dh ->
                intervals[dh.id]?.forEach { iv ->
                    writer.write("${csvEscape(dh.holeId)},${iv.fromDepth},${iv.toDepth},${csvEscape(iv.rockType)},${csvEscape(iv.rockGroup)},${csvEscape(iv.alteration)},${csvEscape(iv.mineralization)},${iv.mineralizationPercent ?: ""},${iv.rqd ?: ""},${iv.recovery ?: ""}\n")
                }
            }
        }
        files.add(assayFile)

        return files
    }

    fun exportGeoJson(
        project: ProjectEntity,
        stations: List<StationEntity>,
        drillHoles: List<DrillHoleEntity>,
    ): File {
        val features = mutableListOf<JsonObject>()

        stations.forEach { s ->
            val coords = buildList {
                add(JsonPrimitive(s.longitude))
                add(JsonPrimitive(s.latitude))
                s.altitude?.let { add(JsonPrimitive(it)) }
            }
            features.add(
                JsonObject(mapOf(
                    "type" to JsonPrimitive("Feature"),
                    "geometry" to JsonObject(mapOf(
                        "type" to JsonPrimitive("Point"),
                        "coordinates" to JsonArray(coords),
                    )),
                    "properties" to JsonObject(buildMap {
                        put("type", JsonPrimitive("station"))
                        put("code", JsonPrimitive(s.code))
                        put("geologist", JsonPrimitive(s.geologist))
                        put("description", JsonPrimitive(s.description))
                        put("date", JsonPrimitive(DateFormatter.formatDateTime(s.date)))
                        s.altitude?.let { put("altitude", JsonPrimitive(it)) }
                        s.weatherConditions?.let { put("weatherConditions", JsonPrimitive(it)) }
                    }),
                ))
            )
        }

        drillHoles.forEach { dh ->
            val coords = buildList {
                add(JsonPrimitive(dh.longitude))
                add(JsonPrimitive(dh.latitude))
                dh.altitude?.let { add(JsonPrimitive(it)) }
            }
            features.add(
                JsonObject(mapOf(
                    "type" to JsonPrimitive("Feature"),
                    "geometry" to JsonObject(mapOf(
                        "type" to JsonPrimitive("Point"),
                        "coordinates" to JsonArray(coords),
                    )),
                    "properties" to JsonObject(mapOf(
                        "type" to JsonPrimitive("drillhole"),
                        "holeId" to JsonPrimitive(dh.holeId),
                        "drillType" to JsonPrimitive(dh.type),
                        "geologist" to JsonPrimitive(dh.geologist),
                        "azimuth" to JsonPrimitive(dh.azimuth),
                        "inclination" to JsonPrimitive(dh.inclination),
                        "plannedDepth" to JsonPrimitive(dh.plannedDepth),
                        "actualDepth" to JsonPrimitive(dh.actualDepth ?: 0.0),
                        "status" to JsonPrimitive(dh.status),
                    )),
                ))
            )
        }

        val geoJson = JsonObject(mapOf(
            "type" to JsonPrimitive("FeatureCollection"),
            "name" to JsonPrimitive(project.name),
            "features" to JsonArray(features),
        ))

        val fileName = "GeoAgent_${project.name}_${DateFormatter.formatForFileName(System.currentTimeMillis())}.geojson"
        val file = File(getExportDir(), fileName)
        FileWriter(file).use { it.write(geoJson.toString()) }
        return file
    }

    fun shareFile(context: Context, file: File) {
        val uri: Uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            file
        )
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = getMimeType(file.name)
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(Intent.createChooser(intent, "Compartir archivo"))
    }

    fun shareFiles(context: Context, files: List<File>) {
        val uris = ArrayList<Uri>()
        files.forEach { file ->
            uris.add(
                FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
            )
        }
        val intent = Intent(Intent.ACTION_SEND_MULTIPLE).apply {
            type = "*/*"
            putParcelableArrayListExtra(Intent.EXTRA_STREAM, uris)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(Intent.createChooser(intent, "Compartir archivos"))
    }

    /** Wraps a CSV field in quotes if it contains commas, quotes, or newlines. */
    private fun csvEscape(value: Any?): String {
        val s = value?.toString() ?: ""
        return if (s.contains(',') || s.contains('"') || s.contains('\n')) {
            "\"${s.replace("\"", "\"\"")}\""
        } else {
            s
        }
    }

    private fun getMimeType(fileName: String): String {
        return when {
            fileName.endsWith(".xlsx") -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            fileName.endsWith(".csv") -> "text/csv"
            fileName.endsWith(".pdf") -> "application/pdf"
            fileName.endsWith(".geojson") -> "application/geo+json"
            else -> "application/octet-stream"
        }
    }
}
