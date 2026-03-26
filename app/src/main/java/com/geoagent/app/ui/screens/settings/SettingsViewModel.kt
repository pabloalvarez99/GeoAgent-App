package com.geoagent.app.ui.screens.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.repository.AuthRepository
import com.geoagent.app.data.repository.DrillHoleRepository
import com.geoagent.app.data.repository.LithologyRepository
import com.geoagent.app.data.repository.PhotoRepository
import com.geoagent.app.data.repository.ProjectRepository
import com.geoagent.app.data.repository.SampleRepository
import com.geoagent.app.data.repository.StationRepository
import com.geoagent.app.data.repository.StructuralRepository
import com.geoagent.app.data.repository.UserInfo
import com.geoagent.app.data.sync.SyncManager
import com.geoagent.app.util.CoordinateFormat
import com.geoagent.app.util.DistanceUnit
import com.geoagent.app.util.PreferencesHelper
import dagger.hilt.android.lifecycle.HiltViewModel
import androidx.lifecycle.asFlow
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SettingsUiState(
    val isSyncing: Boolean = false,
    val lastSyncTimestamp: Long? = null,
    val showLogoutDialog: Boolean = false,
    val syncError: String? = null,
    val coordinateFormat: CoordinateFormat = CoordinateFormat.DECIMAL_DEGREES,
    val distanceUnit: DistanceUnit = DistanceUnit.METERS,
    val autoSaveGps: Boolean = true,
    val highAccuracyGps: Boolean = true,
    val defaultGeologist: String = "",
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val syncManager: SyncManager,
    private val preferencesHelper: PreferencesHelper,
    projectRepository: ProjectRepository,
    stationRepository: StationRepository,
    drillHoleRepository: DrillHoleRepository,
    photoRepository: PhotoRepository,
    sampleRepository: SampleRepository,
    lithologyRepository: LithologyRepository,
    structuralRepository: StructuralRepository,
) : ViewModel() {

    val userInfo: StateFlow<UserInfo?> = authRepository.getCurrentUser()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = null,
        )

    private val _uiState = MutableStateFlow(
        SettingsUiState(
            coordinateFormat = preferencesHelper.coordinateFormat,
            distanceUnit = preferencesHelper.distanceUnit,
            autoSaveGps = preferencesHelper.autoSaveGps,
            highAccuracyGps = preferencesHelper.highAccuracyGps,
            defaultGeologist = preferencesHelper.lastGeologistName,
        )
    )
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    val pendingSyncCount: StateFlow<Int> = combine(
        combine(
            projectRepository.getPendingSyncCount(),
            stationRepository.getPendingSyncCount(),
            drillHoleRepository.getPendingSyncCount(),
            photoRepository.getPendingSyncCount(),
            sampleRepository.getPendingSyncCount(),
        ) { counts -> counts.sum() },
        combine(
            lithologyRepository.getPendingSyncCount(),
            structuralRepository.getPendingSyncCount(),
            drillHoleRepository.getIntervalPendingSyncCount(),
        ) { counts -> counts.sum() },
    ) { a, b -> a + b }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = 0,
        )

    fun setCoordinateFormat(format: CoordinateFormat) {
        preferencesHelper.coordinateFormat = format
        _uiState.update { it.copy(coordinateFormat = format) }
    }

    fun setDistanceUnit(unit: DistanceUnit) {
        preferencesHelper.distanceUnit = unit
        _uiState.update { it.copy(distanceUnit = unit) }
    }

    fun setAutoSaveGps(enabled: Boolean) {
        preferencesHelper.autoSaveGps = enabled
        _uiState.update { it.copy(autoSaveGps = enabled) }
    }

    fun setHighAccuracyGps(enabled: Boolean) {
        preferencesHelper.highAccuracyGps = enabled
        _uiState.update { it.copy(highAccuracyGps = enabled) }
    }

    fun setDefaultGeologist(name: String) {
        preferencesHelper.lastGeologistName = name
        _uiState.update { it.copy(defaultGeologist = name) }
    }

    private var syncJob: Job? = null

    fun syncNow() {
        syncJob?.cancel()
        _uiState.update { it.copy(isSyncing = true, syncError = null) }
        val workInfos = syncManager.syncNow()
        syncJob = viewModelScope.launch {
            workInfos.asFlow().collect { infoList ->
                val info = infoList.firstOrNull() ?: return@collect
                when {
                    info.state.isFinished -> {
                        val succeeded = info.state == androidx.work.WorkInfo.State.SUCCEEDED
                        val errorMsg = info.outputData.getString("error")
                        _uiState.update {
                            it.copy(
                                isSyncing = false,
                                lastSyncTimestamp = if (succeeded) System.currentTimeMillis() else it.lastSyncTimestamp,
                                syncError = if (!succeeded) (errorMsg ?: "Error durante la sincronizacion.") else null,
                            )
                        }
                        syncManager.schedulePeriodic()
                        syncJob = null
                    }
                    else -> _uiState.update { it.copy(isSyncing = true) }
                }
            }
        }
    }

    fun showLogoutDialog() {
        _uiState.update { it.copy(showLogoutDialog = true) }
    }

    fun dismissLogoutDialog() {
        _uiState.update { it.copy(showLogoutDialog = false) }
    }

    fun logout(onComplete: () -> Unit) {
        viewModelScope.launch {
            authRepository.signOut()
            _uiState.update { it.copy(showLogoutDialog = false) }
            onComplete()
        }
    }
}
