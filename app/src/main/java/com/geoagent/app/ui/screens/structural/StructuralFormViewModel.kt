package com.geoagent.app.ui.screens.structural

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.GeoConstants
import com.geoagent.app.data.local.entity.StructuralEntity
import com.geoagent.app.data.repository.StructuralRepository
import com.geoagent.app.util.FormValidation
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class StructuralFormUiState(
    val isEditing: Boolean = false,
    val isSaving: Boolean = false,
    val isSaved: Boolean = false,
    val existingEntity: StructuralEntity? = null,
    val type: String = "",
    val strike: String = "",
    val dip: String = "",
    val dipDirection: String = "",
    val movement: String = "",
    val thickness: String = "",
    val filling: String = "",
    val roughness: String = "",
    val continuity: String = "",
    val notes: String = "",
    val errorMessage: String? = null,
)

@HiltViewModel
class StructuralFormViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val structuralRepository: StructuralRepository,
) : ViewModel() {

    private val stationId: Long = savedStateHandle["stationId"] ?: 0L
    private val structuralId: Long? = savedStateHandle.get<Long>("structuralId")

    private val _uiState = MutableStateFlow(StructuralFormUiState())
    val uiState: StateFlow<StructuralFormUiState> = _uiState.asStateFlow()

    init {
        if (structuralId != null && structuralId != 0L) {
            loadExisting(structuralId)
        }
    }

    private fun loadExisting(id: Long) {
        viewModelScope.launch {
            structuralRepository.getById(id).collect { entity ->
                if (entity != null) {
                    _uiState.update {
                        it.copy(
                            isEditing = true,
                            existingEntity = entity,
                            type = entity.type,
                            strike = entity.strike.toString(),
                            dip = entity.dip.toString(),
                            dipDirection = entity.dipDirection,
                            movement = entity.movement ?: "",
                            thickness = entity.thickness?.toString() ?: "",
                            filling = entity.filling ?: "",
                            roughness = entity.roughness ?: "",
                            continuity = entity.continuity ?: "",
                            notes = entity.notes ?: "",
                        )
                    }
                }
            }
        }
    }

    fun onTypeChanged(value: String) {
        _uiState.update {
            it.copy(
                type = value,
                movement = if (value != "Falla") "" else it.movement,
                thickness = if (value != "Veta") "" else it.thickness,
            )
        }
    }

    fun onStrikeChanged(value: String) {
        _uiState.update { it.copy(strike = value) }
    }

    fun onDipChanged(value: String) {
        _uiState.update { it.copy(dip = value) }
    }

    fun onDipDirectionChanged(value: String) {
        _uiState.update { it.copy(dipDirection = value) }
    }

    fun onMovementChanged(value: String) {
        _uiState.update { it.copy(movement = value) }
    }

    fun onThicknessChanged(value: String) {
        _uiState.update { it.copy(thickness = value) }
    }

    fun onFillingChanged(value: String) {
        _uiState.update { it.copy(filling = value) }
    }

    fun onRoughnessChanged(value: String) {
        _uiState.update { it.copy(roughness = value) }
    }

    fun onContinuityChanged(value: String) {
        _uiState.update { it.copy(continuity = value) }
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
        val strikeVal = FormValidation.parseDouble(state.strike)
        val dipVal = FormValidation.parseDouble(state.dip)

        val validationError = FormValidation.validateRequired(state.type, "Tipo de estructura")
            ?: FormValidation.validateStrike(strikeVal)
            ?: FormValidation.validateDip(dipVal)
            ?: FormValidation.validateRequired(state.dipDirection, "Direccion de manteo")
            ?: FormValidation.validatePositive(FormValidation.parseDouble(state.thickness), "Espesor")

        if (strikeVal == null) {
            _uiState.update { it.copy(errorMessage = "Ingrese el rumbo") }
            return
        }
        if (dipVal == null) {
            _uiState.update { it.copy(errorMessage = "Ingrese el manteo") }
            return
        }
        if (validationError != null) {
            _uiState.update { it.copy(errorMessage = validationError) }
            return
        }

        val thicknessVal = FormValidation.parseDouble(state.thickness)

        _uiState.update { it.copy(isSaving = true, errorMessage = null) }

        viewModelScope.launch {
            try {
                if (state.isEditing && state.existingEntity != null) {
                    structuralRepository.update(
                        state.existingEntity.copy(
                            type = state.type,
                            strike = strikeVal,
                            dip = dipVal,
                            dipDirection = state.dipDirection,
                            movement = state.movement.ifBlank { null },
                            thickness = thicknessVal,
                            filling = state.filling.ifBlank { null },
                            roughness = state.roughness.ifBlank { null },
                            continuity = state.continuity.ifBlank { null },
                            notes = state.notes.ifBlank { null },
                        )
                    )
                } else {
                    structuralRepository.create(
                        stationId = stationId,
                        type = state.type,
                        strike = strikeVal,
                        dip = dipVal,
                        dipDirection = state.dipDirection,
                        movement = state.movement.ifBlank { null },
                        thickness = thicknessVal,
                        filling = state.filling.ifBlank { null },
                        roughness = state.roughness.ifBlank { null },
                        continuity = state.continuity.ifBlank { null },
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
        val structuralTypes = GeoConstants.structuralTypes
        val dipDirections = GeoConstants.dipDirections
        val movements = GeoConstants.faultMovements
        val roughnesses = GeoConstants.roughness
        val continuities = GeoConstants.continuity
    }
}
