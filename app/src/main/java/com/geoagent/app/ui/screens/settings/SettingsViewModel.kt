package com.geoagent.app.ui.screens.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.local.dao.ProjectDao
import com.geoagent.app.data.repository.AuthRepository
import com.geoagent.app.data.repository.UserInfo
import com.geoagent.app.data.sync.SyncManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SettingsUiState(
    val isSyncing: Boolean = false,
    val lastSyncTimestamp: Long? = null,
    val pendingSyncCount: Int = 0,
    val showLogoutDialog: Boolean = false,
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val syncManager: SyncManager,
    private val projectDao: ProjectDao,
) : ViewModel() {

    val userInfo: StateFlow<UserInfo?> = authRepository.getCurrentUser()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = null,
        )

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        loadPendingSyncCount()
    }

    private fun loadPendingSyncCount() {
        viewModelScope.launch {
            try {
                val pendingProjects = projectDao.getPendingSync()
                _uiState.update { it.copy(pendingSyncCount = pendingProjects.size) }
            } catch (_: Exception) {
                // Ignore
            }
        }
    }

    fun syncNow() {
        viewModelScope.launch {
            _uiState.update { it.copy(isSyncing = true) }
            try {
                syncManager.schedulePeriodic()
                _uiState.update {
                    it.copy(
                        isSyncing = false,
                        lastSyncTimestamp = System.currentTimeMillis(),
                    )
                }
                loadPendingSyncCount()
            } catch (_: Exception) {
                _uiState.update { it.copy(isSyncing = false) }
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
