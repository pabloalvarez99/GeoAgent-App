package com.geoagent.app.ui.screens.project

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.local.entity.ProjectEntity
import com.geoagent.app.data.repository.PhotoRepository
import com.geoagent.app.data.repository.ProjectRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProjectDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val projectRepository: ProjectRepository,
    photoRepository: PhotoRepository,
) : ViewModel() {

    private val projectId: Long = savedStateHandle.get<Long>("projectId")
        ?: throw IllegalArgumentException("projectId is required")

    val project: StateFlow<ProjectEntity?> = projectRepository.getById(projectId)
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = null,
        )

    val stationCount: StateFlow<Int> = projectRepository.getStationCount(projectId)
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = 0,
        )

    val drillHoleCount: StateFlow<Int> = projectRepository.getDrillHoleCount(projectId)
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = 0,
        )

    val sampleCount: StateFlow<Int> = projectRepository.getSampleCount(projectId)
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = 0,
        )

    val photoCount: StateFlow<Int> = photoRepository.getCountByProject(projectId)
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = 0,
        )

    fun updateProject(name: String, description: String, location: String) {
        val current = project.value ?: return
        viewModelScope.launch {
            projectRepository.update(
                current.copy(
                    name = name.trim(),
                    description = description.trim(),
                    location = location.trim(),
                )
            )
        }
    }

    fun deleteProject(onDeleted: () -> Unit) {
        val current = project.value ?: return
        viewModelScope.launch {
            try {
                projectRepository.delete(current)
                onDeleted()
            } catch (e: Exception) {
                // Room delete with CASCADE shouldn't fail, but guard anyway
                android.util.Log.e("ProjectDetailVM", "Failed to delete project", e)
            }
        }
    }
}
