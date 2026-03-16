package com.geoagent.app.ui.screens.drillhole

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.local.entity.DrillHoleEntity
import com.geoagent.app.data.repository.DrillHoleRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

@HiltViewModel
class DrillHoleListViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    drillHoleRepository: DrillHoleRepository,
) : ViewModel() {

    private val projectId: Long = savedStateHandle["projectId"] ?: 0L

    val drillHoles: StateFlow<List<DrillHoleEntity>> = drillHoleRepository.getByProject(projectId)
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = emptyList(),
        )
}
