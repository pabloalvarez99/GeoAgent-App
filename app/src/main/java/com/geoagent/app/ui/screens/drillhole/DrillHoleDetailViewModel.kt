package com.geoagent.app.ui.screens.drillhole

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.local.entity.DrillHoleEntity
import com.geoagent.app.data.local.entity.DrillIntervalEntity
import com.geoagent.app.data.repository.DrillHoleRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DrillHoleDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val drillHoleRepository: DrillHoleRepository,
) : ViewModel() {

    private val drillHoleId: Long = savedStateHandle["drillHoleId"] ?: 0L

    val drillHole: StateFlow<DrillHoleEntity?> = drillHoleRepository.getById(drillHoleId)
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = null,
        )

    val intervals: StateFlow<List<DrillIntervalEntity>> = drillHoleRepository.getIntervals(drillHoleId)
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = emptyList(),
        )

    fun updateStatus(status: String) {
        val current = drillHole.value ?: return
        viewModelScope.launch {
            drillHoleRepository.update(current.copy(status = status))
        }
    }
}
