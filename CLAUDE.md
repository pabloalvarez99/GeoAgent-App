# GeoAgent - Android Field Geology App

## Project Overview
Android native app (Kotlin + Jetpack Compose) for field geology data collection.
Offline-first with Supabase cloud sync.

## Tech Stack
- **Language:** Kotlin
- **UI:** Jetpack Compose + Material 3
- **Database:** Room (SQLite) for local, Supabase (PostgreSQL) for cloud
- **DI:** Hilt
- **Async:** Coroutines + Flow
- **Sync:** WorkManager
- **Navigation:** Compose Navigation with type-safe routes

## Architecture
- `data/local/entity/` - Room entities
- `data/local/dao/` - Room DAOs
- `data/local/database/` - Room database
- `data/remote/` - Supabase client and remote data source
- `data/remote/dto/` - Supabase DTOs
- `data/repository/` - Repositories (single source of truth)
- `data/sync/` - Sync engine (WorkManager)
- `di/` - Hilt modules
- `ui/screens/` - Screen composables + ViewModels
- `ui/components/` - Reusable UI components
- `ui/navigation/` - Navigation routes and host
- `ui/theme/` - Material 3 theme
- `util/` - Utilities (GPS, dates, export, PDF, validation)

## Conventions
- All UI text in **Spanish**
- Large touch targets (48dp+ buttons) for field use with gloves
- Offline-first: all data saved to Room first, synced when WiFi available
- Entity syncStatus: PENDING -> SYNCED, MODIFIED -> SYNCED
- Use `Flow` for reactive UI, `suspend` for writes
- Package: `com.geoagent.app`

## Supabase
- Project: jagkrzsgxboqlbgyrkza
- Region: West US (Oregon)
- Migrations in `supabase/migrations/`
