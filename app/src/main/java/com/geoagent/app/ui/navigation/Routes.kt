package com.geoagent.app.ui.navigation

import kotlinx.serialization.Serializable

sealed interface Route {

    @Serializable
    data object Home : Route

    @Serializable
    data object ProjectList : Route

    @Serializable
    data class ProjectDetail(val projectId: Long) : Route

    @Serializable
    data class StationList(val projectId: Long) : Route

    @Serializable
    data class StationDetail(val stationId: Long) : Route

    @Serializable
    data class StationCreate(val projectId: Long, val stationId: Long? = null) : Route

    @Serializable
    data class LithologyForm(val stationId: Long, val lithologyId: Long? = null) : Route

    @Serializable
    data class StructuralForm(val stationId: Long, val structuralId: Long? = null) : Route

    @Serializable
    data class SampleForm(val stationId: Long, val sampleId: Long? = null) : Route

    @Serializable
    data class DrillHoleList(val projectId: Long) : Route

    @Serializable
    data class DrillHoleDetail(val drillHoleId: Long) : Route

    @Serializable
    data class DrillHoleCreate(val projectId: Long, val drillHoleId: Long? = null) : Route

    @Serializable
    data class DrillIntervalForm(val drillHoleId: Long, val intervalId: Long? = null) : Route

    @Serializable
    data class MapView(val projectId: Long) : Route

    @Serializable
    data class PhotoGallery(val stationId: Long? = null, val drillHoleId: Long? = null, val projectId: Long? = null) : Route

    @Serializable
    data class CameraCapture(val stationId: Long? = null, val drillHoleId: Long? = null, val projectId: Long? = null) : Route

    @Serializable
    data class Export(val projectId: Long) : Route

    @Serializable
    data object Settings : Route

    @Serializable
    data object Login : Route
}
