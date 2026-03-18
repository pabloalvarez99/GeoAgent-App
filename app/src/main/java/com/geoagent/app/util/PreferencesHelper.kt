package com.geoagent.app.util

import android.content.Context
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

enum class CoordinateFormat(val label: String) {
    DECIMAL_DEGREES("Grados Decimales (DD)"),
    DMS("Grados, Minutos, Segundos (DMS)"),
}

enum class DistanceUnit(val label: String) {
    METERS("Metros (m)"),
    FEET("Pies (ft)"),
}

@Singleton
class PreferencesHelper @Inject constructor(
    @ApplicationContext context: Context,
) {
    private val prefs = context.getSharedPreferences("geoagent_prefs", Context.MODE_PRIVATE)

    var lastGeologistName: String
        get() = prefs.getString("last_geologist_name", "") ?: ""
        set(value) = prefs.edit().putString("last_geologist_name", value).apply()

    var coordinateFormat: CoordinateFormat
        get() = CoordinateFormat.entries.getOrNull(
            prefs.getInt("coordinate_format", 0)
        ) ?: CoordinateFormat.DECIMAL_DEGREES
        set(value) = prefs.edit().putInt("coordinate_format", value.ordinal).apply()

    var distanceUnit: DistanceUnit
        get() = DistanceUnit.entries.getOrNull(
            prefs.getInt("distance_unit", 0)
        ) ?: DistanceUnit.METERS
        set(value) = prefs.edit().putInt("distance_unit", value.ordinal).apply()

    var defaultProjectName: String
        get() = prefs.getString("default_project_name", "") ?: ""
        set(value) = prefs.edit().putString("default_project_name", value).apply()

    var autoSaveGps: Boolean
        get() = prefs.getBoolean("auto_save_gps", true)
        set(value) = prefs.edit().putBoolean("auto_save_gps", value).apply()

    var highAccuracyGps: Boolean
        get() = prefs.getBoolean("high_accuracy_gps", true)
        set(value) = prefs.edit().putBoolean("high_accuracy_gps", value).apply()

    /** Format a coordinate pair according to user preference. */
    fun formatCoordinate(lat: Double, lng: Double): String {
        return when (coordinateFormat) {
            CoordinateFormat.DECIMAL_DEGREES -> {
                "${"%.6f".format(lat)}, ${"%.6f".format(lng)}"
            }
            CoordinateFormat.DMS -> {
                "${toDMS(lat, isLat = true)}, ${toDMS(lng, isLat = false)}"
            }
        }
    }

    /** Format a single depth/distance value according to unit preference. */
    fun formatDepth(meters: Double): String {
        return when (distanceUnit) {
            DistanceUnit.METERS -> "${"%.1f".format(meters)} m"
            DistanceUnit.FEET -> "${"%.1f".format(meters * 3.28084)} ft"
        }
    }

    private fun toDMS(decimal: Double, isLat: Boolean): String {
        val direction = if (isLat) {
            if (decimal >= 0) "N" else "S"
        } else {
            if (decimal >= 0) "E" else "W"
        }
        val abs = Math.abs(decimal)
        val deg = abs.toInt()
        val minFull = (abs - deg) * 60
        val min = minFull.toInt()
        val sec = (minFull - min) * 60
        return "%d°%02d'%05.2f\"%s".format(deg, min, sec, direction)
    }
}
