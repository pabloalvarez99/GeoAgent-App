package com.geoagent.app.ui.screens.photo

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.local.entity.PhotoEntity
import com.geoagent.app.data.repository.PhotoRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class PhotoGalleryViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val photoRepository: PhotoRepository,
) : ViewModel() {

    private val stationId: Long? = savedStateHandle.get<Long>("stationId")
    private val drillHoleId: Long? = savedStateHandle.get<Long>("drillHoleId")
    private val projectId: Long? = savedStateHandle.get<Long>("projectId")

    val photos: StateFlow<List<PhotoEntity>> = when {
        stationId != null && stationId != 0L -> photoRepository.getByStation(stationId)
        drillHoleId != null && drillHoleId != 0L -> photoRepository.getByDrillHole(drillHoleId)
        projectId != null && projectId != 0L -> photoRepository.getByProject(projectId)
        else -> flowOf(emptyList())
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = emptyList(),
    )

    fun delete(photo: PhotoEntity) {
        viewModelScope.launch {
            photoRepository.delete(photo)
        }
    }

    fun updateDescription(photo: PhotoEntity, description: String) {
        viewModelScope.launch {
            photoRepository.update(photo.copy(description = description.ifBlank { null }))
        }
    }
}
