package com.geoagent.app.ui.screens.drillhole

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.HorizontalDivider
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.geoagent.app.data.GeoConstants
import com.geoagent.app.util.FormValidation

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DrillIntervalFormScreen(
    drillHoleId: Long,
    intervalId: Long?,
    onSaved: () -> Unit,
    onNavigateBack: () -> Unit,
    viewModel: DrillIntervalFormViewModel = hiltViewModel(),
) {
    val existingInterval by viewModel.existingInterval.collectAsState()
    val isSaving by viewModel.isSaving.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    var fromDepth by remember { mutableStateOf("") }
    var toDepth by remember { mutableStateOf("") }
    var rockGroup by remember { mutableStateOf("") }
    var rockGroupExpanded by remember { mutableStateOf(false) }
    var rockType by remember { mutableStateOf("") }
    var color by remember { mutableStateOf("") }
    var colorExpanded by remember { mutableStateOf(false) }
    var texture by remember { mutableStateOf("") }
    var textureExpanded by remember { mutableStateOf(false) }
    var grainSize by remember { mutableStateOf("") }
    var grainSizeExpanded by remember { mutableStateOf(false) }
    var mineralogy by remember { mutableStateOf("") }
    var alteration by remember { mutableStateOf("") }
    var alterationExpanded by remember { mutableStateOf(false) }
    var alterationIntensity by remember { mutableStateOf("") }
    var alterationIntensityExpanded by remember { mutableStateOf(false) }
    var mineralization by remember { mutableStateOf("") }
    var mineralizationPercent by remember { mutableStateOf("") }
    var rqd by remember { mutableStateOf("") }
    var recovery by remember { mutableStateOf("") }
    var structure by remember { mutableStateOf("") }
    var structureExpanded by remember { mutableStateOf(false) }
    var weathering by remember { mutableStateOf("") }
    var weatheringExpanded by remember { mutableStateOf(false) }
    var notes by remember { mutableStateOf("") }
    var formInitialized by remember { mutableStateOf(false) }

    // Geology dropdown options
    val rockGroups = GeoConstants.rockGroups
    val colors = GeoConstants.colors
    val textures = GeoConstants.textures
    val grainSizes = GeoConstants.grainSizes
    val alterations = GeoConstants.alterations
    val alterationIntensities = GeoConstants.alterationIntensities
    val structures = GeoConstants.structures
    val weatherings = GeoConstants.weatheringGrades

    // Load existing data
    LaunchedEffect(existingInterval) {
        existingInterval?.let { interval ->
            if (!formInitialized) {
                fromDepth = "%.1f".format(interval.fromDepth)
                toDepth = "%.1f".format(interval.toDepth)
                rockGroup = interval.rockGroup
                rockType = interval.rockType
                color = interval.color
                texture = interval.texture
                grainSize = interval.grainSize
                mineralogy = interval.mineralogy
                alteration = interval.alteration ?: ""
                alterationIntensity = interval.alterationIntensity ?: ""
                mineralization = interval.mineralization ?: ""
                mineralizationPercent = interval.mineralizationPercent?.let { "%.1f".format(it) } ?: ""
                rqd = interval.rqd?.let { "%.0f".format(it) } ?: ""
                recovery = interval.recovery?.let { "%.0f".format(it) } ?: ""
                structure = interval.structure ?: ""
                weathering = interval.weathering ?: ""
                notes = interval.notes ?: ""
                formInitialized = true
            }
        }
    }

    LaunchedEffect(errorMessage) {
        errorMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearError()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = if (viewModel.isEditing) "Editar Intervalo" else "Intervalo de Logging",
                        fontWeight = FontWeight.SemiBold,
                    )
                },
                navigationIcon = {
                    IconButton(
                        onClick = onNavigateBack,
                        modifier = Modifier.size(48.dp),
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Volver",
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer,
                    navigationIconContentColor = MaterialTheme.colorScheme.onPrimaryContainer,
                ),
            )
        },
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            // Depth interval
            SectionHeader("Profundidad")

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                OutlinedTextField(
                    value = fromDepth,
                    onValueChange = { fromDepth = it },
                    label = { Text("Desde (m) *") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = toDepth,
                    onValueChange = { toDepth = it },
                    label = { Text("Hasta (m) *") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                )
            }

            HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))

            // Geology fields
            SectionHeader("Litologia")

            DropdownField(
                value = rockGroup,
                onValueChange = { rockGroup = it },
                label = "Grupo de Roca *",
                options = rockGroups,
                expanded = rockGroupExpanded,
                onExpandedChange = { rockGroupExpanded = it },
            )

            OutlinedTextField(
                value = rockType,
                onValueChange = { rockType = it },
                label = { Text("Tipo de Roca *") },
                placeholder = { Text("Ej: Granodiorita, Arenisca") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )

            DropdownField(
                value = color,
                onValueChange = { color = it },
                label = "Color *",
                options = colors,
                expanded = colorExpanded,
                onExpandedChange = { colorExpanded = it },
            )

            DropdownField(
                value = texture,
                onValueChange = { texture = it },
                label = "Textura *",
                options = textures,
                expanded = textureExpanded,
                onExpandedChange = { textureExpanded = it },
            )

            DropdownField(
                value = grainSize,
                onValueChange = { grainSize = it },
                label = "Tamano de Grano *",
                options = grainSizes,
                expanded = grainSizeExpanded,
                onExpandedChange = { grainSizeExpanded = it },
            )

            OutlinedTextField(
                value = mineralogy,
                onValueChange = { mineralogy = it },
                label = { Text("Mineralogia *") },
                placeholder = { Text("Ej: Qz, Fd, Bt, Py") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )

            HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))

            // Alteration
            SectionHeader("Alteracion y Mineralizacion")

            DropdownField(
                value = alteration,
                onValueChange = { alteration = it },
                label = "Alteracion",
                options = alterations,
                expanded = alterationExpanded,
                onExpandedChange = { alterationExpanded = it },
            )

            DropdownField(
                value = alterationIntensity,
                onValueChange = { alterationIntensity = it },
                label = "Intensidad de Alteracion",
                options = alterationIntensities,
                expanded = alterationIntensityExpanded,
                onExpandedChange = { alterationIntensityExpanded = it },
            )

            OutlinedTextField(
                value = mineralization,
                onValueChange = { mineralization = it },
                label = { Text("Mineralizacion") },
                placeholder = { Text("Ej: Py, Cpy, Mo") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )

            OutlinedTextField(
                value = mineralizationPercent,
                onValueChange = { mineralizationPercent = it },
                label = { Text("Mineralizacion (%)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )

            HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))

            // Structure and weathering
            SectionHeader("Estructura y Meteorismo")

            DropdownField(
                value = structure,
                onValueChange = { structure = it },
                label = "Estructura",
                options = structures,
                expanded = structureExpanded,
                onExpandedChange = { structureExpanded = it },
            )

            DropdownField(
                value = weathering,
                onValueChange = { weathering = it },
                label = "Meteorismo",
                options = weatherings,
                expanded = weatheringExpanded,
                onExpandedChange = { weatheringExpanded = it },
            )

            HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))

            // RQD and Recovery
            SectionHeader("Calidad del Testigo")

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                OutlinedTextField(
                    value = rqd,
                    onValueChange = { rqd = it },
                    label = { Text("RQD (%)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    supportingText = { Text("0 - 100") },
                )
                OutlinedTextField(
                    value = recovery,
                    onValueChange = { recovery = it },
                    label = { Text("Recuperacion (%)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    supportingText = { Text("0 - 100") },
                )
            }

            HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))

            // Notes
            OutlinedTextField(
                value = notes,
                onValueChange = { notes = it },
                label = { Text("Notas") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(120.dp),
                maxLines = 5,
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Save button
            Button(
                onClick = {
                    viewModel.save(
                        fromDepth = FormValidation.parseDouble(fromDepth),
                        toDepth = FormValidation.parseDouble(toDepth),
                        rockGroup = rockGroup,
                        rockType = rockType.trim(),
                        color = color,
                        texture = texture,
                        grainSize = grainSize,
                        mineralogy = mineralogy.trim(),
                        alteration = alteration.ifBlank { null },
                        alterationIntensity = alterationIntensity.ifBlank { null },
                        mineralization = mineralization.trim().ifBlank { null },
                        mineralizationPercent = FormValidation.parseDouble(mineralizationPercent),
                        rqd = FormValidation.parseDouble(rqd),
                        recovery = FormValidation.parseDouble(recovery),
                        structure = structure.ifBlank { null },
                        weathering = weathering.ifBlank { null },
                        notes = notes.trim().ifBlank { null },
                        onSaved = onSaved,
                    )
                },
                enabled = !isSaving,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                ),
            ) {
                if (isSaving) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = MaterialTheme.colorScheme.onPrimary,
                        strokeWidth = 2.dp,
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.Save,
                        contentDescription = null,
                        modifier = Modifier.size(24.dp),
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = if (viewModel.isEditing) "Actualizar Intervalo" else "Guardar Intervalo",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
private fun SectionHeader(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.Bold,
        color = MaterialTheme.colorScheme.primary,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DropdownField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    options: List<String>,
    expanded: Boolean,
    onExpandedChange: (Boolean) -> Unit,
) {
    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = onExpandedChange,
    ) {
        OutlinedTextField(
            value = value,
            onValueChange = {},
            readOnly = true,
            label = { Text(label) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier
                .fillMaxWidth()
                .menuAnchor(MenuAnchorType.PrimaryNotEditable),
        )
        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { onExpandedChange(false) },
        ) {
            options.forEach { option ->
                DropdownMenuItem(
                    text = { Text(option) },
                    onClick = {
                        onValueChange(option)
                        onExpandedChange(false)
                    },
                    contentPadding = ExposedDropdownMenuDefaults.ItemContentPadding,
                )
            }
        }
    }
}
