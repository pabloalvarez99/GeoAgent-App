package com.geoagent.app.ui.screens.drillhole

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.local.entity.DrillIntervalEntity
import com.geoagent.app.data.repository.DrillHoleRepository
import com.geoagent.app.util.FormValidation
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

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    fun clearError() {
        _errorMessage.value = null
    }

    fun save(
        fromDepth: Double?,
        toDepth: Double?,
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

        if (fromDepth == null) {
            _errorMessage.value = "Ingrese la profundidad inicial (Desde)"
            return
        }
        if (toDepth == null) {
            _errorMessage.value = "Ingrese la profundidad final (Hasta)"
            return
        }

        val validationError = FormValidation.validateDepthOrder(fromDepth, toDepth)
            ?: FormValidation.validateRequired(rockGroup, "Grupo de roca")
            ?: FormValidation.validateRequired(rockType, "Tipo de roca")
            ?: FormValidation.validateRequired(color, "Color")
            ?: FormValidation.validateRequired(texture, "Textura")
            ?: FormValidation.validateRequired(grainSize, "Tamano de grano")
            ?: FormValidation.validateRequired(mineralogy, "Mineralogia")
            ?: FormValidation.validatePercentage(rqd, "RQD")
            ?: FormValidation.validatePercentage(recovery, "Recuperacion")
            ?: FormValidation.validatePercentage(mineralizationPercent, "Mineralizacion %")

        if (validationError != null) {
            _errorMessage.value = validationError
            return
        }

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
                        fromDepth = fromDepth!!,
                        toDepth = toDepth!!,
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
            } catch (e: Exception) {
                _errorMessage.value = "Error al guardar: ${e.message}"
            } finally {
                _isSaving.value = false
            }
        }
    }
}
