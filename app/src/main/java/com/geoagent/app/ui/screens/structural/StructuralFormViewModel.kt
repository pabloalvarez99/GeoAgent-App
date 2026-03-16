package com.geoagent.app.ui.screens.structural

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.local.entity.StructuralEntity
import com.geoagent.app.data.repository.StructuralRepository
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

    fun save() {
        val state = _uiState.value
        val strikeVal = state.strike.toDoubleOrNull()
        val dipVal = state.dip.toDoubleOrNull()

        if (state.type.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Seleccione el tipo de estructura") }
            return
        }
        if (strikeVal == null || strikeVal < 0 || strikeVal > 360) {
            _uiState.update { it.copy(errorMessage = "Rumbo debe ser entre 0 y 360") }
            return
        }
        if (dipVal == null || dipVal < 0 || dipVal > 90) {
            _uiState.update { it.copy(errorMessage = "Manteo debe ser entre 0 y 90") }
            return
        }
        if (state.dipDirection.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Seleccione la direccion de manteo") }
            return
        }

        val thicknessVal = state.thickness.toDoubleOrNull()

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
        val structuralTypes = listOf(
            "Falla", "Fractura", "Veta", "Foliacion",
            "Estratificacion", "Contacto", "Diaclasa", "Clivaje",
        )

        val dipDirections = listOf("N", "NE", "E", "SE", "S", "SW", "W", "NW")

        val movements = listOf("Normal", "Inversa", "Dextral", "Sinistral")

        val roughnesses = listOf("Lisa", "Rugosa", "Escalonada", "Ondulada")

        val continuities = listOf("Continua", "Discontinua", "Intermitente")
    }
}
