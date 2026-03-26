package com.geoagent.app.ui.screens.map

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.local.entity.DrillHoleEntity
import com.geoagent.app.data.local.entity.StationEntity
import com.geoagent.app.data.repository.DrillHoleRepository
import com.geoagent.app.data.repository.StationRepository
import com.geoagent.app.util.PreferencesHelper
import com.google.android.gms.maps.model.MapStyleOptions
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

enum class GeoMapType(val label: String) {
    NORMAL("Normal"),
    SATELLITE("Satelite"),
    TERRAIN("Relieve"),
    HYBRID("Hibrido"),
}

@HiltViewModel
class MapViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    stationRepository: StationRepository,
    drillHoleRepository: DrillHoleRepository,
    private val preferencesHelper: PreferencesHelper,
) : ViewModel() {

    private val projectId: Long = savedStateHandle["projectId"] ?: 0L

    val stations: StateFlow<List<StationEntity>> = (
        if (projectId == 0L) stationRepository.getAll()
        else stationRepository.getByProject(projectId)
    ).stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = emptyList(),
    )

    val drillHoles: StateFlow<List<DrillHoleEntity>> = (
        if (projectId == 0L) drillHoleRepository.getAll()
        else drillHoleRepository.getByProject(projectId)
    ).stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = emptyList(),
    )

    /** Geographic centroid of all project points, used for initial map camera. */
    val centerPoint: StateFlow<Pair<Double, Double>?> =
        combine(stations, drillHoles) { stList, dhList ->
            // Exclude default 0.0,0.0 coordinates (stations saved before GPS validation was enforced)
            val validStations = stList.filter { it.latitude != 0.0 || it.longitude != 0.0 }
            val validDrillHoles = dhList.filter { it.latitude != 0.0 || it.longitude != 0.0 }
            val lats = validStations.map { it.latitude } + validDrillHoles.map { it.latitude }
            val lngs = validStations.map { it.longitude } + validDrillHoles.map { it.longitude }
            if (lats.isEmpty()) null else (lats.average() to lngs.average())
        }.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = null,
        )

    private val _mapType = MutableStateFlow(GeoMapType.HYBRID)
    val mapType: StateFlow<GeoMapType> = _mapType.asStateFlow()

    fun setMapType(type: GeoMapType) {
        _mapType.value = type
    }

    fun formatCoordinate(lat: Double, lng: Double): String =
        preferencesHelper.formatCoordinate(lat, lng)
}
