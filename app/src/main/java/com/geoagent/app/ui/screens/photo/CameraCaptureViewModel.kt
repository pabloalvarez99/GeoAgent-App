package com.geoagent.app.ui.screens.photo

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.repository.PhotoRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File
import javax.inject.Inject

@HiltViewModel
class CameraCaptureViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val photoRepository: PhotoRepository,
) : ViewModel() {

    val stationId: Long? = savedStateHandle.get<Long>("stationId")
    val drillHoleId: Long? = savedStateHandle.get<Long>("drillHoleId")
    val projectId: Long? = savedStateHandle.get<Long>("projectId")

    private val _isSaving = MutableStateFlow(false)
    val isSaving: StateFlow<Boolean> = _isSaving.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    fun clearError() { _errorMessage.value = null }

    fun getPhotoDir(): File = photoRepository.getPhotoDir()

    fun savePhoto(
        file: File,
        stationId: Long?,
        drillHoleId: Long?,
        projectId: Long?,
        description: String?,
        latitude: Double?,
        longitude: Double?,
        onSaved: () -> Unit,
    ) {
        if (_isSaving.value) return

        // Verify the photo file actually exists and has content
        if (!file.exists() || file.length() == 0L) {
            _errorMessage.value = "La foto no se capturo correctamente. Intenta de nuevo."
            return
        }

        viewModelScope.launch {
            _isSaving.value = true
            try {
                photoRepository.create(
                    stationId = stationId,
                    drillHoleId = drillHoleId,
                    projectId = projectId,
                    filePath = file.absolutePath,
                    fileName = file.name,
                    description = description,
                    latitude = latitude,
                    longitude = longitude,
                )
                onSaved()
            } catch (e: Exception) {
                _errorMessage.value = "Error al guardar la foto: ${e.message}"
            } finally {
                _isSaving.value = false
            }
        }
    }
}
