package com.geoagent.app.util

import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

object DateFormatter {
    private val dateFormat = DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale("es"))
    private val dateTimeFormat = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm", Locale("es"))
    private val fileNameFormat = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss", Locale.US)

    fun formatDate(timestamp: Long): String =
        Instant.ofEpochMilli(timestamp).atZone(ZoneId.systemDefault()).format(dateFormat)

    fun formatDateTime(timestamp: Long): String =
        Instant.ofEpochMilli(timestamp).atZone(ZoneId.systemDefault()).format(dateTimeFormat)

    fun formatForFileName(timestamp: Long): String =
        Instant.ofEpochMilli(timestamp).atZone(ZoneId.systemDefault()).format(fileNameFormat)
}
