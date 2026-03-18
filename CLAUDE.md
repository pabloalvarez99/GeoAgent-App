## Workflow Orchestration

### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

---

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
