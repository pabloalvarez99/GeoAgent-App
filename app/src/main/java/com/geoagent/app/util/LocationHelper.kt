package com.geoagent.app.util

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import androidx.core.content.ContextCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.suspendCancellableCoroutine
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.coroutines.resume

data class GpsLocation(
    val latitude: Double,
    val longitude: Double,
    val altitude: Double?,
)

@Singleton
class LocationHelper @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val fusedClient: FusedLocationProviderClient =
        LocationServices.getFusedLocationProviderClient(context)

    fun hasPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context, Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }

    suspend fun getCurrentLocation(): GpsLocation? {
        if (!hasPermission()) return null

        return suspendCancellableCoroutine { cont ->
            val cancellationToken = CancellationTokenSource()
            try {
                fusedClient.getCurrentLocation(
                    Priority.PRIORITY_HIGH_ACCURACY,
                    cancellationToken.token
                ).addOnSuccessListener { location: Location? ->
                    if (location != null) {
                        cont.resume(
                            GpsLocation(
                                latitude = location.latitude,
                                longitude = location.longitude,
                                altitude = if (location.hasAltitude()) location.altitude else null,
                            )
                        )
                    } else {
                        cont.resume(null)
                    }
                }.addOnFailureListener {
                    cont.resume(null)
                }
            } catch (e: SecurityException) {
                cont.resume(null)
            }

            cont.invokeOnCancellation {
                cancellationToken.cancel()
            }
        }
    }

    fun formatCoordinate(value: Double, isLatitude: Boolean): String {
        val direction = if (isLatitude) {
            if (value >= 0) "N" else "S"
        } else {
            if (value >= 0) "E" else "W"
        }
        return "%.6f° %s".format(Math.abs(value), direction)
    }

    fun formatDMS(value: Double, isLatitude: Boolean): String {
        val direction = if (isLatitude) {
            if (value >= 0) "N" else "S"
        } else {
            if (value >= 0) "E" else "W"
        }
        val abs = Math.abs(value)
        val degrees = abs.toInt()
        val minutesFloat = (abs - degrees) * 60
        val minutes = minutesFloat.toInt()
        val seconds = (minutesFloat - minutes) * 60
        return "%d°%02d'%05.2f\"%s".format(degrees, minutes, seconds, direction)
    }
}
