package com.geoagent.app.ui.screens.station

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.local.entity.LithologyEntity
import com.geoagent.app.data.local.entity.SampleEntity
import com.geoagent.app.data.local.entity.StationEntity
import com.geoagent.app.data.local.entity.StructuralEntity
import com.geoagent.app.data.repository.LithologyRepository
import com.geoagent.app.data.repository.PhotoRepository
import com.geoagent.app.data.repository.SampleRepository
import com.geoagent.app.data.repository.StationRepository
import com.geoagent.app.data.repository.StructuralRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

@HiltViewModel
class StationDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    stationRepository: StationRepository,
    lithologyRepository: LithologyRepository,
    structuralRepository: StructuralRepository,
    sampleRepository: SampleRepository,
    photoRepository: PhotoRepository,
) : ViewModel() {

    private val stationId: Long = checkNotNull(savedStateHandle["stationId"])

    val station: StateFlow<StationEntity?> = stationRepository.getById(stationId)
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = null,
        )

    val lithologies: StateFlow<List<LithologyEntity>> = lithologyRepository.getByStation(stationId)
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = emptyList(),
        )

    val structuralData: StateFlow<List<StructuralEntity>> = structuralRepository.getByStation(stationId)
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = emptyList(),
        )

    val samples: StateFlow<List<SampleEntity>> = sampleRepository.getByStation(stationId)
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = emptyList(),
        )

    val photoCount: StateFlow<Int> = photoRepository.getCountByStation(stationId)
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = 0,
        )
}
