package com.geoagent.app.ui.screens.project

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geoagent.app.data.local.entity.ProjectEntity
import com.geoagent.app.data.repository.ProjectRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProjectListViewModel @Inject constructor(
    private val projectRepository: ProjectRepository,
) : ViewModel() {

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    val projects: StateFlow<List<ProjectEntity>> = combine(
        projectRepository.getAll(),
        _searchQuery,
    ) { projects, query ->
        if (query.isBlank()) {
            projects.sortedByDescending { it.updatedAt }
        } else {
            projects.filter { project ->
                project.name.contains(query, ignoreCase = true) ||
                    project.description.contains(query, ignoreCase = true) ||
                    project.location.contains(query, ignoreCase = true)
            }
        }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = emptyList(),
    )

    fun onSearchQueryChange(query: String) {
        _searchQuery.value = query
    }

    fun createProject(name: String, description: String, location: String) {
        viewModelScope.launch {
            projectRepository.create(name, description, location)
        }
    }

    fun deleteProject(project: ProjectEntity) {
        viewModelScope.launch {
            projectRepository.delete(project)
        }
    }
}
