package com.geoagent.app.util

object FormValidation {

    fun validateRequired(value: String, fieldName: String): String? {
        return if (value.isBlank()) "$fieldName es obligatorio" else null
    }

    fun validateRange(value: Double?, min: Double, max: Double, fieldName: String): String? {
        if (value == null) return null
        return if (value < min || value > max) "$fieldName debe estar entre $min y $max" else null
    }

    fun validateStrike(value: Double?): String? =
        validateRange(value, 0.0, 360.0, "Rumbo")

    fun validateDip(value: Double?): String? =
        validateRange(value, 0.0, 90.0, "Manteo")

    fun validateInclination(value: Double?): String? =
        validateRange(value, -90.0, 0.0, "Inclinacion")

    fun validateAzimuth(value: Double?): String? =
        validateRange(value, 0.0, 360.0, "Azimut")

    fun validatePercentage(value: Double?, fieldName: String): String? =
        validateRange(value, 0.0, 100.0, fieldName)

    fun validateDepthOrder(from: Double?, to: Double?): String? {
        if (from == null || to == null) return null
        return if (from >= to) "'Desde' debe ser menor que 'Hasta'" else null
    }

    fun validatePositive(value: Double?, fieldName: String): String? {
        if (value == null) return null
        return if (value <= 0) "$fieldName debe ser positivo" else null
    }

    fun validateLatitude(value: Double?): String? =
        validateRange(value, -90.0, 90.0, "Latitud")

    fun validateLongitude(value: Double?): String? =
        validateRange(value, -180.0, 180.0, "Longitud")

    fun parseDouble(text: String): Double? {
        return text.replace(",", ".").toDoubleOrNull()
    }
}
