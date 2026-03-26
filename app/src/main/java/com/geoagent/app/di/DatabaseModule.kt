package com.geoagent.app.di

import android.content.Context
import androidx.room.Room
import com.geoagent.app.data.local.dao.DrillHoleDao
import com.geoagent.app.data.local.dao.DrillIntervalDao
import com.geoagent.app.data.local.dao.LithologyDao
import com.geoagent.app.data.local.dao.PhotoDao
import com.geoagent.app.data.local.dao.ProjectDao
import com.geoagent.app.data.local.dao.SampleDao
import com.geoagent.app.data.local.dao.StationDao
import com.geoagent.app.data.local.dao.StructuralDao
import com.geoagent.app.data.local.database.GeoAgentDatabase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): GeoAgentDatabase {
        return Room.databaseBuilder(
            context,
            GeoAgentDatabase::class.java,
            "geoagent.db"
        )
            .addMigrations(GeoAgentDatabase.MIGRATION_1_2, GeoAgentDatabase.MIGRATION_2_3)
            .build()
    }

    @Provides fun provideProjectDao(db: GeoAgentDatabase): ProjectDao = db.projectDao()
    @Provides fun provideStationDao(db: GeoAgentDatabase): StationDao = db.stationDao()
    @Provides fun provideLithologyDao(db: GeoAgentDatabase): LithologyDao = db.lithologyDao()
    @Provides fun provideStructuralDao(db: GeoAgentDatabase): StructuralDao = db.structuralDao()
    @Provides fun provideSampleDao(db: GeoAgentDatabase): SampleDao = db.sampleDao()
    @Provides fun provideDrillHoleDao(db: GeoAgentDatabase): DrillHoleDao = db.drillHoleDao()
    @Provides fun provideDrillIntervalDao(db: GeoAgentDatabase): DrillIntervalDao = db.drillIntervalDao()
    @Provides fun providePhotoDao(db: GeoAgentDatabase): PhotoDao = db.photoDao()
}
