package com.geoagent.app.data.repository

import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.auth.status.SessionStatus
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import javax.inject.Inject
import javax.inject.Singleton

data class UserInfo(
    val id: String,
    val email: String,
    val fullName: String?,
)

@Singleton
class AuthRepository @Inject constructor(
    private val auth: Auth,
) {

    suspend fun signIn(email: String, password: String): Result<Unit> {
        return try {
            auth.signInWith(Email) {
                this.email = email
                this.password = password
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun signUp(email: String, password: String, fullName: String): Result<Unit> {
        return try {
            auth.signUpWith(Email) {
                this.email = email
                this.password = password
                data = buildJsonObject {
                    put("full_name", fullName)
                }
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun signOut() {
        try {
            auth.signOut()
        } catch (_: Exception) {
            // Ignore errors on sign out
        }
    }

    fun isLoggedIn(): Boolean {
        return auth.sessionStatus.value is SessionStatus.Authenticated
    }

    fun getCurrentUser(): Flow<UserInfo?> {
        return auth.sessionStatus.map { status ->
            when (status) {
                is SessionStatus.Authenticated -> {
                    val user = auth.currentUserOrNull()
                    user?.let {
                        UserInfo(
                            id = it.id,
                            email = it.email ?: "",
                            fullName = it.userMetadata?.get("full_name")?.toString()
                                ?.removeSurrounding("\""),
                        )
                    }
                }
                else -> null
            }
        }
    }

    suspend fun getCurrentUserName(): String? {
        return try {
            val user = auth.currentUserOrNull()
            user?.userMetadata?.get("full_name")?.toString()?.removeSurrounding("\"")
        } catch (_: Exception) {
            null
        }
    }

    fun observeSessionStatus(): Flow<SessionStatus> = auth.sessionStatus
}
