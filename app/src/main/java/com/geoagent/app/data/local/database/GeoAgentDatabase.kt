package com.geoagent.app.data.local.database

import androidx.room.Database
import androidx.room.RoomDatabase
import com.geoagent.app.data.local.dao.DrillHoleDao
import com.geoagent.app.data.local.dao.DrillIntervalDao
import com.geoagent.app.data.local.dao.LithologyDao
import com.geoagent.app.data.local.dao.PhotoDao
import com.geoagent.app.data.local.dao.ProjectDao
import com.geoagent.app.data.local.dao.SampleDao
import com.geoagent.app.data.local.dao.StationDao
import com.geoagent.app.data.local.dao.StructuralDao
import com.geoagent.app.data.local.entity.DrillHoleEntity
import com.geoagent.app.data.local.entity.DrillIntervalEntity
import com.geoagent.app.data.local.entity.LithologyEntity
import com.geoagent.app.data.local.entity.PhotoEntity
import com.geoagent.app.data.local.entity.ProjectEntity
import com.geoagent.app.data.local.entity.SampleEntity
import com.geoagent.app.data.local.entity.StationEntity
import com.geoagent.app.data.local.entity.StructuralEntity

@Database(
    entities = [
        ProjectEntity::class,
        StationEntity::class,
        LithologyEntity::class,
        StructuralEntity::class,
        SampleEntity::class,
        DrillHoleEntity::class,
        DrillIntervalEntity::class,
        PhotoEntity::class,
    ],
    version = 1,
    exportSchema = true
)
abstract class GeoAgentDatabase : RoomDatabase() {
    abstract fun projectDao(): ProjectDao
    abstract fun stationDao(): StationDao
    abstract fun lithologyDao(): LithologyDao
    abstract fun structuralDao(): StructuralDao
    abstract fun sampleDao(): SampleDao
    abstract fun drillHoleDao(): DrillHoleDao
    abstract fun drillIntervalDao(): DrillIntervalDao
    abstract fun photoDao(): PhotoDao
}
