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
import javax.inject.Inject

@HiltViewModel
class PhotoGalleryViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    photoRepository: PhotoRepository,
) : ViewModel() {

    private val stationId: Long? = savedStateHandle.get<Long>("stationId")
    private val drillHoleId: Long? = savedStateHandle.get<Long>("drillHoleId")

    val photos: StateFlow<List<PhotoEntity>> = when {
        stationId != null && stationId != 0L -> photoRepository.getByStation(stationId)
        drillHoleId != null && drillHoleId != 0L -> photoRepository.getByDrillHole(drillHoleId)
        else -> flowOf(emptyList())
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = emptyList(),
    )
}
