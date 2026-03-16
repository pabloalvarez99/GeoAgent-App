package com.geoagent.app.ui.screens.sample

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.local.entity.SampleEntity
import com.geoagent.app.data.repository.SampleRepository
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SampleFormUiState(
    val isEditing: Boolean = false,
    val isSaving: Boolean = false,
    val isSaved: Boolean = false,
    val existingEntity: SampleEntity? = null,
    val code: String = "",
    val type: String = "",
    val weight: String = "",
    val length: String = "",
    val description: String = "",
    val latitude: String = "",
    val longitude: String = "",
    val altitude: String = "",
    val isCapturingGps: Boolean = false,
    val destination: String = "",
    val analysisRequested: String = "",
    val notes: String = "",
    val errorMessage: String? = null,
)

@HiltViewModel
class SampleFormViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val sampleRepository: SampleRepository,
    @ApplicationContext private val context: Context,
) : ViewModel() {

    private val stationId: Long = savedStateHandle["stationId"] ?: 0L
    private val sampleId: Long? = savedStateHandle.get<Long>("sampleId")

    private val _uiState = MutableStateFlow(SampleFormUiState())
    val uiState: StateFlow<SampleFormUiState> = _uiState.asStateFlow()

    init {
        if (sampleId != null && sampleId != 0L) {
            loadExisting(sampleId)
        } else {
            captureGps()
        }
    }

    private fun loadExisting(id: Long) {
        viewModelScope.launch {
            sampleRepository.getById(id).collect { entity ->
                if (entity != null) {
                    _uiState.update {
                        it.copy(
                            isEditing = true,
                            existingEntity = entity,
                            code = entity.code,
                            type = entity.type,
                            weight = entity.weight?.toString() ?: "",
                            length = entity.length?.toString() ?: "",
                            description = entity.description,
                            latitude = entity.latitude?.toString() ?: "",
                            longitude = entity.longitude?.toString() ?: "",
                            altitude = entity.altitude?.toString() ?: "",
                            destination = entity.destination ?: "",
                            analysisRequested = entity.analysisRequested ?: "",
                            notes = entity.notes ?: "",
                        )
                    }
                }
            }
        }
    }

    fun onCodeChanged(value: String) {
        _uiState.update { it.copy(code = value) }
    }

    fun onTypeChanged(value: String) {
        _uiState.update { it.copy(type = value) }
    }

    fun onWeightChanged(value: String) {
        _uiState.update { it.copy(weight = value) }
    }

    fun onLengthChanged(value: String) {
        _uiState.update { it.copy(length = value) }
    }

    fun onDescriptionChanged(value: String) {
        _uiState.update { it.copy(description = value) }
    }

    fun onDestinationChanged(value: String) {
        _uiState.update { it.copy(destination = value) }
    }

    fun onAnalysisRequestedChanged(value: String) {
        _uiState.update { it.copy(analysisRequested = value) }
    }

    fun onNotesChanged(value: String) {
        _uiState.update { it.copy(notes = value) }
    }

    @SuppressLint("MissingPermission")
    fun captureGps() {
        _uiState.update { it.copy(isCapturingGps = true) }
        val fusedClient = LocationServices.getFusedLocationProviderClient(context)
        val cancellationToken = CancellationTokenSource()

        fusedClient.getCurrentLocation(
            Priority.PRIORITY_HIGH_ACCURACY,
            cancellationToken.token,
        ).addOnSuccessListener { location: Location? ->
            if (location != null) {
                _uiState.update {
                    it.copy(
                        latitude = String.format("%.6f", location.latitude),
                        longitude = String.format("%.6f", location.longitude),
                        altitude = String.format("%.1f", location.altitude),
                        isCapturingGps = false,
                    )
                }
            } else {
                _uiState.update { it.copy(isCapturingGps = false) }
            }
        }.addOnFailureListener {
            _uiState.update { it.copy(isCapturingGps = false) }
        }
    }

    fun save() {
        val state = _uiState.value

        if (state.code.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Ingrese el codigo de la muestra") }
            return
        }
        if (state.type.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Seleccione el tipo de muestra") }
            return
        }
        if (state.description.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Ingrese una descripcion") }
            return
        }

        val weightVal = state.weight.toDoubleOrNull()
        val lengthVal = state.length.toDoubleOrNull()
        val latVal = state.latitude.toDoubleOrNull()
        val lonVal = state.longitude.toDoubleOrNull()
        val altVal = state.altitude.toDoubleOrNull()

        _uiState.update { it.copy(isSaving = true, errorMessage = null) }

        viewModelScope.launch {
            try {
                if (state.isEditing && state.existingEntity != null) {
                    sampleRepository.update(
                        state.existingEntity.copy(
                            code = state.code,
                            type = state.type,
                            weight = weightVal,
                            length = lengthVal,
                            description = state.description,
                            latitude = latVal,
                            longitude = lonVal,
                            altitude = altVal,
                            destination = state.destination.ifBlank { null },
                            analysisRequested = state.analysisRequested.ifBlank { null },
                            notes = state.notes.ifBlank { null },
                        )
                    )
                } else {
                    sampleRepository.create(
                        stationId = stationId,
                        code = state.code,
                        type = state.type,
                        weight = weightVal,
                        length = lengthVal,
                        description = state.description,
                        latitude = latVal,
                        longitude = lonVal,
                        altitude = altVal,
                        destination = state.destination.ifBlank { null },
                        analysisRequested = state.analysisRequested.ifBlank { null },
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
        val sampleTypes = listOf(
            "Roca", "Suelo", "Sedimento", "Canal", "Chip", "Trinchera",
        )
    }
}
