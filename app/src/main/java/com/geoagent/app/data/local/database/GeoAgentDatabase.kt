package com.geoagent.app.data.local.database

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
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
    version = 3,
    exportSchema = true
)
abstract class GeoAgentDatabase : RoomDatabase() {

    companion object {
        val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE photos ADD COLUMN project_id INTEGER")
                db.execSQL("CREATE INDEX IF NOT EXISTS index_photos_project_id ON photos(project_id)")
            }
        }

        val MIGRATION_2_3 = object : Migration(2, 3) {
            override fun migrate(db: SupportSQLiteDatabase) {
                // Add sync_status and remote_id indexes for faster pull-phase lookups
                // and pending-sync queries across all entity tables
                listOf("projects", "stations", "lithologies", "structural_data",
                    "samples", "drill_holes", "drill_intervals", "photos").forEach { table ->
                    db.execSQL("CREATE INDEX IF NOT EXISTS index_${table}_sync_status ON $table(sync_status)")
                    db.execSQL("CREATE INDEX IF NOT EXISTS index_${table}_remote_id ON $table(remote_id)")
                }
            }
        }
    }

    abstract fun projectDao(): ProjectDao
    abstract fun stationDao(): StationDao
    abstract fun lithologyDao(): LithologyDao
    abstract fun structuralDao(): StructuralDao
    abstract fun sampleDao(): SampleDao
    abstract fun drillHoleDao(): DrillHoleDao
    abstract fun drillIntervalDao(): DrillIntervalDao
    abstract fun photoDao(): PhotoDao
}
