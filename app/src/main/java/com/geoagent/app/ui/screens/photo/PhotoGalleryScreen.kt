package com.geoagent.app.ui.screens.photo

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.hilt.navigation.compose.hiltViewModel
import android.content.Intent
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.FileProvider
import coil.compose.AsyncImage
import com.geoagent.app.data.local.entity.PhotoEntity
import java.io.File

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PhotoGalleryScreen(
    stationId: Long?,
    drillHoleId: Long?,
    projectId: Long? = null,
    onNavigateBack: () -> Unit,
    viewModel: PhotoGalleryViewModel = hiltViewModel(),
) {
    val photos by viewModel.photos.collectAsState()
    var selectedPhoto by remember { mutableStateOf<PhotoEntity?>(null) }
    var showDeleteConfirm by remember { mutableStateOf(false) }
    var showEditDescription by remember { mutableStateOf(false) }
    var editDescriptionText by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = if (photos.isNotEmpty()) "Fotos (${photos.size})" else "Fotos",
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
        if (photos.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentAlignment = Alignment.Center,
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "Sin fotos",
                        style = MaterialTheme.typography.titleLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Las fotos capturadas apareceran aqui",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        } else {
            LazyVerticalGrid(
                columns = GridCells.Fixed(3),
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentPadding = PaddingValues(8.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                items(photos, key = { it.id }) { photo ->
                    PhotoThumbnail(
                        photo = photo,
                        onClick = { selectedPhoto = photo },
                    )
                }
            }
        }
    }

    val context = LocalContext.current

    // Full screen photo viewer
    selectedPhoto?.let { photo ->
        Dialog(
            onDismissRequest = { selectedPhoto = null },
            properties = DialogProperties(usePlatformDefaultWidth = false),
        ) {
            Surface(
                modifier = Modifier.fillMaxSize(),
                color = MaterialTheme.colorScheme.background,
            ) {
                Box(modifier = Modifier.fillMaxSize()) {
                    AsyncImage(
                        model = File(photo.filePath),
                        contentDescription = photo.description,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Fit,
                    )

                    // Close and share buttons (top-end)
                    Column(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(16.dp),
                    ) {
                        IconButton(onClick = { selectedPhoto = null }) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Cerrar",
                                tint = MaterialTheme.colorScheme.onSurface,
                            )
                        }
                        IconButton(
                            onClick = {
                                val file = File(photo.filePath)
                                if (file.exists()) {
                                    val uri = FileProvider.getUriForFile(
                                        context,
                                        "${context.packageName}.fileprovider",
                                        file,
                                    )
                                    val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                        type = "image/jpeg"
                                        putExtra(Intent.EXTRA_STREAM, uri)
                                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                        photo.description?.let { desc ->
                                            putExtra(Intent.EXTRA_TEXT, desc)
                                        }
                                    }
                                    context.startActivity(Intent.createChooser(shareIntent, "Compartir foto"))
                                }
                            },
                        ) {
                            Icon(
                                imageVector = Icons.Default.Share,
                                contentDescription = "Compartir",
                                tint = MaterialTheme.colorScheme.onSurface,
                            )
                        }
                    }

                    // Action buttons (top-start)
                    Column(
                        modifier = Modifier
                            .align(Alignment.TopStart)
                            .padding(16.dp),
                    ) {
                        IconButton(onClick = { showDeleteConfirm = true }) {
                            Icon(
                                imageVector = Icons.Default.Delete,
                                contentDescription = "Eliminar foto",
                                tint = MaterialTheme.colorScheme.error,
                            )
                        }
                        IconButton(
                            onClick = {
                                editDescriptionText = photo.description ?: ""
                                showEditDescription = true
                            },
                        ) {
                            Icon(
                                imageVector = Icons.Default.Edit,
                                contentDescription = "Editar descripcion",
                                tint = MaterialTheme.colorScheme.onSurface,
                            )
                        }
                    }

                    if (!photo.description.isNullOrBlank()) {
                        Card(
                            modifier = Modifier
                                .align(Alignment.BottomCenter)
                                .fillMaxWidth()
                                .padding(16.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.9f),
                            ),
                        ) {
                            Text(
                                text = photo.description,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(12.dp),
                            )
                        }
                    }
                }
            }
        }
    }

    if (showDeleteConfirm && selectedPhoto != null) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title = { Text("Eliminar foto") },
            text = { Text("Esta accion no se puede deshacer.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        selectedPhoto?.let { viewModel.delete(it) }
                        showDeleteConfirm = false
                        selectedPhoto = null
                    },
                ) {
                    Text("Eliminar", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false }) {
                    Text("Cancelar")
                }
            },
        )
    }

    if (showEditDescription && selectedPhoto != null) {
        AlertDialog(
            onDismissRequest = { showEditDescription = false },
            title = { Text("Descripcion de la foto") },
            text = {
                OutlinedTextField(
                    value = editDescriptionText,
                    onValueChange = { editDescriptionText = it },
                    label = { Text("Descripcion") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 3,
                    placeholder = { Text("Ej: Afloramiento de granito con vetillas de cuarzo") },
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        selectedPhoto?.let {
                            viewModel.updateDescription(it, editDescriptionText.trim())
                            selectedPhoto = it.copy(description = editDescriptionText.trim().ifBlank { null })
                        }
                        showEditDescription = false
                    },
                ) {
                    Text("Guardar")
                }
            },
            dismissButton = {
                TextButton(onClick = { showEditDescription = false }) {
                    Text("Cancelar")
                }
            },
        )
    }
}

@Composable
private fun PhotoThumbnail(
    photo: PhotoEntity,
    onClick: () -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(1f)
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            AsyncImage(
                model = File(photo.filePath),
                contentDescription = photo.description,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop,
            )

            if (!photo.description.isNullOrBlank()) {
                Card(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.8f),
                    ),
                ) {
                    Text(
                        text = photo.description,
                        style = MaterialTheme.typography.labelSmall,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        textAlign = TextAlign.Center,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(4.dp),
                    )
                }
            }
        }
    }
}
