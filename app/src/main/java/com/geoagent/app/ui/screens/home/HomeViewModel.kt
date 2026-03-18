package com.geoagent.app.ui.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.repository.DrillHoleRepository
import com.geoagent.app.data.repository.PhotoRepository
import com.geoagent.app.data.repository.ProjectRepository
import com.geoagent.app.data.repository.SampleRepository
import com.geoagent.app.data.repository.StationRepository
import com.geoagent.app.data.sync.ConnectivityObserver
import com.geoagent.app.data.sync.ConnectivityStatus
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    projectRepository: ProjectRepository,
    stationRepository: StationRepository,
    drillHoleRepository: DrillHoleRepository,
    photoRepository: PhotoRepository,
    sampleRepository: SampleRepository,
    connectivityObserver: ConnectivityObserver,
) : ViewModel() {

    val projectCount: StateFlow<Int> = projectRepository.getTotalCount()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = 0,
        )

    val stationCount: StateFlow<Int> = stationRepository.getTotalCount()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = 0,
        )

    val drillHoleCount: StateFlow<Int> = drillHoleRepository.getTotalCount()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = 0,
        )

    val photoCount: StateFlow<Int> = photoRepository.getTotalCount()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = 0,
        )

    val sampleCount: StateFlow<Int> = sampleRepository.getTotalCount()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = 0,
        )

    val pendingSyncCount: StateFlow<Int> = combine(
        projectRepository.getPendingSyncCount(),
        stationRepository.getPendingSyncCount(),
        drillHoleRepository.getPendingSyncCount(),
        photoRepository.getPendingSyncCount(),
        sampleRepository.getPendingSyncCount(),
    ) { counts -> counts.sum() }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = 0,
        )

    val isConnected: StateFlow<Boolean> = connectivityObserver.connectivityStatus
        .map { it == ConnectivityStatus.Available }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = false,
        )
}
