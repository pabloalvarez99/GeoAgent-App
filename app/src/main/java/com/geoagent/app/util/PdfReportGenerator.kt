package com.geoagent.app.util

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.pdf.PdfDocument
import com.geoagent.app.data.local.entity.DrillHoleEntity
import com.geoagent.app.data.local.entity.DrillIntervalEntity
import com.geoagent.app.data.local.entity.LithologyEntity
import com.geoagent.app.data.local.entity.ProjectEntity
import com.geoagent.app.data.local.entity.SampleEntity
import com.geoagent.app.data.local.entity.StationEntity
import com.geoagent.app.data.local.entity.StructuralEntity
import dagger.hilt.android.qualifiers.ApplicationContext
import java.io.File
import java.io.FileOutputStream
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PdfReportGenerator @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val pageWidth = 595 // A4
    private val pageHeight = 842
    private val margin = 40f
    private val contentWidth = pageWidth - 2 * margin

    private val titlePaint = Paint().apply {
        color = Color.rgb(107, 91, 0)
        textSize = 20f
        isFakeBoldText = true
    }
    private val headerPaint = Paint().apply {
        color = Color.rgb(43, 66, 48)
        textSize = 14f
        isFakeBoldText = true
    }
    private val bodyPaint = Paint().apply {
        color = Color.DKGRAY
        textSize = 11f
    }
    private val smallPaint = Paint().apply {
        color = Color.GRAY
        textSize = 9f
    }
    private val linePaint = Paint().apply {
        color = Color.rgb(200, 200, 200)
        strokeWidth = 1f
    }

    fun generateProjectReport(
        project: ProjectEntity,
        stations: List<StationEntity>,
        lithologies: Map<Long, List<LithologyEntity>>,
        structuralData: Map<Long, List<StructuralEntity>>,
        samples: Map<Long, List<SampleEntity>>,
        drillHoles: List<DrillHoleEntity>,
        intervals: Map<Long, List<DrillIntervalEntity>>,
    ): File {
        val document = PdfDocument()
        try {
        var pageNum = 1
        var currentPage: PdfDocument.Page
        var canvas: Canvas
        var y: Float

        // --- Page 1: Cover ---
        currentPage = document.startPage(
            PdfDocument.PageInfo.Builder(pageWidth, pageHeight, pageNum++).create()
        )
        canvas = currentPage.canvas
        y = 200f

        canvas.drawText("REPORTE GEOLOGICO", margin, y, titlePaint.apply { textSize = 28f })
        y += 40f
        titlePaint.textSize = 20f
        canvas.drawText(project.name, margin, y, titlePaint)
        y += 30f
        canvas.drawText("Ubicacion: ${project.location}", margin, y, bodyPaint)
        y += 20f
        canvas.drawText("Fecha: ${DateFormatter.formatDate(System.currentTimeMillis())}", margin, y, bodyPaint)
        y += 20f
        canvas.drawText("Descripcion: ${project.description}", margin, y, bodyPaint)
        y += 60f

        // Summary
        canvas.drawText("RESUMEN", margin, y, headerPaint)
        y += 25f
        canvas.drawText("Estaciones: ${stations.size}", margin + 20f, y, bodyPaint)
        y += 18f
        val totalSamples = samples.values.sumOf { it.size }
        canvas.drawText("Muestras: $totalSamples", margin + 20f, y, bodyPaint)
        y += 18f
        canvas.drawText("Sondajes: ${drillHoles.size}", margin + 20f, y, bodyPaint)
        y += 18f
        val totalIntervals = intervals.values.sumOf { it.size }
        canvas.drawText("Intervalos de logging: $totalIntervals", margin + 20f, y, bodyPaint)

        // Footer
        canvas.drawText("Generado por GeoAgent", margin, (pageHeight - 30).toFloat(), smallPaint)

        document.finishPage(currentPage)

        // --- Page 2+: Stations ---
        if (stations.isNotEmpty()) {
            currentPage = document.startPage(
                PdfDocument.PageInfo.Builder(pageWidth, pageHeight, pageNum++).create()
            )
            canvas = currentPage.canvas
            y = margin + 20f

            canvas.drawText("ESTACIONES DE CAMPO", margin, y, titlePaint)
            y += 30f

            stations.forEach { station ->
                if (y > pageHeight - 120) {
                    document.finishPage(currentPage)
                    currentPage = document.startPage(
                        PdfDocument.PageInfo.Builder(pageWidth, pageHeight, pageNum++).create()
                    )
                    canvas = currentPage.canvas
                    y = margin + 20f
                }

                canvas.drawLine(margin, y, margin + contentWidth, y, linePaint)
                y += 15f
                canvas.drawText("${station.code} - ${DateFormatter.formatDateTime(station.date)}", margin, y, headerPaint)
                y += 16f
                canvas.drawText("Geologo: ${station.geologist} | Coords: ${station.latitude}, ${station.longitude}", margin + 10f, y, bodyPaint)
                y += 14f
                canvas.drawText("Descripcion: ${station.description.take(100)}", margin + 10f, y, bodyPaint)
                y += 14f

                // Lithology for this station
                lithologies[station.id]?.forEach { l ->
                    if (y > pageHeight - 40) {
                        document.finishPage(currentPage)
                        currentPage = document.startPage(PdfDocument.PageInfo.Builder(pageWidth, pageHeight, pageNum++).create())
                        canvas = currentPage.canvas; y = margin + 20f
                    }
                    canvas.drawText("  Litologia: ${l.rockType} (${l.rockGroup}) - ${l.color}, ${l.texture}".take(90), margin + 20f, y, smallPaint)
                    y += 12f
                    if (l.alteration != null) {
                        if (y > pageHeight - 40) {
                            document.finishPage(currentPage)
                            currentPage = document.startPage(PdfDocument.PageInfo.Builder(pageWidth, pageHeight, pageNum++).create())
                            canvas = currentPage.canvas; y = margin + 20f
                        }
                        canvas.drawText("    Alteracion: ${l.alteration} (${l.alterationIntensity ?: ""})", margin + 20f, y, smallPaint)
                        y += 12f
                    }
                }

                // Structural for this station
                structuralData[station.id]?.forEach { s ->
                    if (y > pageHeight - 40) {
                        document.finishPage(currentPage)
                        currentPage = document.startPage(PdfDocument.PageInfo.Builder(pageWidth, pageHeight, pageNum++).create())
                        canvas = currentPage.canvas; y = margin + 20f
                    }
                    canvas.drawText("  Estructural: ${s.type} - Rumbo: ${s.strike}° Manteo: ${s.dip}° ${s.dipDirection}", margin + 20f, y, smallPaint)
                    y += 12f
                }

                // Samples for this station
                samples[station.id]?.forEach { s ->
                    if (y > pageHeight - 40) {
                        document.finishPage(currentPage)
                        currentPage = document.startPage(PdfDocument.PageInfo.Builder(pageWidth, pageHeight, pageNum++).create())
                        canvas = currentPage.canvas; y = margin + 20f
                    }
                    canvas.drawText("  Muestra: ${s.code} (${s.type}) - ${s.description.take(60)}", margin + 20f, y, smallPaint)
                    y += 12f
                }

                y += 10f
            }

            document.finishPage(currentPage)
        }

        // --- Drill Holes pages ---
        if (drillHoles.isNotEmpty()) {
            currentPage = document.startPage(
                PdfDocument.PageInfo.Builder(pageWidth, pageHeight, pageNum++).create()
            )
            canvas = currentPage.canvas
            y = margin + 20f

            canvas.drawText("SONDAJES", margin, y, titlePaint)
            y += 30f

            drillHoles.forEach { dh ->
                if (y > pageHeight - 120) {
                    document.finishPage(currentPage)
                    currentPage = document.startPage(
                        PdfDocument.PageInfo.Builder(pageWidth, pageHeight, pageNum++).create()
                    )
                    canvas = currentPage.canvas
                    y = margin + 20f
                }

                canvas.drawLine(margin, y, margin + contentWidth, y, linePaint)
                y += 15f
                canvas.drawText("${dh.holeId} (${dh.type}) - ${dh.status}", margin, y, headerPaint)
                y += 16f
                canvas.drawText("Coords: ${dh.latitude}, ${dh.longitude} | Az: ${dh.azimuth}° Inc: ${dh.inclination}°", margin + 10f, y, bodyPaint)
                y += 14f
                canvas.drawText("Prof. planificada: ${dh.plannedDepth}m | Real: ${dh.actualDepth ?: "N/A"}m", margin + 10f, y, bodyPaint)
                y += 14f

                intervals[dh.id]?.forEach { iv ->
                    if (y > pageHeight - 40) {
                        document.finishPage(currentPage)
                        currentPage = document.startPage(
                            PdfDocument.PageInfo.Builder(pageWidth, pageHeight, pageNum++).create()
                        )
                        canvas = currentPage.canvas
                        y = margin + 20f
                    }
                    canvas.drawText("  ${iv.fromDepth}-${iv.toDepth}m: ${iv.rockType} (${iv.rockGroup}) ${iv.alteration ?: ""} ${iv.mineralization ?: ""}", margin + 20f, y, smallPaint)
                    y += 12f
                }

                y += 10f
            }

            document.finishPage(currentPage)
        }

        val safeName = project.name.replace(Regex("[^a-zA-Z0-9_-]"), "_")
        val fileName = "Reporte_${safeName}_${DateFormatter.formatForFileName(System.currentTimeMillis())}.pdf"
        val file = File(
            File(context.getExternalFilesDir(null), "exports").also { if (!it.exists()) it.mkdirs() },
            fileName
        )
        FileOutputStream(file).use { document.writeTo(it) }
        return file
        } finally {
            document.close()
        }
    }
}
