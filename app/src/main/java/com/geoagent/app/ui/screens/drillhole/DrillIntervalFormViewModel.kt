package com.geoagent.app.ui.screens.drillhole

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.local.entity.DrillIntervalEntity
import com.geoagent.app.data.repository.DrillHoleRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DrillIntervalFormViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val drillHoleRepository: DrillHoleRepository,
) : ViewModel() {

    val drillHoleId: Long = savedStateHandle["drillHoleId"] ?: 0L
    private val intervalId: Long? = savedStateHandle.get<Long>("intervalId")

    val existingInterval: StateFlow<DrillIntervalEntity?> =
        if (intervalId != null && intervalId != 0L) {
            drillHoleRepository.getIntervalById(intervalId)
                .stateIn(
                    scope = viewModelScope,
                    started = SharingStarted.WhileSubscribed(5_000),
                    initialValue = null,
                )
        } else {
            MutableStateFlow(null)
        }

    val isEditing: Boolean = intervalId != null && intervalId != 0L

    private val _isSaving = MutableStateFlow(false)
    val isSaving: StateFlow<Boolean> = _isSaving.asStateFlow()

    fun save(
        fromDepth: Double,
        toDepth: Double,
        rockGroup: String,
        rockType: String,
        color: String,
        texture: String,
        grainSize: String,
        mineralogy: String,
        alteration: String?,
        alterationIntensity: String?,
        mineralization: String?,
        mineralizationPercent: Double?,
        rqd: Double?,
        recovery: Double?,
        structure: String?,
        weathering: String?,
        notes: String?,
        onSaved: () -> Unit,
    ) {
        if (_isSaving.value) return

        viewModelScope.launch {
            _isSaving.value = true
            try {
                val existing = existingInterval.value
                if (existing != null) {
                    drillHoleRepository.updateInterval(
                        existing.copy(
                            fromDepth = fromDepth,
                            toDepth = toDepth,
                            rockGroup = rockGroup,
                            rockType = rockType,
                            color = color,
                            texture = texture,
                            grainSize = grainSize,
                            mineralogy = mineralogy,
                            alteration = alteration,
                            alterationIntensity = alterationIntensity,
                            mineralization = mineralization,
                            mineralizationPercent = mineralizationPercent,
                            rqd = rqd,
                            recovery = recovery,
                            structure = structure,
                            weathering = weathering,
                            notes = notes,
                        )
                    )
                } else {
                    drillHoleRepository.createInterval(
                        drillHoleId = drillHoleId,
                        fromDepth = fromDepth,
                        toDepth = toDepth,
                        rockGroup = rockGroup,
                        rockType = rockType,
                        color = color,
                        texture = texture,
                        grainSize = grainSize,
                        mineralogy = mineralogy,
                        alteration = alteration,
                        alterationIntensity = alterationIntensity,
                        mineralization = mineralization,
                        mineralizationPercent = mineralizationPercent,
                        rqd = rqd,
                        recovery = recovery,
                        structure = structure,
                        weathering = weathering,
                        notes = notes,
                    )
                }
                onSaved()
            } finally {
                _isSaving.value = false
            }
        }
    }
}
