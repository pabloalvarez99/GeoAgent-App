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
import com.geoagent.app.util.PreferencesHelper
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class StationDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val stationRepository: StationRepository,
    private val lithologyRepository: LithologyRepository,
    private val structuralRepository: StructuralRepository,
    private val sampleRepository: SampleRepository,
    photoRepository: PhotoRepository,
    private val preferencesHelper: PreferencesHelper,
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

    fun deleteStation(onDeleted: () -> Unit) {
        val current = station.value ?: return
        viewModelScope.launch {
            stationRepository.delete(current)
            onDeleted()
        }
    }

    fun deleteLithology(lithology: LithologyEntity) {
        viewModelScope.launch { lithologyRepository.delete(lithology) }
    }

    fun deleteStructural(structural: StructuralEntity) {
        viewModelScope.launch { structuralRepository.delete(structural) }
    }

    fun deleteSample(sample: SampleEntity) {
        viewModelScope.launch { sampleRepository.delete(sample) }
    }

    fun formatCoordinate(lat: Double, lng: Double): String =
        preferencesHelper.formatCoordinate(lat, lng)
}
