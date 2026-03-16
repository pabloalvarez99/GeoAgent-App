package com.geoagent.app.util

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object DateFormatter {
    private val dateFormat = SimpleDateFormat("dd/MM/yyyy", Locale("es"))
    private val dateTimeFormat = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale("es"))
    private val fileNameFormat = SimpleDateFormat("yyyyMMdd_HHmmss", Locale("es"))

    fun formatDate(timestamp: Long): String = dateFormat.format(Date(timestamp))
    fun formatDateTime(timestamp: Long): String = dateTimeFormat.format(Date(timestamp))
    fun formatForFileName(timestamp: Long): String = fileNameFormat.format(Date(timestamp))
}
