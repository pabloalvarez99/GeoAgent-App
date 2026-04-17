package com.geoagent.app

import com.google.firebase.appcheck.AppCheckProviderFactory
import com.google.firebase.appcheck.playintegrity.PlayIntegrityAppCheckProviderFactory

object AppCheckProvider {
    fun get(): AppCheckProviderFactory = PlayIntegrityAppCheckProviderFactory.getInstance()
}
