package com.geoagent.app.ui.screens.photo

import android.net.Uri
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

    private val _isSaving = MutableStateFlow(false)
    val isSaving: StateFlow<Boolean> = _isSaving.asStateFlow()

    fun getPhotoDir(): File = photoRepository.getPhotoDir()

    fun savePhoto(
        uri: Uri,
        stationId: Long?,
        drillHoleId: Long?,
        description: String?,
        latitude: Double?,
        longitude: Double?,
        onSaved: () -> Unit,
    ) {
        if (_isSaving.value) return

        viewModelScope.launch {
            _isSaving.value = true
            try {
                val fileName = "photo_${System.currentTimeMillis()}.jpg"
                val filePath = File(photoRepository.getPhotoDir(), fileName).absolutePath

                photoRepository.create(
                    stationId = stationId,
                    drillHoleId = drillHoleId,
                    filePath = filePath,
                    fileName = fileName,
                    description = description,
                    latitude = latitude,
                    longitude = longitude,
                )
                onSaved()
            } finally {
                _isSaving.value = false
            }
        }
    }
}
