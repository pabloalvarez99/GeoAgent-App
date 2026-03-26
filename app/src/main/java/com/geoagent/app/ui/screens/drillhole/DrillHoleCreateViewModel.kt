package com.geoagent.app.ui.screens.drillhole

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.repository.DrillHoleRepository
import com.geoagent.app.util.CodeGenerator
import com.geoagent.app.util.FormValidation
import com.geoagent.app.util.PreferencesHelper
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
    private val preferencesHelper: PreferencesHelper,
) : ViewModel() {

    val projectId: Long = savedStateHandle["projectId"] ?: 0L
    private val editDrillHoleId: Long? = savedStateHandle.get<Long>("drillHoleId")

    val isEditing: Boolean = editDrillHoleId != null && editDrillHoleId != 0L

    private val _isSaving = MutableStateFlow(false)
    val isSaving: StateFlow<Boolean> = _isSaving.asStateFlow()

    private val _suggestedHoleId = MutableStateFlow("")
    val suggestedHoleId: StateFlow<String> = _suggestedHoleId.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    // Fields for edit mode pre-fill
    private val _editHoleId = MutableStateFlow("")
    val editHoleId: StateFlow<String> = _editHoleId.asStateFlow()

    private val _editType = MutableStateFlow("Diamantina")
    val editType: StateFlow<String> = _editType.asStateFlow()

    private val _editLatitude = MutableStateFlow("")
    val editLatitude: StateFlow<String> = _editLatitude.asStateFlow()

    private val _editLongitude = MutableStateFlow("")
    val editLongitude: StateFlow<String> = _editLongitude.asStateFlow()

    private val _editAltitude = MutableStateFlow("")
    val editAltitude: StateFlow<String> = _editAltitude.asStateFlow()

    private val _editAzimuth = MutableStateFlow("")
    val editAzimuth: StateFlow<String> = _editAzimuth.asStateFlow()

    private val _editInclination = MutableStateFlow("")
    val editInclination: StateFlow<String> = _editInclination.asStateFlow()

    private val _editPlannedDepth = MutableStateFlow("")
    val editPlannedDepth: StateFlow<String> = _editPlannedDepth.asStateFlow()

    private val _editGeologist = MutableStateFlow("")
    val editGeologist: StateFlow<String> = _editGeologist.asStateFlow()

    private val _editNotes = MutableStateFlow("")
    val editNotes: StateFlow<String> = _editNotes.asStateFlow()

    val savedGeologist: String get() = preferencesHelper.lastGeologistName

    init {
        if (isEditing) {
            loadExistingDrillHole()
        } else {
            _editGeologist.value = preferencesHelper.lastGeologistName
            viewModelScope.launch {
                val existing = drillHoleRepository.getByProject(projectId).first()
                _suggestedHoleId.value = CodeGenerator.generateDrillHoleCode(existing.map { it.holeId })
            }
        }
    }

    private fun loadExistingDrillHole() {
        viewModelScope.launch {
            val drillHole = drillHoleRepository.getById(editDrillHoleId!!).first() ?: return@launch
            _editHoleId.value = drillHole.holeId
            _editType.value = drillHole.type
            _editLatitude.value = "%.6f".format(drillHole.latitude)
            _editLongitude.value = "%.6f".format(drillHole.longitude)
            _editAltitude.value = drillHole.altitude?.let { "%.1f".format(it) } ?: ""
            _editAzimuth.value = "%.1f".format(drillHole.azimuth)
            _editInclination.value = "%.1f".format(drillHole.inclination)
            _editPlannedDepth.value = "%.1f".format(drillHole.plannedDepth)
            _editGeologist.value = drillHole.geologist
            _editNotes.value = drillHole.notes ?: ""
        }
    }

    fun clearError() {
        _errorMessage.value = null
    }

    fun create(
        holeId: String,
        type: String,
        latitude: Double?,
        longitude: Double?,
        altitude: Double?,
        azimuth: Double?,
        inclination: Double?,
        plannedDepth: Double?,
        geologist: String,
        notes: String?,
        onCreated: (Long) -> Unit,
    ) {
        if (_isSaving.value) return

        // Validate required fields
        val validationError = FormValidation.validateRequired(holeId, "ID del sondaje")
            ?: FormValidation.validateRequired(geologist, "Geologo")

        if (validationError != null) {
            _errorMessage.value = validationError
            return
        }

        if (latitude == null) {
            _errorMessage.value = "Ingrese la latitud"
            return
        }
        if (longitude == null) {
            _errorMessage.value = "Ingrese la longitud"
            return
        }
        if (azimuth == null) {
            _errorMessage.value = "Ingrese el azimut"
            return
        }
        if (inclination == null) {
            _errorMessage.value = "Ingrese la inclinacion"
            return
        }
        if (plannedDepth == null) {
            _errorMessage.value = "Ingrese la profundidad planificada"
            return
        }

        val rangeError = FormValidation.validateCoordinatesCaptured(latitude, longitude)
            ?: FormValidation.validateLatitude(latitude)
            ?: FormValidation.validateLongitude(longitude)
            ?: FormValidation.validateAzimuth(azimuth)
            ?: FormValidation.validateInclination(inclination)
            ?: FormValidation.validatePositive(plannedDepth, "Profundidad planificada")

        if (rangeError != null) {
            _errorMessage.value = rangeError
            return
        }

        viewModelScope.launch {
            _isSaving.value = true
            _errorMessage.value = null
            try {
                preferencesHelper.lastGeologistName = geologist.trim()

                if (isEditing) {
                    val existing = drillHoleRepository.getById(editDrillHoleId!!).first()!!
                    drillHoleRepository.update(
                        existing.copy(
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
                    )
                    onCreated(editDrillHoleId)
                } else {
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
                }
            } catch (e: Exception) {
                _errorMessage.value = "Error al guardar: ${e.message}"
            } finally {
                _isSaving.value = false
            }
        }
    }
}
