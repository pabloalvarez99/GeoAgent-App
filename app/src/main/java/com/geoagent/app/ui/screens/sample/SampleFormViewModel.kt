package com.geoagent.app.ui.screens.sample

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import androidx.core.content.ContextCompat
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.GeoConstants
import com.geoagent.app.data.local.entity.SampleEntity
import com.geoagent.app.data.repository.SampleRepository
import com.geoagent.app.util.CodeGenerator
import com.geoagent.app.util.FormValidation
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
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
            viewModelScope.launch {
                val existing = sampleRepository.getByStation(stationId).first()
                _uiState.update { it.copy(code = CodeGenerator.generateSampleCode(existing.map { s -> s.code })) }
            }
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

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    @SuppressLint("MissingPermission")
    fun captureGps() {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION)
            != PackageManager.PERMISSION_GRANTED) {
            _uiState.update { it.copy(isCapturingGps = false) }
            return
        }
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
        if (state.isSaving) return

        val validationError = FormValidation.validateRequired(state.code, "Codigo de muestra")
            ?: FormValidation.validateRequired(state.type, "Tipo de muestra")
            ?: FormValidation.validateRequired(state.description, "Descripcion")
            ?: FormValidation.validatePositive(FormValidation.parseDouble(state.weight), "Peso")

        if (validationError != null) {
            _uiState.update { it.copy(errorMessage = validationError) }
            return
        }

        val weightVal = FormValidation.parseDouble(state.weight)
        val lengthVal = FormValidation.parseDouble(state.length)
        val latVal = FormValidation.parseDouble(state.latitude)
        val lonVal = FormValidation.parseDouble(state.longitude)
        val altVal = FormValidation.parseDouble(state.altitude)

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
        val sampleTypes = GeoConstants.sampleTypes
    }
}
