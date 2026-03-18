package com.geoagent.app.ui.screens.station

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.local.entity.StationEntity
import com.geoagent.app.data.repository.StationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

@HiltViewModel
class StationListViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    stationRepository: StationRepository,
) : ViewModel() {

    private val projectId: Long = checkNotNull(savedStateHandle["projectId"])

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _sortOrder = MutableStateFlow(SortOrder.DATE_DESC)
    val sortOrder: StateFlow<SortOrder> = _sortOrder.asStateFlow()

    val stations: StateFlow<List<StationEntity>> = combine(
        stationRepository.getByProject(projectId),
        _searchQuery,
        _sortOrder,
    ) { stations, query, sort ->
        val filtered = if (query.isBlank()) {
            stations
        } else {
            stations.filter { station ->
                station.code.contains(query, ignoreCase = true) ||
                    station.geologist.contains(query, ignoreCase = true) ||
                    station.description.contains(query, ignoreCase = true)
            }
        }
        when (sort) {
            SortOrder.DATE_DESC -> filtered.sortedByDescending { it.date }
            SortOrder.DATE_ASC -> filtered.sortedBy { it.date }
            SortOrder.CODE_ASC -> filtered.sortedBy { it.code }
            SortOrder.CODE_DESC -> filtered.sortedByDescending { it.code }
        }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = emptyList(),
    )

    fun onSearchQueryChange(query: String) {
        _searchQuery.value = query
    }

    fun onSortOrderChange(order: SortOrder) {
        _sortOrder.value = order
    }
}

enum class SortOrder(val label: String) {
    DATE_DESC("Mas reciente"),
    DATE_ASC("Mas antiguo"),
    CODE_ASC("Codigo A-Z"),
    CODE_DESC("Codigo Z-A"),
}
