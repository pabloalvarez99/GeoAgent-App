package com.geoagent.app.ui.screens.station

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.local.entity.StationEntity
import com.geoagent.app.data.repository.StationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

@HiltViewModel
class StationListViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    stationRepository: StationRepository,
) : ViewModel() {

    private val projectId: Long = checkNotNull(savedStateHandle["projectId"])

    val stations: StateFlow<List<StationEntity>> = stationRepository.getByProject(projectId)
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = emptyList(),
        )
}
