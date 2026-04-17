package com.geoagent.app

import com.google.firebase.appcheck.AppCheckProviderFactory
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory

object AppCheckProvider {
    fun get(): AppCheckProviderFactory = DebugAppCheckProviderFactory.getInstance()
}
