package com.geoagent.app.data.remote

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.storage.Storage

object SupabaseConfig {
    const val SUPABASE_URL = "https://jagkrzsgxboqlbgyrkza.supabase.co"
    const val SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphZ2tyenNneGJvcWxiZ3lya3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NTQ1NjEsImV4cCI6MjA4OTIzMDU2MX0.x3V5fg0i4idpSQYFKVjh8GTL9W-WVHuzalx7nl_1cZs"

    val client: SupabaseClient = createSupabaseClient(
        supabaseUrl = SUPABASE_URL,
        supabaseKey = SUPABASE_ANON_KEY
    ) {
        install(Auth)
        install(Postgrest)
        install(Storage)
    }
}
