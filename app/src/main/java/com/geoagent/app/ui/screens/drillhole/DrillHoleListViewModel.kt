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

    private val _sortOrder = MutableStateFlow(DrillHoleSortOrder.DATE_DESC)
    val sortOrder: StateFlow<DrillHoleSortOrder> = _sortOrder.asStateFlow()

    val drillHoles: StateFlow<List<DrillHoleEntity>> = combine(
        drillHoleRepository.getByProject(projectId),
        _searchQuery,
        _sortOrder,
    ) { holes, query, sort ->
        val filtered = if (query.isBlank()) {
            holes
        } else {
            holes.filter { hole ->
                hole.holeId.contains(query, ignoreCase = true) ||
                    hole.geologist.contains(query, ignoreCase = true) ||
                    hole.type.contains(query, ignoreCase = true) ||
                    hole.status.contains(query, ignoreCase = true)
            }
        }
        when (sort) {
            DrillHoleSortOrder.DATE_DESC -> filtered.sortedByDescending { it.createdAt }
            DrillHoleSortOrder.DATE_ASC -> filtered.sortedBy { it.createdAt }
            DrillHoleSortOrder.CODE_ASC -> filtered.sortedBy { it.holeId }
            DrillHoleSortOrder.CODE_DESC -> filtered.sortedByDescending { it.holeId }
            DrillHoleSortOrder.DEPTH_DESC -> filtered.sortedByDescending { it.actualDepth ?: 0.0 }
        }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = emptyList(),
    )

    fun onSearchQueryChange(query: String) {
        _searchQuery.value = query
    }

    fun onSortOrderChange(order: DrillHoleSortOrder) {
        _sortOrder.value = order
    }
}

enum class DrillHoleSortOrder(val label: String) {
    DATE_DESC("Mas reciente"),
    DATE_ASC("Mas antiguo"),
    CODE_ASC("Codigo A-Z"),
    CODE_DESC("Codigo Z-A"),
    DEPTH_DESC("Mayor profundidad"),
}
