package com.geoagent.app.ui.screens.lithology

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.GeoConstants
import com.geoagent.app.data.local.entity.LithologyEntity
import com.geoagent.app.data.repository.LithologyRepository
import com.geoagent.app.util.FormValidation
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LithologyFormUiState(
    val isEditing: Boolean = false,
    val isSaving: Boolean = false,
    val isSaved: Boolean = false,
    val existingEntity: LithologyEntity? = null,
    val rockGroup: String = "",
    val rockType: String = "",
    val color: String = "",
    val texture: String = "",
    val grainSize: String = "",
    val mineralogy: String = "",
    val alteration: String = "",
    val alterationIntensity: String = "",
    val mineralization: String = "",
    val mineralizationPercent: String = "",
    val structure: String = "",
    val weathering: String = "",
    val notes: String = "",
    val errorMessage: String? = null,
)

@HiltViewModel
class LithologyFormViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val lithologyRepository: LithologyRepository,
) : ViewModel() {

    private val stationId: Long = savedStateHandle["stationId"] ?: 0L
    private val lithologyId: Long? = savedStateHandle.get<Long>("lithologyId")

    private val _uiState = MutableStateFlow(LithologyFormUiState())
    val uiState: StateFlow<LithologyFormUiState> = _uiState.asStateFlow()

    init {
        if (lithologyId != null && lithologyId != 0L) {
            loadExisting(lithologyId)
        }
    }

    private fun loadExisting(id: Long) {
        viewModelScope.launch {
            lithologyRepository.getById(id).collect { entity ->
                if (entity != null) {
                    _uiState.update {
                        it.copy(
                            isEditing = true,
                            existingEntity = entity,
                            rockGroup = entity.rockGroup,
                            rockType = entity.rockType,
                            color = entity.color,
                            texture = entity.texture,
                            grainSize = entity.grainSize,
                            mineralogy = entity.mineralogy,
                            alteration = entity.alteration ?: "",
                            alterationIntensity = entity.alterationIntensity ?: "",
                            mineralization = entity.mineralization ?: "",
                            mineralizationPercent = entity.mineralizationPercent?.toString() ?: "",
                            structure = entity.structure ?: "",
                            weathering = entity.weathering ?: "",
                            notes = entity.notes ?: "",
                        )
                    }
                }
            }
        }
    }

    fun onRockGroupChanged(value: String) {
        _uiState.update { it.copy(rockGroup = value, rockType = "") }
    }

    fun onRockTypeChanged(value: String) {
        _uiState.update { it.copy(rockType = value) }
    }

    fun onColorChanged(value: String) {
        _uiState.update { it.copy(color = value) }
    }

    fun onTextureChanged(value: String) {
        _uiState.update { it.copy(texture = value) }
    }

    fun onGrainSizeChanged(value: String) {
        _uiState.update { it.copy(grainSize = value) }
    }

    fun onMineralogyChanged(value: String) {
        _uiState.update { it.copy(mineralogy = value) }
    }

    fun onAlterationChanged(value: String) {
        _uiState.update {
            it.copy(
                alteration = value,
                alterationIntensity = if (value.isEmpty() || value == "Ninguna") "" else it.alterationIntensity,
            )
        }
    }

    fun onAlterationIntensityChanged(value: String) {
        _uiState.update { it.copy(alterationIntensity = value) }
    }

    fun onMineralizationChanged(value: String) {
        _uiState.update { it.copy(mineralization = value) }
    }

    fun onMineralizationPercentChanged(value: String) {
        _uiState.update { it.copy(mineralizationPercent = value) }
    }

    fun onStructureChanged(value: String) {
        _uiState.update { it.copy(structure = value) }
    }

    fun onWeatheringChanged(value: String) {
        _uiState.update { it.copy(weathering = value) }
    }

    fun onNotesChanged(value: String) {
        _uiState.update { it.copy(notes = value) }
    }

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    fun save() {
        val state = _uiState.value
        if (state.isSaving) return

        val validationError = FormValidation.validateRequired(state.rockGroup, "Grupo de roca")
            ?: FormValidation.validateRequired(state.rockType, "Tipo de roca")
            ?: FormValidation.validateRequired(state.color, "Color")
            ?: FormValidation.validateRequired(state.texture, "Textura")
            ?: FormValidation.validateRequired(state.grainSize, "Tamano de grano")

        if (validationError != null) {
            _uiState.update { it.copy(errorMessage = validationError) }
            return
        }

        val minPercent = FormValidation.parseDouble(state.mineralizationPercent)
        val percentError = FormValidation.validatePercentage(minPercent, "Mineralizacion %")
        if (percentError != null) {
            _uiState.update { it.copy(errorMessage = percentError) }
            return
        }

        _uiState.update { it.copy(isSaving = true, errorMessage = null) }

        viewModelScope.launch {
            try {
                if (state.isEditing && state.existingEntity != null) {
                    lithologyRepository.update(
                        state.existingEntity.copy(
                            rockGroup = state.rockGroup,
                            rockType = state.rockType,
                            color = state.color,
                            texture = state.texture,
                            grainSize = state.grainSize,
                            mineralogy = state.mineralogy,
                            alteration = state.alteration.ifBlank { null },
                            alterationIntensity = state.alterationIntensity.ifBlank { null },
                            mineralization = state.mineralization.ifBlank { null },
                            mineralizationPercent = minPercent,
                            structure = state.structure.ifBlank { null },
                            weathering = state.weathering.ifBlank { null },
                            notes = state.notes.ifBlank { null },
                        )
                    )
                } else {
                    lithologyRepository.create(
                        stationId = stationId,
                        rockType = state.rockType,
                        rockGroup = state.rockGroup,
                        color = state.color,
                        texture = state.texture,
                        grainSize = state.grainSize,
                        mineralogy = state.mineralogy,
                        alteration = state.alteration.ifBlank { null },
                        alterationIntensity = state.alterationIntensity.ifBlank { null },
                        mineralization = state.mineralization.ifBlank { null },
                        mineralizationPercent = minPercent,
                        structure = state.structure.ifBlank { null },
                        weathering = state.weathering.ifBlank { null },
                        notes = state.notes.ifBlank { null },
                    )
                }
                _uiState.update { it.copy(isSaving = false, isSaved = true) }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(isSaving = false, errorMessage = "Error al guardar: ${e.message}")
                }
            }
        }
    }

    companion object {
        val rockGroups = GeoConstants.rockGroups
        val rockTypesByGroup = GeoConstants.rockTypesByGroup
        val colors = GeoConstants.colors
        val textures = GeoConstants.textures
        val grainSizes = GeoConstants.grainSizes
        val alterations = GeoConstants.alterations
        val alterationIntensities = GeoConstants.alterationIntensities
        val structures = GeoConstants.structures
        val weatherings = GeoConstants.weatheringGrades
    }
}
