package com.geoagent.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.toRoute
import com.geoagent.app.ui.screens.drillhole.DrillHoleCreateScreen
import com.geoagent.app.ui.screens.drillhole.DrillHoleDetailScreen
import com.geoagent.app.ui.screens.drillhole.DrillHoleListScreen
import com.geoagent.app.ui.screens.drillhole.DrillIntervalFormScreen
import com.geoagent.app.ui.screens.export.ExportScreen
import com.geoagent.app.ui.screens.home.HomeScreen
import com.geoagent.app.ui.screens.lithology.LithologyFormScreen
import com.geoagent.app.ui.screens.map.MapViewScreen
import com.geoagent.app.ui.screens.photo.CameraCaptureScreen
import com.geoagent.app.ui.screens.photo.PhotoGalleryScreen
import com.geoagent.app.ui.screens.project.ProjectDetailScreen
import com.geoagent.app.ui.screens.project.ProjectListScreen
import com.geoagent.app.ui.screens.sample.SampleFormScreen
import com.geoagent.app.ui.screens.station.StationCreateScreen
import com.geoagent.app.ui.screens.station.StationDetailScreen
import com.geoagent.app.ui.screens.station.StationListScreen
import com.geoagent.app.ui.screens.settings.SettingsScreen
import com.geoagent.app.ui.screens.structural.StructuralFormScreen

