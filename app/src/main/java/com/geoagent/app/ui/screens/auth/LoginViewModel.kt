package com.geoagent.app.ui.screens.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.FirebaseAuthInvalidUserException
import com.google.firebase.auth.FirebaseAuthUserCollisionException
import com.google.firebase.auth.FirebaseAuthWeakPasswordException
import com.geoagent.app.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val fullName: String = "",
    val isSignupMode: Boolean = false,
    val isLoading: Boolean = false,
    val error: String? = null,
    val isSuccess: Boolean = false,
)

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun updateEmail(email: String) {
        _uiState.update { it.copy(email = email, error = null) }
    }

    fun updatePassword(password: String) {
        _uiState.update { it.copy(password = password, error = null) }
    }

    fun updateFullName(fullName: String) {
        _uiState.update { it.copy(fullName = fullName, error = null) }
    }

    fun toggleMode() {
        _uiState.update {
            it.copy(
                isSignupMode = !it.isSignupMode,
                error = null,
                password = "",
                fullName = "",
            )
        }
    }

    fun signIn() {
        val state = _uiState.value
        if (state.email.isBlank() || state.password.isBlank()) {
            _uiState.update { it.copy(error = "Por favor completa todos los campos") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = authRepository.signIn(state.email.trim(), state.password)
            result.fold(
                onSuccess = {
                    _uiState.update { it.copy(isLoading = false, isSuccess = true) }
                },
                onFailure = { e ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = mapAuthError(e),
                        )
                    }
                },
            )
        }
    }

    fun signUp() {
        val state = _uiState.value
        if (state.email.isBlank() || state.password.isBlank() || state.fullName.isBlank()) {
            _uiState.update { it.copy(error = "Por favor completa todos los campos") }
            return
        }
        if (state.password.length < 6) {
            _uiState.update { it.copy(error = "La contrasena debe tener al menos 6 caracteres") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = authRepository.signUp(
                email = state.email.trim(),
                password = state.password,
                fullName = state.fullName.trim(),
            )
            result.fold(
                onSuccess = {
                    _uiState.update { it.copy(isLoading = false, isSuccess = true) }
                },
                onFailure = { e ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = mapAuthError(e),
                        )
                    }
                },
            )
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    private fun mapAuthError(e: Throwable): String {
        return when (e) {
            is FirebaseAuthInvalidCredentialsException ->
                "Credenciales invalidas. Verifica tu correo y contrasena."
            is FirebaseAuthInvalidUserException ->
                "No existe una cuenta con este correo."
            is FirebaseAuthUserCollisionException ->
                "Este correo ya esta registrado."
            is FirebaseAuthWeakPasswordException ->
                "La contrasena es demasiado debil."
            else -> {
                val message = e.message?.lowercase() ?: ""
                when {
                    "network" in message || "unable to resolve host" in message ->
                        "Error de conexion. Verifica tu internet."
                    "too many requests" in message ->
                        "Demasiados intentos. Espera un momento."
                    else -> "Error de autenticacion: ${e.message ?: "desconocido"}"
                }
            }
        }
    }
}
