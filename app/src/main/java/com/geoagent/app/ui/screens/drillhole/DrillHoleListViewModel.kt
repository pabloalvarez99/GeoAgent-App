package com.geoagent.app.ui.screens.drillhole

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.local.entity.DrillHoleEntity
import com.geoagent.app.data.repository.DrillHoleRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

@HiltViewModel
class DrillHoleListViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    drillHoleRepository: DrillHoleRepository,
) : ViewModel() {

    private val projectId: Long = savedStateHandle["projectId"] ?: 0L

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    val drillHoles: StateFlow<List<DrillHoleEntity>> = combine(
        drillHoleRepository.getByProject(projectId),
        _searchQuery,
    ) { holes, query ->
        if (query.isBlank()) {
            holes
        } else {
            holes.filter { hole ->
                hole.holeId.contains(query, ignoreCase = true) ||
                    hole.geologist.contains(query, ignoreCase = true) ||
                    hole.type.contains(query, ignoreCase = true) ||
                    hole.status.contains(query, ignoreCase = true)
            }
        }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = emptyList(),
    )

    fun onSearchQueryChange(query: String) {
        _searchQuery.value = query
    }
}
