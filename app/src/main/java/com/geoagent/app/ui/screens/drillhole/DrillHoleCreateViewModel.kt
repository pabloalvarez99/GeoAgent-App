package com.geoagent.app.ui.screens.drillhole

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.repository.DrillHoleRepository
import com.geoagent.app.util.CodeGenerator
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DrillHoleCreateViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val drillHoleRepository: DrillHoleRepository,
) : ViewModel() {

    val projectId: Long = savedStateHandle["projectId"] ?: 0L

    private val _isSaving = MutableStateFlow(false)
    val isSaving: StateFlow<Boolean> = _isSaving.asStateFlow()

    private val _suggestedHoleId = MutableStateFlow("")
    val suggestedHoleId: StateFlow<String> = _suggestedHoleId.asStateFlow()

    init {
        viewModelScope.launch {
            val existing = drillHoleRepository.getByProject(projectId).first()
            _suggestedHoleId.value = CodeGenerator.generateDrillHoleCode(existing.map { it.holeId })
        }
    }

    fun create(
        holeId: String,
        type: String,
        latitude: Double,
        longitude: Double,
        altitude: Double?,
        azimuth: Double,
        inclination: Double,
        plannedDepth: Double,
        geologist: String,
        notes: String?,
        onCreated: (Long) -> Unit,
    ) {
        if (_isSaving.value) return

        viewModelScope.launch {
            _isSaving.value = true
            try {
                val id = drillHoleRepository.create(
                    projectId = projectId,
                    holeId = holeId,
                    type = type,
                    latitude = latitude,
                    longitude = longitude,
                    altitude = altitude,
                    azimuth = azimuth,
                    inclination = inclination,
                    plannedDepth = plannedDepth,
                    geologist = geologist,
                    notes = notes,
                )
                onCreated(id)
            } finally {
                _isSaving.value = false
            }
        }
    }
}
