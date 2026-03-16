package com.geoagent.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.auth.status.SessionStatus
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

sealed interface AuthState {
    data object Loading : AuthState
    data object LoggedOut : AuthState
    data object LoggedIn : AuthState
}

@HiltViewModel
class AuthNavigationViewModel @Inject constructor(
    authRepository: AuthRepository,
) : ViewModel() {

    val authState: StateFlow<AuthState> = authRepository.observeSessionStatus()
        .map { status ->
            when (status) {
                is SessionStatus.Authenticated -> AuthState.LoggedIn
                is SessionStatus.NotAuthenticated -> AuthState.LoggedOut
                is SessionStatus.LoadingFromStorage -> AuthState.Loading
                is SessionStatus.NetworkError -> AuthState.LoggedOut
            }
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = AuthState.Loading,
        )
}

@Composable
fun GeoAgentRootNavigation(
    viewModel: AuthNavigationViewModel = hiltViewModel(),
) {
    val authState by viewModel.authState.collectAsState()

    when (authState) {
        AuthState.Loading -> {
            // Show nothing while checking session status (brief flash)
            // Could add a splash screen here in the future
        }
        AuthState.LoggedOut -> {
            com.geoagent.app.ui.screens.auth.LoginScreen(
                onLoginSuccess = {
                    // Auth state will automatically switch via the Flow
                },
            )
        }
        AuthState.LoggedIn -> {
            GeoAgentNavHost()
        }
    }
}
