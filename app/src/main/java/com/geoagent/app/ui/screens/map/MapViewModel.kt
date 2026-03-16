package com.geoagent.app.ui.screens.map

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.local.entity.DrillHoleEntity
import com.geoagent.app.data.local.entity.StationEntity
import com.geoagent.app.data.repository.DrillHoleRepository
import com.geoagent.app.data.repository.StationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

@HiltViewModel
class MapViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    stationRepository: StationRepository,
    drillHoleRepository: DrillHoleRepository,
) : ViewModel() {

    private val projectId: Long = savedStateHandle["projectId"] ?: 0L

    val stations: StateFlow<List<StationEntity>> = stationRepository.getByProject(projectId)
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = emptyList(),
        )

    val drillHoles: StateFlow<List<DrillHoleEntity>> = drillHoleRepository.getByProject(projectId)
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = emptyList(),
        )
}
