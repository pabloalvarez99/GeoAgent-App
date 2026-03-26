package com.geoagent.app.ui.screens.drillhole

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import com.geoagent.app.data.GeoConstants
import com.geoagent.app.util.FormValidation
import com.google.android.gms.location.CurrentLocationRequest
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority

@SuppressLint("MissingPermission")
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DrillHoleCreateScreen(
    projectId: Long,
    onCreated: (Long) -> Unit,
    onNavigateBack: () -> Unit,
    viewModel: DrillHoleCreateViewModel = hiltViewModel(),
) {
    val context = LocalContext.current
    val isSaving by viewModel.isSaving.collectAsState()
    val suggestedHoleId by viewModel.suggestedHoleId.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(errorMessage) {
        errorMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearError()
        }
    }

    val editHoleIdState by viewModel.editHoleId.collectAsState()
    val editTypeState by viewModel.editType.collectAsState()
    val editLatState by viewModel.editLatitude.collectAsState()
    val editLngState by viewModel.editLongitude.collectAsState()
    val editAltState by viewModel.editAltitude.collectAsState()
    val editAzState by viewModel.editAzimuth.collectAsState()
    val editIncState by viewModel.editInclination.collectAsState()
    val editDepthState by viewModel.editPlannedDepth.collectAsState()
    val editGeoState by viewModel.editGeologist.collectAsState()
    val editNotesState by viewModel.editNotes.collectAsState()

    var holeId by remember { mutableStateOf("") }
    var selectedType by remember { mutableStateOf("Diamantina") }
    var typeExpanded by remember { mutableStateOf(false) }
    var latitude by remember { mutableStateOf("") }
    var longitude by remember { mutableStateOf("") }
    var altitude by remember { mutableStateOf("") }
    var azimuth by remember { mutableStateOf("") }
    var inclination by remember { mutableStateOf("") }
    var plannedDepth by remember { mutableStateOf("") }
    var geologist by remember { mutableStateOf(viewModel.savedGeologist) }
    var notes by remember { mutableStateOf("") }
    var hasLocationPermission by remember { mutableStateOf(false) }
    var gpsAccuracy by remember { mutableStateOf<Float?>(null) }
    var editFieldsLoaded by remember { mutableStateOf(false) }

    // Pre-fill fields when editing
    LaunchedEffect(editHoleIdState, editTypeState, editLatState) {
        if (viewModel.isEditing && !editFieldsLoaded && editHoleIdState.isNotBlank()) {
            holeId = editHoleIdState
            selectedType = editTypeState
            latitude = editLatState
            longitude = editLngState
            altitude = editAltState
            azimuth = editAzState
            inclination = editIncState
            plannedDepth = editDepthState
            geologist = editGeoState
            notes = editNotesState
            editFieldsLoaded = true
        }
    }

    val drillTypes = GeoConstants.drillHoleTypes

    val locationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        hasLocationPermission = granted
    }

    // Pre-fill holeId with auto-generated code once available
    LaunchedEffect(suggestedHoleId) {
        if (holeId.isBlank() && suggestedHoleId.isNotBlank()) {
            holeId = suggestedHoleId
        }
    }

    // Check permission and auto-capture GPS
    LaunchedEffect(Unit) {
        hasLocationPermission = ContextCompat.checkSelfPermission(
            context, Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        if (!hasLocationPermission) {
            locationPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
        }
    }

    fun captureGps() {
        if (!hasLocationPermission) {
            locationPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
            return
        }
        val fusedLocationClient = LocationServices.getFusedLocationProviderClient(context)
        fusedLocationClient.lastLocation.addOnSuccessListener { location ->
            if (location != null) {
                latitude = "%.6f".format(location.latitude)
                longitude = "%.6f".format(location.longitude)
                if (location.hasAltitude()) altitude = "%.1f".format(location.altitude)
                if (location.hasAccuracy()) gpsAccuracy = location.accuracy
            } else {
                val request = CurrentLocationRequest.Builder()
                    .setPriority(Priority.PRIORITY_HIGH_ACCURACY)
                    .build()
                fusedLocationClient.getCurrentLocation(request, null)
                    .addOnSuccessListener { fresh ->
                        fresh?.let {
                            latitude = "%.6f".format(it.latitude)
                            longitude = "%.6f".format(it.longitude)
                            if (it.hasAltitude()) altitude = "%.1f".format(it.altitude)
                            if (it.hasAccuracy()) gpsAccuracy = it.accuracy
                        }
                    }
            }
        }
    }

    // Auto-capture GPS on permission grant (skip when editing)
    LaunchedEffect(hasLocationPermission) {
        if (hasLocationPermission && !viewModel.isEditing && latitude.isBlank()) {
            captureGps()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = if (viewModel.isEditing) "Editar Sondaje" else "Nuevo Sondaje",
                        fontWeight = FontWeight.SemiBold,
                    )
                },
                navigationIcon = {
                    IconButton(
                        onClick = onNavigateBack,
                        modifier = Modifier.size(48.dp),
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Volver",
                        )
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
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            // Hole ID
            OutlinedTextField(
                value = holeId,
                onValueChange = { holeId = it },
                label = { Text("Codigo de Sondaje *") },
                placeholder = { Text("Ej: DDH-001") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )

            // Drill type dropdown
            ExposedDropdownMenuBox(
                expanded = typeExpanded,
                onExpandedChange = { typeExpanded = it },
            ) {
                OutlinedTextField(
                    value = selectedType,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Tipo de Sondaje") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = typeExpanded) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor(MenuAnchorType.PrimaryNotEditable),
                )
                ExposedDropdownMenu(
                    expanded = typeExpanded,
                    onDismissRequest = { typeExpanded = false },
                ) {
                    drillTypes.forEach { type ->
                        DropdownMenuItem(
                            text = { Text(type) },
                            onClick = {
                                selectedType = type
                                typeExpanded = false
                            },
                            contentPadding = ExposedDropdownMenuDefaults.ItemContentPadding,
                        )
                    }
                }
            }

            // GPS coordinates card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.secondaryContainer,
                ),
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.LocationOn,
                                contentDescription = null,
                                modifier = Modifier.size(24.dp),
                                tint = MaterialTheme.colorScheme.onSecondaryContainer,
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Coordenadas GPS",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onSecondaryContainer,
                            )
                        }
                        IconButton(
                            onClick = { captureGps() },
                            modifier = Modifier.size(48.dp),
                        ) {
                            Icon(
                                imageVector = Icons.Default.MyLocation,
                                contentDescription = "Actualizar ubicacion",
                                tint = MaterialTheme.colorScheme.onSecondaryContainer,
                            )
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        OutlinedTextField(
                            value = latitude,
                            onValueChange = { latitude = it },
                            label = { Text("Latitud *") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                        )
                        OutlinedTextField(
                            value = longitude,
                            onValueChange = { longitude = it },
                            label = { Text("Longitud *") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        OutlinedTextField(
                            value = altitude,
                            onValueChange = { altitude = it },
                            label = { Text("Altitud (m)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                        )

                        // GPS accuracy indicator
                        Column(
                            modifier = Modifier.weight(1f),
                            horizontalAlignment = Alignment.CenterHorizontally,
                        ) {
                            Text(
                                text = "Precision GPS",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.7f),
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = if (gpsAccuracy != null) "±%.0f m".format(gpsAccuracy) else "--",
                                style = MaterialTheme.typography.bodyLarge,
                                fontWeight = FontWeight.Medium,
                                color = if (gpsAccuracy != null && gpsAccuracy!! <= 10f) {
                                    MaterialTheme.colorScheme.onSecondaryContainer
                                } else if (gpsAccuracy != null) {
                                    MaterialTheme.colorScheme.error
                                } else {
                                    MaterialTheme.colorScheme.onSecondaryContainer
                                },
                            )
                        }
                    }
                }
            }

            // Azimuth and inclination
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                OutlinedTextField(
                    value = azimuth,
                    onValueChange = { azimuth = it },
                    label = { Text("Azimut (0-360)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    supportingText = { Text("Grados") },
                )
                OutlinedTextField(
                    value = inclination,
                    onValueChange = { inclination = it },
                    label = { Text("Inclinacion (-90 a 0)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    supportingText = { Text("Grados") },
                )
            }

            // Planned depth
            OutlinedTextField(
                value = plannedDepth,
                onValueChange = { plannedDepth = it },
                label = { Text("Profundidad Planificada (m)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )

            // Geologist
            OutlinedTextField(
                value = geologist,
                onValueChange = { geologist = it },
                label = { Text("Geologo *") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )

            // Notes
            OutlinedTextField(
                value = notes,
                onValueChange = { notes = it },
                label = { Text("Notas") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(120.dp),
                maxLines = 5,
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Save button
            Button(
                onClick = {
                    viewModel.create(
                        holeId = holeId.trim(),
                        type = selectedType,
                        latitude = FormValidation.parseDouble(latitude),
                        longitude = FormValidation.parseDouble(longitude),
                        altitude = FormValidation.parseDouble(altitude),
                        azimuth = FormValidation.parseDouble(azimuth),
                        inclination = FormValidation.parseDouble(inclination),
                        plannedDepth = FormValidation.parseDouble(plannedDepth),
                        geologist = geologist.trim(),
                        notes = notes.trim().ifBlank { null },
                        onCreated = onCreated,
                    )
                },
                enabled = !isSaving,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                ),
            ) {
                if (isSaving) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = MaterialTheme.colorScheme.onPrimary,
                        strokeWidth = 2.dp,
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.Save,
                        contentDescription = null,
                        modifier = Modifier.size(24.dp),
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = if (viewModel.isEditing) "Actualizar Sondaje" else "Guardar Sondaje",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}
