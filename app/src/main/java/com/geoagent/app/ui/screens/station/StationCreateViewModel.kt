package com.geoagent.app.ui.screens.station

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import com.geoagent.app.data.repository.StationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject

@HiltViewModel
class StationCreateViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val stationRepository: StationRepository,
) : ViewModel() {

    private val projectId: Long = checkNotNull(savedStateHandle["projectId"])

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

    fun onLocationUpdate(lat: Double, lng: Double, alt: Double?) {
        _latitude.value = lat
        _longitude.value = lng
        _altitude.value = alt
    }

    suspend fun createStation(): Long {
        return stationRepository.create(
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
}
