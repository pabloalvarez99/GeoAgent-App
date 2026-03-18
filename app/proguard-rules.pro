# Room
-keep class * extends androidx.room.RoomDatabase
-dontwarn androidx.room.paging.**

# Apache POI (Excel export)
-keep class org.apache.poi.** { *; }
-keep class org.apache.xmlbeans.** { *; }
-dontwarn org.apache.poi.**
-dontwarn org.apache.xmlbeans.**
-dontwarn org.openxmlformats.**
-dontwarn com.microsoft.schemas.**
-dontwarn org.etsi.**
-dontwarn org.w3.**

# Supabase / Ktor
-keep class io.github.jan.supabase.** { *; }
-keep class io.ktor.** { *; }
-dontwarn io.ktor.**

# MapLibre
-keep class org.maplibre.** { *; }
-keep class org.maplibre.geojson.** { *; }
-dontwarn org.maplibre.**

# Gson (used by MapLibre geojson)
-keepattributes Signature
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer
-dontwarn sun.misc.**

# Serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt
-keepclassmembers class kotlinx.serialization.json.** { *** Companion; }
-keepclasseswithmembers class kotlinx.serialization.json.** { kotlinx.serialization.KSerializer serializer(...); }
-keep,includedescriptorclasses class com.geoagent.app.**$$serializer { *; }
-keepclassmembers class com.geoagent.app.** { *** Companion; }
-keepclasseswithmembers class com.geoagent.app.** { kotlinx.serialization.KSerializer serializer(...); }