@Composable
fun GeoAgentNavHost() {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = Route.Home
    ) {
        composable<Route.Home> {
            HomeScreen(
                onNavigateToProjects = { navController.navigate(Route.ProjectList) },
                onNavigateToMap = { navController.navigate(Route.MapView(0L)) },
                onNavigateToSettings = { navController.navigate(Route.Settings) },
            )
        }

        composable<Route.ProjectList> {
            ProjectListScreen(
                onNavigateToProject = { projectId ->
                    navController.navigate(Route.ProjectDetail(projectId))
                },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable<Route.ProjectDetail> { backStackEntry ->
            val route = backStackEntry.toRoute<Route.ProjectDetail>()
            ProjectDetailScreen(
                projectId = route.projectId,
                onNavigateToStations = { navController.navigate(Route.StationList(route.projectId)) },
                onNavigateToDrillHoles = { navController.navigate(Route.DrillHoleList(route.projectId)) },
                onNavigateToMap = { navController.navigate(Route.MapView(route.projectId)) },
                onNavigateToExport = { navController.navigate(Route.Export(route.projectId)) },
                onNavigateToPhotos = {
                    navController.navigate(Route.PhotoGallery(projectId = route.projectId))
                },
                onNavigateToCamera = {
                    navController.navigate(Route.CameraCapture(projectId = route.projectId))
                },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable<Route.StationList> { backStackEntry ->
            val route = backStackEntry.toRoute<Route.StationList>()
            StationListScreen(
                projectId = route.projectId,
                onNavigateToStation = { stationId ->
                    navController.navigate(Route.StationDetail(stationId))
                },
                onNavigateToCreate = {
                    navController.navigate(Route.StationCreate(route.projectId))
                },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable<Route.StationCreate> { backStackEntry ->
            val route = backStackEntry.toRoute<Route.StationCreate>()
            StationCreateScreen(
                projectId = route.projectId,
                onStationCreated = { stationId ->
                    if (route.stationId != null && route.stationId != 0L) {
                        // Editing — just go back to detail screen
                        navController.popBackStack()
                    } else {
                        // Creating — navigate to the new station detail
                        navController.navigate(Route.StationDetail(stationId)) {
                            popUpTo(Route.StationList(route.projectId))
                        }
                    }
                },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable<Route.StationDetail> { backStackEntry ->
            val route = backStackEntry.toRoute<Route.StationDetail>()
            StationDetailScreen(
                stationId = route.stationId,
                onNavigateToLithology = { lithologyId ->
                    navController.navigate(Route.LithologyForm(route.stationId, lithologyId))
                },
                onNavigateToStructural = { structuralId ->
                    navController.navigate(Route.StructuralForm(route.stationId, structuralId))
                },
                onNavigateToSample = { sampleId ->
                    navController.navigate(Route.SampleForm(route.stationId, sampleId))
                },
                onNavigateToPhotos = {
                    navController.navigate(Route.PhotoGallery(stationId = route.stationId))
                },
                onNavigateToCamera = {
                    navController.navigate(Route.CameraCapture(stationId = route.stationId))
                },
                onNavigateToEdit = {
                    // Navigate back and then to edit - need projectId from station
                    // StationCreate will load the station data via stationId
                    navController.navigate(Route.StationCreate(projectId = 0, stationId = route.stationId))
                },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable<Route.LithologyForm> { backStackEntry ->
            val route = backStackEntry.toRoute<Route.LithologyForm>()
            LithologyFormScreen(
                stationId = route.stationId,
                lithologyId = route.lithologyId,
                onSaved = { navController.popBackStack() },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable<Route.StructuralForm> { backStackEntry ->
            val route = backStackEntry.toRoute<Route.StructuralForm>()
            StructuralFormScreen(
                stationId = route.stationId,
                structuralId = route.structuralId,
                onSaved = { navController.popBackStack() },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable<Route.SampleForm> { backStackEntry ->
            val route = backStackEntry.toRoute<Route.SampleForm>()
            SampleFormScreen(
                stationId = route.stationId,
                sampleId = route.sampleId,
                onSaved = { navController.popBackStack() },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable<Route.DrillHoleList> { backStackEntry ->
            val route = backStackEntry.toRoute<Route.DrillHoleList>()
            DrillHoleListScreen(
                projectId = route.projectId,
                onNavigateToDrillHole = { drillHoleId ->
                    navController.navigate(Route.DrillHoleDetail(drillHoleId))
                },
                onNavigateToCreate = {
                    navController.navigate(Route.DrillHoleCreate(route.projectId))
                },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable<Route.DrillHoleCreate> { backStackEntry ->
            val route = backStackEntry.toRoute<Route.DrillHoleCreate>()
            DrillHoleCreateScreen(
                projectId = route.projectId,
                onCreated = { drillHoleId ->
                    if (route.drillHoleId != null && route.drillHoleId != 0L) {
                        navController.popBackStack()
                    } else {
                        navController.navigate(Route.DrillHoleDetail(drillHoleId)) {
                            popUpTo(Route.DrillHoleList(route.projectId))
                        }
                    }
                },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable<Route.DrillHoleDetail> { backStackEntry ->
            val route = backStackEntry.toRoute<Route.DrillHoleDetail>()
            DrillHoleDetailScreen(
                drillHoleId = route.drillHoleId,
                onNavigateToInterval = { intervalId ->
                    navController.navigate(Route.DrillIntervalForm(route.drillHoleId, intervalId))
                },
                onNavigateToPhotos = {
                    navController.navigate(Route.PhotoGallery(drillHoleId = route.drillHoleId))
                },
                onNavigateToCamera = {
                    navController.navigate(Route.CameraCapture(drillHoleId = route.drillHoleId))
                },
                onNavigateToEdit = {
                    navController.navigate(Route.DrillHoleCreate(projectId = 0, drillHoleId = route.drillHoleId))
                },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable<Route.DrillIntervalForm> { backStackEntry ->
            val route = backStackEntry.toRoute<Route.DrillIntervalForm>()
            DrillIntervalFormScreen(
                drillHoleId = route.drillHoleId,
                intervalId = route.intervalId,
                onSaved = { navController.popBackStack() },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable<Route.MapView> { backStackEntry ->
            val route = backStackEntry.toRoute<Route.MapView>()
            MapViewScreen(
                projectId = route.projectId,
                onNavigateToStation = { stationId ->
                    navController.navigate(Route.StationDetail(stationId))
                },
                onNavigateToDrillHole = { drillHoleId ->
                    navController.navigate(Route.DrillHoleDetail(drillHoleId))
                },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable<Route.PhotoGallery> { backStackEntry ->
            val route = backStackEntry.toRoute<Route.PhotoGallery>()
            PhotoGalleryScreen(
                stationId = route.stationId,
                drillHoleId = route.drillHoleId,
                projectId = route.projectId,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable<Route.CameraCapture> { backStackEntry ->
            val route = backStackEntry.toRoute<Route.CameraCapture>()
            CameraCaptureScreen(
                stationId = route.stationId,
                drillHoleId = route.drillHoleId,
                projectId = route.projectId,
                onPhotoCaptured = { navController.popBackStack() },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable<Route.Export> {
            ExportScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable<Route.Settings> {
            SettingsScreen(
                onNavigateBack = { navController.popBackStack() },
                onLogout = {
                    navController.navigate(Route.Home) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
    }
}
