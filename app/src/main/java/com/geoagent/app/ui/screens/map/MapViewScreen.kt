package com.geoagent.app.ui.screens.map

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Button
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.MapProperties
import com.google.maps.android.compose.MapType
import com.google.maps.android.compose.MapUiSettings
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.rememberCameraPositionState
import kotlinx.coroutines.launch

data class SelectedMarker(
    val id: Long,
    val code: String,
    val type: String,
    val lat: Double,
    val lng: Double,
)

@SuppressLint("MissingPermission")
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MapViewScreen(
    projectId: Long,
    onNavigateToStation: (Long) -> Unit,
    onNavigateToDrillHole: (Long) -> Unit,
    onNavigateBack: () -> Unit,
    viewModel: MapViewModel = hiltViewModel(),
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val stations by viewModel.stations.collectAsState()
    val drillHoles by viewModel.drillHoles.collectAsState()
    val centerPoint by viewModel.centerPoint.collectAsState()
    val mapType by viewModel.mapType.collectAsState()

    var selectedMarker by remember { mutableStateOf<SelectedMarker?>(null) }
    val bottomSheetState = rememberModalBottomSheetState()
    var centeredOnce by remember { mutableStateOf(false) }
    var locationPermissionGranted by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(
                context, Manifest.permission.ACCESS_FINE_LOCATION,
            ) == PackageManager.PERMISSION_GRANTED
        )
    }

    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(LatLng(-33.45, -70.65), 5f)
    }

    // Helper to move camera to current location
    val goToMyLocation: () -> Unit = {
        val fusedClient = LocationServices.getFusedLocationProviderClient(context)
        @SuppressLint("MissingPermission")
        val task = fusedClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null)
        task.addOnSuccessListener { location ->
            if (location != null) {
                scope.launch {
                    cameraPositionState.animate(
                        CameraUpdateFactory.newLatLngZoom(
                            LatLng(location.latitude, location.longitude), 16f,
                        ),
                    )
                }
            } else {
                // Fallback to last known location
                @SuppressLint("MissingPermission")
                val lastTask = fusedClient.lastLocation
                lastTask.addOnSuccessListener { last ->
                    if (last != null) {
                        scope.launch {
                            cameraPositionState.animate(
                                CameraUpdateFactory.newLatLngZoom(
                                    LatLng(last.latitude, last.longitude), 16f,
                                ),
                            )
                        }
                    } else {
                        Toast.makeText(context, "No se pudo obtener la ubicacion. Activa el GPS.", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
        task.addOnFailureListener {
            Toast.makeText(context, "Error al obtener ubicacion: ${it.message}", Toast.LENGTH_SHORT).show()
        }
    }

    // Permission launcher
    val locationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission(),
    ) { granted ->
        locationPermissionGranted = granted
        if (granted) {
            goToMyLocation()
        } else {
            Toast.makeText(context, "Permiso de ubicacion denegado", Toast.LENGTH_SHORT).show()
        }
    }

    val googleMapType = when (mapType) {
        GeoMapType.NORMAL -> MapType.NORMAL
        GeoMapType.SATELLITE -> MapType.SATELLITE
        GeoMapType.TERRAIN -> MapType.TERRAIN
        GeoMapType.HYBRID -> MapType.HYBRID
    }

    val mapProperties = MapProperties(
        mapType = googleMapType,
        isMyLocationEnabled = locationPermissionGranted,
    )

    val mapUiSettings = MapUiSettings(
        myLocationButtonEnabled = false,
        zoomControlsEnabled = false,
        compassEnabled = true,
        mapToolbarEnabled = false,
    )

    // Center camera on data points once loaded
    LaunchedEffect(centerPoint, centeredOnce) {
        val center = centerPoint
        if (!centeredOnce && center != null) {
            val (lat, lng) = center
            cameraPositionState.animate(
                CameraUpdateFactory.newLatLngZoom(LatLng(lat, lng), 13f),
            )
            centeredOnce = true
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = if (projectId == 0L) "Mapa General" else "Mapa del Proyecto",
                        fontWeight = FontWeight.SemiBold,
                    )
                },
                navigationIcon = {
                    IconButton(
                        onClick = onNavigateBack,
                        modifier = Modifier.size(48.dp),
                    ) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer,
                    navigationIconContentColor = MaterialTheme.colorScheme.onPrimaryContainer,
                ),
            )
        },
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
        ) {
            GoogleMap(
                modifier = Modifier.fillMaxSize(),
                cameraPositionState = cameraPositionState,
                properties = mapProperties,
                uiSettings = mapUiSettings,
            ) {
                // Station markers (orange)
                stations.forEach { station ->
                    Marker(
                        state = MarkerState(position = LatLng(station.latitude, station.longitude)),
                        title = station.code,
                        snippet = "Estacion",
                        icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_ORANGE),
                        onClick = {
                            selectedMarker = SelectedMarker(
                                id = station.id,
                                code = station.code,
                                type = "station",
                                lat = station.latitude,
                                lng = station.longitude,
                            )
                            true
                        },
                    )
                }

                // Drill hole markers (blue)
                drillHoles.forEach { dh ->
                    Marker(
                        state = MarkerState(position = LatLng(dh.latitude, dh.longitude)),
                        title = dh.holeId,
                        snippet = "Sondaje",
                        icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_AZURE),
                        onClick = {
                            selectedMarker = SelectedMarker(
                                id = dh.id,
                                code = dh.holeId,
                                type = "drillhole",
                                lat = dh.latitude,
                                lng = dh.longitude,
                            )
                            true
                        },
                    )
                }
            }

            // Map type selector (top-start)
            Card(
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(8.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.93f),
                ),
                elevation = CardDefaults.cardElevation(4.dp),
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    GeoMapType.entries.forEach { type ->
                        FilterChip(
                            selected = mapType == type,
                            onClick = { viewModel.setMapType(type) },
                            label = {
                                Text(
                                    text = type.label,
                                    style = MaterialTheme.typography.labelSmall,
                                )
                            },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = MaterialTheme.colorScheme.primary,
                                selectedLabelColor = MaterialTheme.colorScheme.onPrimary,
                            ),
                        )
                    }
                }
            }

            // Legend (top-end)
            Card(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(8.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.93f),
                ),
                elevation = CardDefaults.cardElevation(4.dp),
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    LegendItem(color = Color(0xFFFFB300), label = "Estacion (${stations.size})")
                    LegendItem(color = Color(0xFF1565C0), label = "Sondaje (${drillHoles.size})")
                }
            }

            // GPS FAB (bottom-end)
            FloatingActionButton(
                onClick = {
                    if (locationPermissionGranted) {
                        goToMyLocation()
                    } else {
                        locationPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
                    }
                },
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(16.dp),
                containerColor = MaterialTheme.colorScheme.primaryContainer,
            ) {
                Icon(Icons.Default.MyLocation, contentDescription = "Mi ubicacion")
            }
        }
    }

    // Marker detail bottom sheet
    selectedMarker?.let { marker ->
        ModalBottomSheet(
            onDismissRequest = { selectedMarker = null },
            sheetState = bottomSheetState,
        ) {
            MarkerBottomSheet(
                marker = marker,
                onNavigate = {
                    selectedMarker = null
                    if (marker.type == "station") onNavigateToStation(marker.id)
                    else onNavigateToDrillHole(marker.id)
                },
                onDismiss = { selectedMarker = null },
                formatCoordinate = viewModel::formatCoordinate,
            )
        }
    }
}

@Composable
private fun LegendItem(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(10.dp)
                .clip(CircleShape)
                .background(color),
        )
        Spacer(modifier = Modifier.width(6.dp))
        Text(label, style = MaterialTheme.typography.labelSmall)
    }
}

@Composable
private fun MarkerBottomSheet(
    marker: SelectedMarker,
    onNavigate: () -> Unit,
    onDismiss: () -> Unit,
    formatCoordinate: (Double, Double) -> String = { lat, lng -> "%.6f, %.6f".format(lat, lng) },
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp)
            .padding(bottom = 32.dp),
    ) {
        val isStation = marker.type == "station"
        Text(
            text = if (isStation) "Estacion de Campo" else "Sondaje",
            style = MaterialTheme.typography.labelMedium,
            color = if (isStation) Color(0xFFFFB300) else Color(0xFF1565C0),
            fontWeight = FontWeight.Bold,
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = marker.code,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = formatCoordinate(marker.lat, marker.lng),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(modifier = Modifier.height(24.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            TextButton(onClick = onDismiss, modifier = Modifier.weight(1f)) {
                Text("Cerrar")
            }
            Button(onClick = onNavigate, modifier = Modifier.weight(1f)) {
                Text("Ver Detalles")
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
    }
}
