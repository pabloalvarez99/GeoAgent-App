package com.geoagent.app.ui.screens.photo

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.hilt.navigation.compose.hiltViewModel
import com.google.android.gms.location.CurrentLocationRequest
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import java.io.File

@SuppressLint("MissingPermission")
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CameraCaptureScreen(
    stationId: Long?,
    drillHoleId: Long?,
    projectId: Long? = null,
    onPhotoCaptured: () -> Unit,
    onNavigateBack: () -> Unit,
    viewModel: CameraCaptureViewModel = hiltViewModel(),
) {
    val context = LocalContext.current
    val isSaving by viewModel.isSaving.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()

    // Use rememberSaveable for critical state that must survive activity recreation
    // (Android may kill the activity while camera is in foreground)
    var photoUriString by rememberSaveable { mutableStateOf<String?>(null) }
    val photoUri: Uri? = photoUriString?.let { Uri.parse(it) }
    var photoFilePath by rememberSaveable { mutableStateOf<String?>(null) }
    val photoFile: File? = photoFilePath?.let { File(it) }
    var showDescriptionDialog by rememberSaveable { mutableStateOf(false) }
    var description by rememberSaveable { mutableStateOf("") }
    var currentLatitude by rememberSaveable { mutableStateOf<Double?>(null) }
    var currentLongitude by rememberSaveable { mutableStateOf<Double?>(null) }
    var cameraLaunched by rememberSaveable { mutableStateOf(false) }
    var photoCount by rememberSaveable { mutableIntStateOf(0) }
    var showSavedState by rememberSaveable { mutableStateOf(false) }

    // Error dialog
    errorMessage?.let { msg ->
        AlertDialog(
            onDismissRequest = viewModel::clearError,
            title = { Text("Error") },
            text = { Text(msg) },
            confirmButton = {
                TextButton(onClick = viewModel::clearError) {
                    Text("OK")
                }
            },
        )
    }

    // Camera launcher
    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success ->
        // IMPORTANT: Use photoUriString (state-backed delegate) NOT photoUri (local val).
        // Local vals are captured at lambda creation time and would be stale (null).
        if (success && photoUriString != null) {
            showDescriptionDialog = true
        } else if (photoCount == 0) {
            // Cancelled before any photos were taken
            onNavigateBack()
        }
        // If photoCount > 0 and cancelled, remain on the saved state screen
    }

    // Permission launcher
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        if (permissions[Manifest.permission.CAMERA] == true) {
            launchCamera(context, viewModel, cameraLauncher) { file, uri ->
                photoFilePath = file.absolutePath
                photoUriString = uri.toString()
            }
        }
    }

    // Capture GPS on screen open
    LaunchedEffect(Unit) {
        val hasLocationPermission = ContextCompat.checkSelfPermission(
            context, Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        if (hasLocationPermission) {
            val fusedLocationClient = LocationServices.getFusedLocationProviderClient(context)
            fusedLocationClient.lastLocation.addOnSuccessListener { location ->
                if (location != null) {
                    currentLatitude = location.latitude
                    currentLongitude = location.longitude
                } else {
                    val request = CurrentLocationRequest.Builder()
                        .setPriority(Priority.PRIORITY_HIGH_ACCURACY)
                        .build()
                    fusedLocationClient.getCurrentLocation(request, null)
                        .addOnSuccessListener { fresh ->
                            fresh?.let {
                                currentLatitude = it.latitude
                                currentLongitude = it.longitude
                            }
                        }
                }
            }
        }
    }

    // Open camera immediately on first composition
    LaunchedEffect(Unit) {
        if (!cameraLaunched) {
            cameraLaunched = true
            val hasCameraPermission = ContextCompat.checkSelfPermission(
                context, Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED
            if (hasCameraPermission) {
                launchCamera(context, viewModel, cameraLauncher) { file, uri ->
                    photoFilePath = file.absolutePath
                    photoUriString = uri.toString()
                }
            } else {
                permissionLauncher.launch(arrayOf(Manifest.permission.CAMERA))
            }
        }
    }

    // Description dialog (shown after photo is taken)
    if (showDescriptionDialog) {
        AlertDialog(
            onDismissRequest = { },
            title = { Text("Descripcion de la foto") },
            text = {
                Column {
                    Text(
                        text = "Agrega una descripcion opcional para esta foto.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = { Text("Descripcion") },
                        modifier = Modifier.fillMaxWidth(),
                        maxLines = 3,
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        photoFilePath?.let { path -> File(path) }?.let { file ->
                            viewModel.savePhoto(
                                file = file,
                                stationId = stationId,
                                drillHoleId = drillHoleId,
                                projectId = projectId,
                                description = description.trim().ifBlank { null },
                                latitude = currentLatitude,
                                longitude = currentLongitude,
                                onSaved = {
                                    photoCount++
                                    showDescriptionDialog = false
                                    showSavedState = true
                                    description = ""
                                },
                            )
                        }
                    },
                    enabled = !isSaving,
                ) {
                    if (isSaving) {
                        CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                    } else {
                        Text("Guardar")
                    }
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        photoFilePath?.let { path -> File(path) }?.let { file ->
                            viewModel.savePhoto(
                                file = file,
                                stationId = stationId,
                                drillHoleId = drillHoleId,
                                projectId = projectId,
                                description = null,
                                latitude = currentLatitude,
                                longitude = currentLongitude,
                                onSaved = {
                                    photoCount++
                                    showDescriptionDialog = false
                                    showSavedState = true
                                    description = ""
                                },
                            )
                        }
                    },
                ) {
                    Text("Sin descripcion")
                }
            },
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = if (photoCount == 0) "Capturar Foto" else "Fotos ($photoCount guardada${if (photoCount != 1) "s" else ""})",
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
            contentAlignment = Alignment.Center,
        ) {
            if (showSavedState) {
                // Multi-shot UI: photo was just saved
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    modifier = Modifier.padding(32.dp),
                ) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = null,
                        modifier = Modifier.size(72.dp),
                        tint = MaterialTheme.colorScheme.primary,
                    )
                    Text(
                        text = "$photoCount foto${if (photoCount != 1) "s" else ""} guardada${if (photoCount != 1) "s" else ""}",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                    )
                    Text(
                        text = "Puedes tomar mas fotos o terminar el registro.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center,
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    // Take another photo
                    Button(
                        onClick = {
                            showSavedState = false
                            val hasCameraPermission = ContextCompat.checkSelfPermission(
                                context, Manifest.permission.CAMERA
                            ) == PackageManager.PERMISSION_GRANTED
                            if (hasCameraPermission) {
                                launchCamera(context, viewModel, cameraLauncher) { file, uri ->
                                    photoFilePath = file.absolutePath
                                    photoUriString = uri.toString()
                                }
                            } else {
                                permissionLauncher.launch(arrayOf(Manifest.permission.CAMERA))
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary,
                        ),
                    ) {
                        Icon(
                            imageVector = Icons.Default.CameraAlt,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp),
                        )
                        Spacer(modifier = Modifier.size(8.dp))
                        Text("Tomar Otra Foto", style = MaterialTheme.typography.titleMedium)
                    }

                    // Done
                    OutlinedButton(
                        onClick = onPhotoCaptured,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                    ) {
                        Text("Terminar Registro", style = MaterialTheme.typography.titleMedium)
                    }
                }
            } else {
                // Initial state: waiting for camera or showing manual trigger
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                ) {
                    Icon(
                        imageVector = Icons.Default.CameraAlt,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Abriendo camara...",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center,
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                    Button(
                        onClick = {
                            val hasCameraPermission = ContextCompat.checkSelfPermission(
                                context, Manifest.permission.CAMERA
                            ) == PackageManager.PERMISSION_GRANTED
                            if (hasCameraPermission) {
                                launchCamera(context, viewModel, cameraLauncher) { file, uri ->
                                    photoFilePath = file.absolutePath
                                    photoUriString = uri.toString()
                                }
                            } else {
                                permissionLauncher.launch(arrayOf(Manifest.permission.CAMERA))
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth(0.6f)
                            .height(52.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary,
                        ),
                    ) {
                        Icon(
                            imageVector = Icons.Default.CameraAlt,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp),
                        )
                        Spacer(modifier = Modifier.size(8.dp))
                        Text("Tomar Foto")
                    }
                }
            }
        }
    }
}

private fun launchCamera(
    context: android.content.Context,
    viewModel: CameraCaptureViewModel,
    launcher: androidx.activity.result.ActivityResultLauncher<Uri>,
    onFileCreated: (File, Uri) -> Unit,
) {
    try {
        val photoDir = viewModel.getPhotoDir()
        // Ensure directory exists before creating the file
        if (!photoDir.exists()) {
            photoDir.mkdirs()
        }
        val fileName = "photo_${System.currentTimeMillis()}.jpg"
        val file = File(photoDir, fileName)
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            file,
        )
        onFileCreated(file, uri)
        launcher.launch(uri)
    } catch (e: Exception) {
        // If FileProvider fails, the camera can't be opened
        android.widget.Toast.makeText(
            context,
            "Error al abrir la camara: ${e.message}",
            android.widget.Toast.LENGTH_LONG,
        ).show()
    }
}
