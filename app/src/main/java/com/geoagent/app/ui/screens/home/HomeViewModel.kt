package com.geoagent.app.ui.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.repository.ProjectRepository
import com.geoagent.app.data.sync.ConnectivityObserver
import com.geoagent.app.data.sync.ConnectivityStatus
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    projectRepository: ProjectRepository,
    connectivityObserver: ConnectivityObserver,
) : ViewModel() {

    val projectCount: StateFlow<Int> = projectRepository.getAll()
        .map { it.size }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = 0,
        )

    val isConnected: StateFlow<Boolean> = connectivityObserver.connectivityStatus
        .map { it == ConnectivityStatus.Available }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = false,
        )
}
