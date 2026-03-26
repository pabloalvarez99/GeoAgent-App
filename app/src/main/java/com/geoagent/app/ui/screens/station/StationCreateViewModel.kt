package com.geoagent.app.ui.screens.station

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.repository.StationRepository
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
class StationCreateViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val stationRepository: StationRepository,
    private val preferencesHelper: PreferencesHelper,
) : ViewModel() {

    private val projectId: Long = checkNotNull(savedStateHandle["projectId"])
    private val editStationId: Long? = savedStateHandle.get<Long>("stationId")

    val isEditing: Boolean = editStationId != null && editStationId != 0L

    private val _code = MutableStateFlow("")
    val code: StateFlow<String> = _code.asStateFlow()

    private val _geologist = MutableStateFlow("")
    val geologist: StateFlow<String> = _geologist.asStateFlow()

    private val _description = MutableStateFlow("")
    val description: StateFlow<String> = _description.asStateFlow()

    private val _weatherConditions = MutableStateFlow("")
    val weatherConditions: StateFlow<String> = _weatherConditions.asStateFlow()

    private val _latitude = MutableStateFlow(0.0)
    val latitude: StateFlow<Double> = _latitude.asStateFlow()

    private val _longitude = MutableStateFlow(0.0)
    val longitude: StateFlow<Double> = _longitude.asStateFlow()

    private val _altitude = MutableStateFlow<Double?>(null)
    val altitude: StateFlow<Double?> = _altitude.asStateFlow()

    private val _gpsAccuracy = MutableStateFlow<Float?>(null)
    val gpsAccuracy: StateFlow<Float?> = _gpsAccuracy.asStateFlow()

    private val _isSaving = MutableStateFlow(false)
    val isSaving: StateFlow<Boolean> = _isSaving.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    init {
        if (isEditing) {
            loadExistingStation()
        } else {
            _geologist.value = preferencesHelper.lastGeologistName
            viewModelScope.launch {
                val existing = stationRepository.getByProject(projectId).first()
                _code.value = CodeGenerator.generateStationCode(existing.map { it.code })
            }
        }
    }

    private fun loadExistingStation() {
        viewModelScope.launch {
            val station = stationRepository.getById(editStationId!!).first() ?: return@launch
            _code.value = station.code
            _geologist.value = station.geologist
            _description.value = station.description
            _weatherConditions.value = station.weatherConditions ?: ""
            _latitude.value = station.latitude
            _longitude.value = station.longitude
            _altitude.value = station.altitude
        }
    }

    fun onCodeChange(value: String) {
        _code.value = value
    }

    fun onGeologistChange(value: String) {
        _geologist.value = value
    }

    fun onDescriptionChange(value: String) {
        _description.value = value
    }

    fun onWeatherConditionsChange(value: String) {
        _weatherConditions.value = value
    }

    fun onLocationUpdate(lat: Double, lng: Double, alt: Double?, accuracy: Float? = null) {
        _latitude.value = lat
        _longitude.value = lng
        _altitude.value = alt
        _gpsAccuracy.value = accuracy
    }

    fun clearError() {
        _errorMessage.value = null
    }

    suspend fun createStation(): Long? {
        if (_isSaving.value) return null

        val validationError = FormValidation.validateRequired(_code.value, "Codigo")
            ?: FormValidation.validateRequired(_geologist.value, "Geologo")
            ?: FormValidation.validateRequired(_description.value, "Descripcion")
            ?: FormValidation.validateCoordinatesCaptured(_latitude.value, _longitude.value)
            ?: FormValidation.validateLatitude(_latitude.value)
            ?: FormValidation.validateLongitude(_longitude.value)

        if (validationError != null) {
            _errorMessage.value = validationError
            return null
        }

        _isSaving.value = true
        _errorMessage.value = null
        return try {
            preferencesHelper.lastGeologistName = _geologist.value.trim()

            if (isEditing) {
                val existing = stationRepository.getById(editStationId!!).first()!!
                stationRepository.update(
                    existing.copy(
                        code = _code.value.trim(),
                        latitude = _latitude.value,
                        longitude = _longitude.value,
                        altitude = _altitude.value,
                        geologist = _geologist.value.trim(),
                        description = _description.value.trim(),
                        weatherConditions = _weatherConditions.value.ifBlank { null },
                    )
                )
                editStationId
            } else {
                stationRepository.create(
                    projectId = projectId,
                    code = _code.value.trim(),
                    latitude = _latitude.value,
                    longitude = _longitude.value,
                    altitude = _altitude.value,
                    geologist = _geologist.value.trim(),
                    description = _description.value.trim(),
                    weatherConditions = _weatherConditions.value.ifBlank { null },
                )
            }
        } catch (e: Exception) {
            _errorMessage.value = "Error al guardar: ${e.message}"
            null
        } finally {
            _isSaving.value = false
        }
    }
}
