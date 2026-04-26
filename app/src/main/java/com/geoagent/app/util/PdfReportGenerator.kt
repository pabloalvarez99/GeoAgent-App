package com.geoagent.app.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import android.net.Uri
import com.geoagent.app.data.local.entity.DrillHoleEntity
import com.geoagent.app.data.local.entity.DrillIntervalEntity
import com.geoagent.app.data.local.entity.LithologyEntity
import com.geoagent.app.data.local.entity.PhotoEntity
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

    // ─── Page geometry ──────────────────────────────────────────────────────
    private val PW = 595f
    private val PH = 842f
    private val ML = 40f
    private val CW = PW - ML * 2f   // 515

    private val BAND_H = 26f
    private val Y0 = BAND_H + 10f
    private val Y_MAX = PH - BAND_H - 10f

    // ─── Color palette ──────────────────────────────────────────────────────
    private val NAVY    = Color.rgb(15, 30, 60)
    private val NAVY2   = Color.rgb(24, 44, 88)
    private val GOLD    = Color.rgb(196, 142, 28)
    private val GOLD2   = Color.rgb(215, 168, 55)
    private val BG_PAGE = Color.rgb(250, 250, 248)
    private val BG_ROW  = Color.rgb(235, 241, 255)
    private val BORDER  = Color.rgb(185, 198, 222)
    private val TXT1    = Color.rgb(18, 18, 18)
    private val TXT2    = Color.rgb(60, 60, 60)
    private val TXT3    = Color.rgb(115, 115, 115)

    // ─── Paint factories ────────────────────────────────────────────────────
    private fun fp(c: Int) = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = c; style = Paint.Style.FILL }
    private fun sp(c: Int, w: Float = 0.5f) = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = c; style = Paint.Style.STROKE; strokeWidth = w
    }
    private fun tp(c: Int, sz: Float, bold: Boolean = false) = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = c; textSize = sz; if (bold) isFakeBoldText = true
    }

    // Static fill/stroke paints
    private val pNavy    = fp(NAVY)
    private val pNavy2   = fp(NAVY2)
    private val pGold    = fp(GOLD)
    private val pBgPage  = fp(BG_PAGE)
    private val pBgRow   = fp(BG_ROW)
    private val pWhite   = fp(Color.WHITE)
    private val pBorder  = sp(BORDER, 0.5f)
    private val pHair    = sp(BORDER, 0.3f)
    private val pGoldLn  = sp(GOLD, 1.5f)
    private val pGoldLn1 = sp(GOLD, 1f)

    // Text paints — one object per visual role, never mutated after init
    private val tCoverBig  = tp(Color.WHITE, 30f, bold = true)
    private val tCoverMid  = tp(Color.WHITE, 16f, bold = true)
    private val tCoverSub  = tp(Color.rgb(180, 198, 235), 10f)
    private val tCoverMeta = tp(Color.rgb(160, 180, 220), 9f)
    private val tStatNum   = tp(NAVY2, 22f, bold = true)
    private val tStatLbl   = tp(TXT3, 7.5f)
    private val tBannerTxt = tp(Color.WHITE, 9.5f, bold = true)
    private val tSubHdr    = tp(NAVY2, 9.5f, bold = true)
    private val tGoldLbl   = tp(GOLD, 8.5f, bold = true)
    private val tBodyBold  = tp(TXT1, 9f, bold = true)
    private val tBody      = tp(TXT2, 9f)
    private val tSmallBold = tp(TXT3, 8f, bold = true)
    private val tSmall     = tp(TXT3, 8f)
    private val tTblHdr    = tp(Color.WHITE, 7.5f, bold = true)
    private val tTblBody   = tp(TXT1, 7.5f)
    private val tCaption   = tp(TXT3, 7.5f)
    private val tPgInfo    = tp(Color.rgb(155, 170, 210), 7f)

    // ═══════════════════════════════════════════════════════════════════════
    // Page state — tracks current document page
    // ═══════════════════════════════════════════════════════════════════════
    inner class PS(val doc: PdfDocument) {
        var n = 1
        var page: PdfDocument.Page? = null
        lateinit var cv: Canvas
        var y = Y0
        var sec = ""; var proj = ""

        fun start(sec: String = this.sec, proj: String = this.proj) {
            this.sec = sec; this.proj = proj
            page = doc.startPage(PdfDocument.PageInfo.Builder(PW.toInt(), PH.toInt(), n++).create())
            cv = page!!.canvas
            drawHeader(cv, sec, proj, n - 1)
            y = Y0
        }

        fun finish() {
            page?.also { drawFooter(cv, n - 1); doc.finishPage(it) }
            page = null
        }

        fun next() { finish(); start() }

        /** Start a new page if remaining space < [need] */
        fun guard(need: Float) { if (y + need > Y_MAX) next() }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Page chrome
    // ═══════════════════════════════════════════════════════════════════════

    private fun drawHeader(cv: Canvas, sec: String, proj: String, pn: Int) {
        cv.drawRect(0f, 0f, PW, BAND_H, pNavy)
        cv.drawLine(0f, BAND_H, PW, BAND_H, pGoldLn1)
        cv.drawText(sec.uppercase(), ML, BAND_H - 8f, tBannerTxt)
        val pnTxt = "Pág. $pn"
        val pnW = tPgInfo.measureText(pnTxt)
        cv.drawText(pnTxt, PW - ML - pnW, BAND_H - 8f, tPgInfo)
        val projTxt = proj.take(44)
        val projW = tPgInfo.measureText(projTxt)
        cv.drawText(projTxt, PW - ML - projW, BAND_H - 1f, tPgInfo)
    }

    private fun drawFooter(cv: Canvas, pn: Int) {
        val fy = PH - BAND_H
        cv.drawLine(0f, fy, PW, fy, pGoldLn1)
        cv.drawRect(0f, fy, PW, PH, pNavy)
        cv.drawText("GeoAgent  •  Informe Geológico de Campo", ML, PH - 8f, tPgInfo)
        val d = DateFormatter.formatDate(System.currentTimeMillis())
        cv.drawText(d, PW - ML - tPgInfo.measureText(d), PH - 8f, tPgInfo)
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Drawing helpers
    // ═══════════════════════════════════════════════════════════════════════

    /** Wrap text to [maxW]; returns new y after last line */
    private fun wrapText(cv: Canvas, text: String, x: Float, y: Float, maxW: Float, p: Paint): Float {
        if (text.isBlank()) return y
        val lh = p.textSize * 1.38f
        var curY = y
        val words = text.trim().split(Regex("\\s+"))
        val line = StringBuilder()
        for (w in words) {
            val candidate = if (line.isEmpty()) w else "$line $w"
            if (p.measureText(candidate) <= maxW) { line.clear(); line.append(candidate) }
            else {
                if (line.isNotEmpty()) { cv.drawText(line.toString(), x, curY, p); curY += lh }
                line.clear(); line.append(w)
            }
        }
        if (line.isNotEmpty()) { cv.drawText(line.toString(), x, curY, p); curY += lh }
        return curY
    }

    /** wrapText with page-break guard. Updates ps.y directly. */
    private fun wrapGuard(ps: PS, text: String, x: Float, maxW: Float, p: Paint) {
        if (text.isBlank()) return
        val lh = p.textSize * 1.38f
        val words = text.trim().split(Regex("\\s+"))
        val line = StringBuilder()
        for (w in words) {
            val candidate = if (line.isEmpty()) w else "$line $w"
            if (p.measureText(candidate) <= maxW) { line.clear(); line.append(candidate) }
            else {
                if (line.isNotEmpty()) {
                    ps.guard(lh); ps.cv.drawText(line.toString(), x, ps.y, p); ps.y += lh
                }
                line.clear(); line.append(w)
            }
        }
        if (line.isNotEmpty()) {
            ps.guard(lh); ps.cv.drawText(line.toString(), x, ps.y, p); ps.y += lh
        }
    }

    /** Section banner — full-width navy bar with gold left accent */
    private fun banner(ps: PS, title: String) {
        ps.guard(24f)
        ps.cv.drawRect(ML, ps.y, ML + CW, ps.y + 18f, pNavy2)
        ps.cv.drawRect(ML, ps.y, ML + 3.5f, ps.y + 18f, pGold)
        ps.cv.drawText(title.uppercase(), ML + 9f, ps.y + 12.5f, tBannerTxt)
        ps.y += 22f
    }

    /** Two-column key:value row */
    private fun kvRow(ps: PS, k1: String, v1: String, k2: String = "", v2: String = "") {
        ps.guard(13f)
        val half = CW / 2f
        ps.cv.drawText(k1, ML, ps.y, tSmallBold)
        ps.cv.drawText(v1, ML + 85f, ps.y, tBody)
        if (k2.isNotEmpty()) {
            ps.cv.drawText(k2, ML + half, ps.y, tSmallBold)
            ps.cv.drawText(v2, ML + half + 85f, ps.y, tBody)
        }
        ps.y += 13f
    }

    /** Single key:value row spanning full width */
    private fun kvFull(ps: PS, key: String, value: String) {
        ps.guard(13f)
        ps.cv.drawText(key, ML, ps.y, tSmallBold)
        ps.cv.drawText(value, ML + 85f, ps.y, tBody)
        ps.y += 13f
    }

    /** Draws a data table. Clips cell text to fit column. */
    private fun drawTable(ps: PS, headers: List<String>, rows: List<List<String>>, colW: List<Float>) {
        if (rows.isEmpty()) return
        val rowH = 14f
        val hdrH = 16f
        val tableW = colW.sum()

        // Table header
        ps.guard(hdrH + rowH)
        var x = ML
        colW.forEachIndexed { i, w ->
            ps.cv.drawRect(x, ps.y, x + w, ps.y + hdrH, pNavy2)
            val hdrTxt = headers.getOrElse(i) { "" }
            ps.cv.save()
            ps.cv.clipRect(x + 2f, ps.y, x + w - 1f, ps.y + hdrH)
            ps.cv.drawText(hdrTxt, x + 3f, ps.y + 11f, tTblHdr)
            ps.cv.restore()
            x += w
        }
        ps.y += hdrH

        // Data rows
        rows.forEachIndexed { ri, row ->
            ps.guard(rowH)
            val rowBg = if (ri % 2 == 0) pWhite else pBgRow
            ps.cv.drawRect(ML, ps.y, ML + tableW, ps.y + rowH, rowBg)
            ps.cv.drawRect(ML, ps.y, ML + tableW, ps.y + rowH, pBorder)
            x = ML
            colW.forEachIndexed { i, w ->
                val cell = row.getOrElse(i) { "" }
                ps.cv.save()
                ps.cv.clipRect(x + 2f, ps.y, x + w - 1f, ps.y + rowH)
                ps.cv.drawText(cell, x + 3f, ps.y + 10f, tTblBody)
                ps.cv.restore()
                ps.cv.drawLine(x + w, ps.y, x + w, ps.y + rowH, pHair)
                x += w
            }
            ps.y += rowH
        }
        ps.y += 6f
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Photo rendering
    // ═══════════════════════════════════════════════════════════════════════

    private fun loadBitmap(photo: PhotoEntity, reqW: Int, reqH: Int): Bitmap? {
        val path = photo.filePath
        // Direct absolute file path
        if (path.isNotEmpty() && !path.startsWith("content://")) {
            val f = File(path)
            if (f.exists() && f.length() > 0L) return decodeSampledBitmap(path, reqW, reqH)
        }
        // Content URI (MediaStore or FileProvider)
        if (path.startsWith("content://")) {
            return try {
                context.contentResolver.openInputStream(Uri.parse(path))?.use { stream ->
                    BitmapFactory.decodeStream(stream)
                }
            } catch (_: Exception) { null }
        }
        return null
    }

    private fun drawPhotoBlock(ps: PS, photo: PhotoEntity) {
        val maxW = CW
        val maxH = 270f
        val captionH = 18f
        val bmp = loadBitmap(photo, maxW.toInt(), maxH.toInt())

        if (bmp != null) {
            val srcAspect = bmp.width.toFloat() / bmp.height.toFloat()
            val drawW = minOf(maxW, bmp.width.toFloat())
            val drawH = minOf(maxH, drawW / srcAspect)
            val finalW = drawH * srcAspect

            ps.guard(drawH + captionH + 10f)

            // Shadow rect
            val shadow = Paint().apply { color = Color.rgb(180, 180, 180); style = Paint.Style.FILL }
            ps.cv.drawRect(ML + 2f, ps.y + 2f, ML + finalW + 2f, ps.y + drawH + 2f, shadow)

            // Photo rect with filter
            val rect = RectF(ML, ps.y, ML + finalW, ps.y + drawH)
            val imgPaint = Paint(Paint.FILTER_BITMAP_FLAG or Paint.ANTI_ALIAS_FLAG)
            ps.cv.drawBitmap(bmp, null, rect, imgPaint)
            bmp.recycle()

            // Border around photo
            ps.cv.drawRect(rect, pBorder)

            ps.y += drawH + 4f

            // Caption
            val cap = buildString {
                if (!photo.description.isNullOrBlank()) append(photo.description.take(80))
                if (isNotEmpty()) append("  •  ")
                append(DateFormatter.formatDateTime(photo.takenAt))
                if (photo.latitude != null && photo.longitude != null) {
                    append("  •  ${String.format("%.5f", photo.latitude)}, ${String.format("%.5f", photo.longitude)}")
                }
            }
            ps.cv.drawText(cap, ML, ps.y + 11f, tCaption)
            ps.y += captionH
        } else {
            // Cloud-only or missing photo — placeholder
            ps.guard(38f)
            ps.cv.drawRect(ML, ps.y, ML + CW, ps.y + 30f, pBgPage)
            ps.cv.drawRect(ML, ps.y, ML + CW, ps.y + 30f, pBorder)
            val lbl = when {
                !photo.description.isNullOrBlank() -> "☁  ${photo.description.take(90)}"
                photo.remoteUrl != null -> "☁  ${photo.fileName}  [foto sincronizada — disponible en nube]"
                else -> "☁  ${photo.fileName}  [foto no disponible localmente]"
            }
            ps.cv.drawText(lbl, ML + 8f, ps.y + 19f, tSmall)
            ps.cv.drawText(DateFormatter.formatDateTime(photo.takenAt), ML + 8f, ps.y + 29f, tCaption)
            ps.y += 36f
        }
        ps.y += 4f
    }

    private fun decodeSampledBitmap(filePath: String, reqW: Int, reqH: Int): Bitmap? {
        val opts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(filePath, opts)
        if (opts.outWidth <= 0 || opts.outHeight <= 0) return null
        var s = 1
        while ((opts.outWidth / (s * 2)) >= reqW && (opts.outHeight / (s * 2)) >= reqH) s *= 2
        opts.inJustDecodeBounds = false
        opts.inSampleSize = s
        opts.inPreferredConfig = Bitmap.Config.RGB_565
        return BitmapFactory.decodeFile(filePath, opts)
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC ENTRY POINT
    // ═══════════════════════════════════════════════════════════════════════

    fun generateProjectReport(
        project: ProjectEntity,
        stations: List<StationEntity>,
        lithologies: Map<Long, List<LithologyEntity>>,
        structuralData: Map<Long, List<StructuralEntity>>,
        samples: Map<Long, List<SampleEntity>>,
        drillHoles: List<DrillHoleEntity>,
        intervals: Map<Long, List<DrillIntervalEntity>>,
        stationPhotos: Map<Long, List<PhotoEntity>> = emptyMap(),
        drillHolePhotos: Map<Long, List<PhotoEntity>> = emptyMap(),
    ): File {
        val doc = PdfDocument()
        try {
            val ps = PS(doc)
            val totalPhotos   = stationPhotos.values.sumOf { it.size } + drillHolePhotos.values.sumOf { it.size }
            val totalSamples  = samples.values.sumOf { it.size }
            val totalLithos   = lithologies.values.sumOf { it.size }
            val totalStruct   = structuralData.values.sumOf { it.size }
            val totalIntervals = intervals.values.sumOf { it.size }

            // Page 1: Cover (standalone, no chrome bands)
            drawCover(ps, project, stations.size, totalSamples, drillHoles.size, totalPhotos)

            // Page 2: Executive summary
            ps.start("RESUMEN EJECUTIVO", project.name)
            drawExecutiveSummary(ps, project, stations, lithologies, samples, drillHoles,
                intervals, totalPhotos, totalLithos, totalStruct, totalIntervals)
            ps.finish()

            // Pages 3+: Stations
            if (stations.isNotEmpty()) {
                ps.start("ESTACIONES DE CAMPO", project.name)
                stations.forEachIndexed { idx, station ->
                    drawStation(ps, idx + 1, station,
                        lithologies[station.id] ?: emptyList(),
                        structuralData[station.id] ?: emptyList(),
                        samples[station.id] ?: emptyList(),
                        stationPhotos[station.id] ?: emptyList()
                    )
                }
                ps.finish()
            }

            // Pages: Drill holes
            if (drillHoles.isNotEmpty()) {
                ps.start("SONDAJES", project.name)
                drillHoles.forEachIndexed { idx, dh ->
                    drawDrillHole(ps, idx + 1, dh,
                        intervals[dh.id] ?: emptyList(),
                        drillHolePhotos[dh.id] ?: emptyList()
                    )
                }
                ps.finish()
            }

            val safeName = project.name.replace(Regex("[^a-zA-Z0-9_-]"), "_")
            val fileName = "Reporte_${safeName}_${DateFormatter.formatForFileName(System.currentTimeMillis())}.pdf"
            val outDir = File(context.getExternalFilesDir(null), "exports").also { it.mkdirs() }
            val file = File(outDir, fileName)
            FileOutputStream(file).use { doc.writeTo(it) }
            return file
        } finally {
            doc.close()
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Cover page — no chrome bands, full custom layout
    // ═══════════════════════════════════════════════════════════════════════

    private fun drawCover(
        ps: PS, project: ProjectEntity,
        stationCt: Int, sampleCt: Int, drillCt: Int, photoCt: Int,
    ) {
        val p = ps.doc.startPage(PdfDocument.PageInfo.Builder(PW.toInt(), PH.toInt(), ps.n++).create())
        val cv = p.canvas

        // Top navy block (~60% of page)
        val splitY = PH * 0.60f
        cv.drawRect(0f, 0f, PW, splitY, pNavy)

        // Gold left accent stripe
        cv.drawRect(0f, 0f, 5f, splitY, pGold)

        // Branding header inside top block
        cv.drawText("GEOAGENT", ML + 10f, 42f, tp(GOLD2, 10f, bold = true))
        cv.drawText("Sistema de Registro Geológico de Campo", ML + 10f, 57f,
            tp(Color.rgb(140, 160, 210), 7.5f))
        cv.drawLine(ML + 10f, 68f, ML + 220f, 68f, pGoldLn)

        // Main title
        cv.drawText("INFORME", ML + 10f, 135f, tCoverBig)
        cv.drawText("GEOLÓGICO", ML + 10f, 172f, tCoverBig)

        // Gold accent line below title
        cv.drawLine(ML + 10f, 183f, ML + 200f, 183f, sp(GOLD, 2.5f).also { })
        val goldLinePaint = Paint().apply { color = GOLD; strokeWidth = 2.5f }
        cv.drawLine(ML + 10f, 184f, ML + 200f, 184f, goldLinePaint)

        // Project name
        cv.drawText(project.name.take(42), ML + 10f, 218f, tCoverMid)

        // Project meta
        var metaY = 242f
        cv.drawText("Ubicación: ${project.location.take(60)}", ML + 10f, metaY, tCoverMeta); metaY += 16f
        cv.drawText("Fecha de informe: ${DateFormatter.formatDate(System.currentTimeMillis())}",
            ML + 10f, metaY, tCoverMeta)

        // Bottom light block
        cv.drawRect(0f, splitY, PW, PH, pWhite)
        cv.drawLine(0f, splitY, PW, splitY, goldLinePaint)

        // ── Statistics boxes ──────────────────────────────────────────────
        val stats = listOf(
            stationCt.toString() to "ESTACIONES",
            sampleCt.toString() to "MUESTRAS",
            drillCt.toString() to "SONDAJES",
            photoCt.toString() to "FOTOGRAFÍAS",
        )
        val gap = 10f
        val boxW = (CW - gap * 3f) / 4f
        val boxH = 72f
        val boxY = splitY + 28f

        stats.forEachIndexed { i, (num, lbl) ->
            val bx = ML + i * (boxW + gap)
            // Box background
            val boxRect = RectF(bx, boxY, bx + boxW, boxY + boxH)
            cv.drawRoundRect(boxRect, 5f, 5f, pBgPage)
            cv.drawRoundRect(boxRect, 5f, 5f, sp(BORDER, 1f))
            // Gold top accent
            cv.drawRoundRect(RectF(bx, boxY, bx + boxW, boxY + 4f), 2f, 2f, pGold)
            // Number centered
            val nW = tStatNum.measureText(num)
            cv.drawText(num, bx + (boxW - nW) / 2f, boxY + 46f, tStatNum)
            // Label centered
            val lW = tStatLbl.measureText(lbl)
            cv.drawText(lbl, bx + (boxW - lW) / 2f, boxY + 60f, tStatLbl)
        }

        // ── Project description block ─────────────────────────────────────
        val descY = boxY + boxH + 24f
        cv.drawText("DESCRIPCIÓN DEL PROYECTO", ML, descY, tSubHdr)
        cv.drawLine(ML, descY + 4f, ML + 220f, descY + 4f, pGoldLn1)
        var dy = descY + 18f
        if (project.description.isNotBlank()) {
            dy = wrapText(cv, project.description, ML, dy, CW, tBody)
            dy += 6f
        }
        cv.drawText("Creado: ${DateFormatter.formatDate(project.createdAt)}", ML, dy, tSmall)

        // ── Cover footer ──────────────────────────────────────────────────
        val ftY = PH - 32f
        cv.drawLine(0f, ftY, PW, ftY, pGoldLn1)
        cv.drawRect(0f, ftY, PW, PH, pNavy)
        cv.drawText("Generado por GeoAgent  •  ${DateFormatter.formatDate(System.currentTimeMillis())}",
            ML, PH - 11f, tPgInfo)
        val p1 = "Pág. 1"
        cv.drawText(p1, PW - ML - tPgInfo.measureText(p1), PH - 11f, tPgInfo)

        ps.doc.finishPage(p)
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Executive summary
    // ═══════════════════════════════════════════════════════════════════════

    private fun drawExecutiveSummary(
        ps: PS, project: ProjectEntity,
        stations: List<StationEntity>,
        lithologies: Map<Long, List<LithologyEntity>>,
        samples: Map<Long, List<SampleEntity>>,
        drillHoles: List<DrillHoleEntity>,
        intervals: Map<Long, List<DrillIntervalEntity>>,
        totalPhotos: Int, totalLithos: Int, totalStruct: Int, totalIntervals: Int,
    ) {
        banner(ps, "Información del Proyecto")
        kvRow(ps, "Nombre:", project.name, "Ubicación:", project.location)
        kvRow(ps, "Creado:", DateFormatter.formatDate(project.createdAt),
            "Actualizado:", DateFormatter.formatDate(project.updatedAt))
        if (project.description.isNotBlank()) {
            ps.guard(14f)
            ps.cv.drawText("Descripción:", ML, ps.y, tSmallBold); ps.y += 12f
            wrapGuard(ps, project.description, ML + 8f, CW - 8f, tBody)
            ps.y += 4f
        }
        ps.y += 4f

        banner(ps, "Estadísticas Generales")
        kvRow(ps, "Estaciones:", "${stations.size}", "Litologías registradas:", "$totalLithos")
        kvRow(ps, "Datos estructurales:", "$totalStruct", "Muestras totales:", "${samples.values.sumOf { it.size }}")
        kvRow(ps, "Sondajes:", "${drillHoles.size}", "Intervalos de logging:", "$totalIntervals")
        kvFull(ps, "Fotografías:", "$totalPhotos")
        ps.y += 6f

        // Station index table
        if (stations.isNotEmpty()) {
            banner(ps, "Índice de Estaciones de Campo")
            drawTable(ps,
                headers = listOf("N°", "Código", "Fecha", "Geólogo", "Lito.", "Muestras", "Coordenadas"),
                rows = stations.mapIndexed { i, s -> listOf(
                    "${i + 1}", s.code,
                    DateFormatter.formatDate(s.date),
                    s.geologist.take(20),
                    "${lithologies[s.id]?.size ?: 0}",
                    "${samples[s.id]?.size ?: 0}",
                    "${String.format("%.4f", s.latitude)}, ${String.format("%.4f", s.longitude)}"
                )},
                colW = listOf(24f, 65f, 65f, 95f, 35f, 48f, 183f)
            )
        }

        // Drill hole index table
        if (drillHoles.isNotEmpty()) {
            banner(ps, "Índice de Sondajes")
            drawTable(ps,
                headers = listOf("N°", "ID Sondaje", "Tipo", "Estado", "Prof. Plan.", "Prof. Real", "Geólogo"),
                rows = drillHoles.mapIndexed { i, dh -> listOf(
                    "${i + 1}", dh.holeId, dh.type, dh.status,
                    "${String.format("%.1f", dh.plannedDepth)} m",
                    dh.actualDepth?.let { "${String.format("%.1f", it)} m" } ?: "N/D",
                    dh.geologist.take(22)
                )},
                colW = listOf(24f, 75f, 65f, 70f, 60f, 58f, 163f)
            )
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Station detail
    // ═══════════════════════════════════════════════════════════════════════

    private fun drawStation(
        ps: PS, num: Int, s: StationEntity,
        lithos: List<LithologyEntity>,
        structural: List<StructuralEntity>,
        smpls: List<SampleEntity>,
        photos: List<PhotoEntity>,
    ) {
        ps.guard(70f)
        ps.y += 4f

        // Station header card
        ps.cv.drawRect(ML, ps.y, ML + CW, ps.y + 22f, pNavy2)
        ps.cv.drawRect(ML, ps.y, ML + 4f, ps.y + 22f, pGold)
        ps.cv.drawText("ESTACIÓN $num  •  ${s.code}", ML + 10f, ps.y + 15f, tBannerTxt)
        val dateStr = DateFormatter.formatDateTime(s.date)
        val dateW = tPgInfo.measureText(dateStr)
        ps.cv.drawText(dateStr, ML + CW - dateW - 4f, ps.y + 15f, tPgInfo)
        ps.y += 26f

        // Metadata
        kvRow(ps, "Geólogo:", s.geologist, "Fecha/Hora:", DateFormatter.formatDateTime(s.date))
        kvRow(ps, "Latitud:", String.format("%.6f°", s.latitude),
            "Longitud:", String.format("%.6f°", s.longitude))
        if (s.altitude != null) kvRow(ps, "Altitud:", "${String.format("%.1f", s.altitude)} m snm", "", "")
        if (!s.weatherConditions.isNullOrBlank()) kvRow(ps, "Condiciones:", s.weatherConditions, "", "")

        // Description
        if (s.description.isNotBlank()) {
            ps.guard(15f)
            ps.cv.drawText("Descripción de la estación:", ML, ps.y, tSmallBold); ps.y += 12f
            wrapGuard(ps, s.description, ML + 6f, CW - 6f, tBody)
            ps.y += 3f
        }

        // ── Lithology ────────────────────────────────────────────────────
        if (lithos.isNotEmpty()) {
            ps.y += 5f
            ps.guard(20f)
            ps.cv.drawText("LITOLOGÍA  (${lithos.size} registro${if (lithos.size > 1) "s" else ""})",
                ML + 3f, ps.y + 9f, tGoldLbl); ps.y += 14f

            drawTable(ps,
                headers = listOf("Tipo de Roca", "Grupo", "Color", "Textura", "Tamaño Grano", "Mineralogía"),
                rows = lithos.map { l -> listOf(l.rockType, l.rockGroup, l.color, l.texture, l.grainSize, l.mineralogy) },
                colW = listOf(95f, 70f, 60f, 65f, 75f, 150f)
            )

            // Alteration + mineralization sub-table if any row has data
            val withAlt = lithos.filter { it.alteration != null || it.mineralization != null }
            if (withAlt.isNotEmpty()) {
                drawTable(ps,
                    headers = listOf("Tipo de Roca", "Alteración", "Intensidad Alt.", "Mineralización", "% Mineral.", "Estructura", "Meteorización"),
                    rows = withAlt.map { l -> listOf(
                        l.rockType,
                        l.alteration ?: "-",
                        l.alterationIntensity ?: "-",
                        l.mineralization ?: "-",
                        l.mineralizationPercent?.let { String.format("%.1f%%", it) } ?: "-",
                        l.structure ?: "-",
                        l.weathering ?: "-"
                    )},
                    colW = listOf(80f, 75f, 70f, 75f, 55f, 80f, 80f)
                )
            }

            // Notes
            lithos.filter { !it.notes.isNullOrBlank() }.forEach { l ->
                ps.guard(22f)
                ps.cv.drawText("Notas (${l.rockType}):", ML + 3f, ps.y, tSmallBold); ps.y += 11f
                wrapGuard(ps, l.notes!!, ML + 10f, CW - 10f, tSmall)
                ps.y += 3f
            }
        }

        // ── Structural ───────────────────────────────────────────────────
        if (structural.isNotEmpty()) {
            ps.y += 5f
            ps.guard(20f)
            ps.cv.drawText("DATOS ESTRUCTURALES  (${structural.size} medición${if (structural.size > 1) "es" else ""})",
                ML + 3f, ps.y + 9f, tGoldLbl); ps.y += 14f

            drawTable(ps,
                headers = listOf("Tipo", "Rumbo (°)", "Manteo (°)", "Dirección", "Movimiento", "Espesor (m)", "Relleno", "Rugosidad"),
                rows = structural.map { st -> listOf(
                    st.type,
                    String.format("%.1f", st.strike),
                    String.format("%.1f", st.dip),
                    st.dipDirection,
                    st.movement ?: "-",
                    st.thickness?.let { String.format("%.2f", it) } ?: "-",
                    st.filling ?: "-",
                    st.roughness ?: "-"
                )},
                colW = listOf(80f, 58f, 60f, 65f, 65f, 60f, 65f, 62f)
            )

            structural.filter { !it.notes.isNullOrBlank() }.forEach { st ->
                ps.guard(22f)
                ps.cv.drawText("Notas (${st.type}):", ML + 3f, ps.y, tSmallBold); ps.y += 11f
                wrapGuard(ps, st.notes!!, ML + 10f, CW - 10f, tSmall)
                ps.y += 3f
            }
        }

        // ── Samples ──────────────────────────────────────────────────────
        if (smpls.isNotEmpty()) {
            ps.y += 5f
            ps.guard(20f)
            ps.cv.drawText("MUESTRAS  (${smpls.size} muestra${if (smpls.size > 1) "s" else ""})",
                ML + 3f, ps.y + 9f, tGoldLbl); ps.y += 14f

            drawTable(ps,
                headers = listOf("Código", "Tipo", "Estado", "Peso (kg)", "Long. (m)", "Destino", "Análisis Solicitado"),
                rows = smpls.map { sm -> listOf(
                    sm.code, sm.type, sm.status,
                    sm.weight?.let { String.format("%.3f", it) } ?: "-",
                    sm.length?.let { String.format("%.2f", it) } ?: "-",
                    sm.destination ?: "-",
                    sm.analysisRequested ?: "-"
                )},
                colW = listOf(68f, 60f, 55f, 52f, 50f, 80f, 150f)
            )

            smpls.filter { it.description.isNotBlank() || !it.notes.isNullOrBlank() }.forEach { sm ->
                ps.guard(22f)
                if (sm.description.isNotBlank()) {
                    ps.cv.drawText("${sm.code} — Descripción:", ML + 3f, ps.y, tSmallBold); ps.y += 11f
                    wrapGuard(ps, sm.description, ML + 10f, CW - 10f, tSmall)
                }
                if (!sm.notes.isNullOrBlank()) {
                    ps.cv.drawText("${sm.code} — Notas:", ML + 3f, ps.y, tSmallBold); ps.y += 11f
                    wrapGuard(ps, sm.notes, ML + 10f, CW - 10f, tSmall)
                }
                ps.y += 3f
            }
        }

        // ── Photos ───────────────────────────────────────────────────────
        if (photos.isNotEmpty()) {
            ps.y += 5f
            ps.guard(20f)
            ps.cv.drawText("FOTOGRAFÍAS  (${photos.size} foto${if (photos.size > 1) "s" else ""})",
                ML + 3f, ps.y + 9f, tGoldLbl); ps.y += 14f
            photos.forEach { drawPhotoBlock(ps, it) }
        }

        // Separator before next station
        ps.guard(8f)
        ps.cv.drawLine(ML, ps.y + 3f, ML + CW, ps.y + 3f, pHair)
        ps.y += 12f
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Drill hole detail
    // ═══════════════════════════════════════════════════════════════════════

    private fun drawDrillHole(
        ps: PS, num: Int, dh: DrillHoleEntity,
        ivs: List<DrillIntervalEntity>,
        photos: List<PhotoEntity>,
    ) {
        ps.guard(70f)
        ps.y += 4f

        // Header card
        ps.cv.drawRect(ML, ps.y, ML + CW, ps.y + 22f, pNavy2)
        ps.cv.drawRect(ML, ps.y, ML + 4f, ps.y + 22f, pGold)
        ps.cv.drawText("SONDAJE $num  •  ${dh.holeId}  •  ${dh.type}  •  ${dh.status}",
            ML + 10f, ps.y + 15f, tBannerTxt)
        ps.y += 26f

        // Technical metadata
        kvRow(ps, "Geólogo:", dh.geologist, "Estado:", dh.status)
        kvRow(ps, "Latitud:", String.format("%.6f°", dh.latitude),
            "Longitud:", String.format("%.6f°", dh.longitude))
        if (dh.altitude != null) kvRow(ps, "Altitud collar:", "${String.format("%.1f", dh.altitude)} m snm", "", "")
        kvRow(ps, "Azimut:", "${String.format("%.1f", dh.azimuth)}°",
            "Inclinación:", "${String.format("%.1f", dh.inclination)}°")
        kvRow(ps, "Prof. planificada:", "${String.format("%.2f", dh.plannedDepth)} m",
            "Prof. real:", dh.actualDepth?.let { "${String.format("%.2f", it)} m" } ?: "N/D")
        if (dh.startDate != null) kvRow(ps, "Fecha inicio:", DateFormatter.formatDate(dh.startDate),
            "Fecha fin:", dh.endDate?.let { DateFormatter.formatDate(it) } ?: "En progreso")

        if (!dh.notes.isNullOrBlank()) {
            ps.guard(14f)
            ps.cv.drawText("Notas:", ML, ps.y, tSmallBold); ps.y += 12f
            wrapGuard(ps, dh.notes, ML + 6f, CW - 6f, tBody)
            ps.y += 3f
        }

        // ── Interval logging ─────────────────────────────────────────────
        if (ivs.isNotEmpty()) {
            ps.y += 5f
            ps.guard(20f)
            ps.cv.drawText("REGISTRO DE SONDAJE  (${ivs.size} intervalo${if (ivs.size > 1) "s" else ""})",
                ML + 3f, ps.y + 9f, tGoldLbl); ps.y += 14f

            drawTable(ps,
                headers = listOf("De (m)", "A (m)", "Long.", "Tipo Roca", "Grupo", "Color", "Textura", "Alt.", "Mineral.", "RQD%", "Rec.%"),
                rows = ivs.map { iv -> listOf(
                    String.format("%.2f", iv.fromDepth),
                    String.format("%.2f", iv.toDepth),
                    String.format("%.2f", iv.toDepth - iv.fromDepth),
                    iv.rockType, iv.rockGroup, iv.color, iv.texture,
                    iv.alteration ?: "-",
                    iv.mineralization ?: "-",
                    iv.rqd?.let { String.format("%.0f", it) } ?: "-",
                    iv.recovery?.let { String.format("%.0f", it) } ?: "-"
                )},
                colW = listOf(36f, 36f, 32f, 70f, 58f, 42f, 48f, 50f, 60f, 35f, 48f)
            )

            // Detailed notes for intervals with extra data
            ivs.filter { !it.notes.isNullOrBlank() || it.structure != null || it.weathering != null }.forEach { iv ->
                ps.guard(22f)
                val detail = buildString {
                    append("${iv.fromDepth}-${iv.toDepth} m: ")
                    if (iv.structure != null) append("Estructura: ${iv.structure}. ")
                    if (iv.weathering != null) append("Meteorización: ${iv.weathering}. ")
                    if (iv.mineralizationPercent != null) append("Mineral. ${String.format("%.1f", iv.mineralizationPercent)}%. ")
                    if (!iv.notes.isNullOrBlank()) append(iv.notes)
                }
                ps.cv.drawText(detail.trimEnd(), ML + 3f, ps.y, tSmall)
                ps.y += 11f
            }
        }

        // ── Photos ───────────────────────────────────────────────────────
        if (photos.isNotEmpty()) {
            ps.y += 5f
            ps.guard(20f)
            ps.cv.drawText("FOTOGRAFÍAS  (${photos.size} foto${if (photos.size > 1) "s" else ""})",
                ML + 3f, ps.y + 9f, tGoldLbl); ps.y += 14f
            photos.forEach { drawPhotoBlock(ps, it) }
        }

        // Separator
        ps.guard(8f)
        ps.cv.drawLine(ML, ps.y + 3f, ML + CW, ps.y + 3f, pHair)
        ps.y += 12f
    }
}
