package com.geoagent.app.ui.screens.lithology

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LithologyFormScreen(
    stationId: Long,
    lithologyId: Long?,
    onSaved: () -> Unit,
    onNavigateBack: () -> Unit,
    viewModel: LithologyFormViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.isSaved) {
        if (uiState.isSaved) onSaved()
    }

    LaunchedEffect(uiState.errorMessage) {
        uiState.errorMessage?.let { snackbarHostState.showSnackbar(it) }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(if (uiState.isEditing) "Editar Litologia" else "Litologia")
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Volver",
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer,
                ),
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { viewModel.save() },
                icon = { Icon(Icons.Default.Save, contentDescription = null) },
                text = { Text("Guardar") },
            )
        },
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            // Grupo de Roca
            DropdownField(
                label = "Grupo de Roca *",
                selectedValue = uiState.rockGroup,
                options = LithologyFormViewModel.rockGroups,
                onSelected = viewModel::onRockGroupChanged,
            )

            // Tipo de Roca
            val rockTypeOptions = LithologyFormViewModel.rockTypesByGroup[uiState.rockGroup] ?: emptyList()
            DropdownField(
                label = "Tipo de Roca *",
                selectedValue = uiState.rockType,
                options = rockTypeOptions,
                onSelected = viewModel::onRockTypeChanged,
                enabled = uiState.rockGroup.isNotBlank(),
            )

            // Color
            DropdownField(
                label = "Color *",
                selectedValue = uiState.color,
                options = LithologyFormViewModel.colors,
                onSelected = viewModel::onColorChanged,
            )

            // Textura
            DropdownField(
                label = "Textura *",
                selectedValue = uiState.texture,
                options = LithologyFormViewModel.textures,
                onSelected = viewModel::onTextureChanged,
            )

            // Tamano de Grano
            DropdownField(
                label = "Tamano de Grano *",
                selectedValue = uiState.grainSize,
                options = LithologyFormViewModel.grainSizes,
                onSelected = viewModel::onGrainSizeChanged,
            )

            // Mineralogia
            OutlinedTextField(
                value = uiState.mineralogy,
                onValueChange = viewModel::onMineralogyChanged,
                label = { Text("Mineralogia (separar por comas)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )

            // Alteracion
            DropdownField(
                label = "Alteracion",
                selectedValue = uiState.alteration,
                options = LithologyFormViewModel.alterations,
                onSelected = viewModel::onAlterationChanged,
            )

            // Intensidad Alteracion - visible only when alteration is selected and not "Ninguna"
            AnimatedVisibility(
                visible = uiState.alteration.isNotBlank() && uiState.alteration != "Ninguna",
            ) {
                DropdownField(
                    label = "Intensidad de Alteracion",
                    selectedValue = uiState.alterationIntensity,
                    options = LithologyFormViewModel.alterationIntensities,
                    onSelected = viewModel::onAlterationIntensityChanged,
                )
            }

            // Mineralizacion
            OutlinedTextField(
                value = uiState.mineralization,
                onValueChange = viewModel::onMineralizationChanged,
                label = { Text("Mineralizacion") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )

            // % Mineralizacion
            OutlinedTextField(
                value = uiState.mineralizationPercent,
                onValueChange = viewModel::onMineralizationPercentChanged,
                label = { Text("% Mineralizacion") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            )

            // Estructura
            DropdownField(
                label = "Estructura",
                selectedValue = uiState.structure,
                options = LithologyFormViewModel.structures,
                onSelected = viewModel::onStructureChanged,
            )

            // Meteorizacion
            DropdownField(
                label = "Meteorizacion",
                selectedValue = uiState.weathering,
                options = LithologyFormViewModel.weatherings,
                onSelected = viewModel::onWeatheringChanged,
            )

            // Notas
            OutlinedTextField(
                value = uiState.notes,
                onValueChange = viewModel::onNotesChanged,
                label = { Text("Notas") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3,
                maxLines = 6,
            )

            // Bottom spacing for FAB
            Spacer(modifier = Modifier.height(72.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DropdownField(
    label: String,
    selectedValue: String,
    options: List<String>,
    onSelected: (String) -> Unit,
    enabled: Boolean = true,
) {
    var expanded by remember { mutableStateOf(false) }

    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { if (enabled) expanded = it },
    ) {
        OutlinedTextField(
            value = selectedValue,
            onValueChange = {},
            readOnly = true,
            enabled = enabled,
            label = { Text(label) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(),
            modifier = Modifier
                .fillMaxWidth()
                .menuAnchor(MenuAnchorType.PrimaryNotEditable),
        )

        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
        ) {
            options.forEach { option ->
                DropdownMenuItem(
                    text = { Text(option) },
                    onClick = {
                        onSelected(option)
                        expanded = false
                    },
                    contentPadding = ExposedDropdownMenuDefaults.ItemContentPadding,
                )
            }
        }
    }
}
