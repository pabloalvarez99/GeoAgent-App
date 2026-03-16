package com.geoagent.app.ui.screens.lithology

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.local.entity.LithologyEntity
import com.geoagent.app.data.repository.LithologyRepository
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

    fun save() {
        val state = _uiState.value

        if (state.rockGroup.isBlank() || state.rockType.isBlank() ||
            state.color.isBlank() || state.texture.isBlank() ||
            state.grainSize.isBlank()
        ) {
            _uiState.update { it.copy(errorMessage = "Complete los campos obligatorios") }
            return
        }

        val minPercent = state.mineralizationPercent.toDoubleOrNull()

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
        val rockGroups = listOf("Ignea", "Sedimentaria", "Metamorfica")

        val rockTypesByGroup = mapOf(
            "Ignea" to listOf("Andesita", "Basalto", "Granito", "Diorita", "Riolita", "Dacita", "Gabro"),
            "Sedimentaria" to listOf("Arenisca", "Lutita", "Caliza", "Conglomerado", "Limolita"),
            "Metamorfica" to listOf("Esquisto", "Gneis", "Marmol", "Pizarra", "Cuarcita"),
        )

        val colors = listOf(
            "Blanco", "Gris Claro", "Gris Oscuro", "Negro",
            "Rojo", "Rosado", "Verde", "Cafe", "Amarillo",
        )

        val textures = listOf(
            "Faneritica", "Afanitica", "Porfirica", "Vitrea", "Clastica", "Foliada",
        )

        val grainSizes = listOf("Fina", "Media", "Gruesa", "Muy Gruesa")

        val alterations = listOf(
            "Ninguna", "Filica", "Argilica", "Propilitica",
            "Potasica", "Silicica", "Clorita-Epidota",
        )

        val alterationIntensities = listOf("Debil", "Moderada", "Fuerte", "Intensa")

        val structures = listOf(
            "Masiva", "Foliada", "Bandeada", "Brechada", "Vesicular", "Fluidal",
        )

        val weatherings = listOf("Fresca", "Leve", "Moderada", "Alta", "Muy Alta")
    }
}
