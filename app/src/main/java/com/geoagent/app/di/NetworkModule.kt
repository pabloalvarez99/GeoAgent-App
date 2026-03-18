package com.geoagent.app.di

import com.geoagent.app.data.sync.ConnectivityObserver
import com.geoagent.app.data.sync.NetworkConnectivityObserver
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class NetworkModule {

    @Binds
    @Singleton
    abstract fun bindConnectivityObserver(
        impl: NetworkConnectivityObserver,
    ): ConnectivityObserver
}
