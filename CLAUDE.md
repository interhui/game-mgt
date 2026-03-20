# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Electron-based emulator game manager (similar to Playnite) that manages games across multiple emulator platforms. Games are stored as JSON files in a configurable library directory, and user data (ratings, play status, tags, favorites) is stored in a JSON-based database.

## Commands

```bash
npm start        # Run the app in production mode
npm run dev      # Run with logging enabled (development)
npm run build    # Build Windows executable with electron-builder
npm test         # Run Jest tests
```

Tests are located in `tests/` and follow the pattern `*.test.js`. Service tests are under `src/main/services/*.test.js`.

## Architecture

### Process Model

**Main Process** (main.js entry):
- `main.js` - App initialization, window creation, service wiring
- `src/main/ipc-handlers.js` - All IPC communication handlers between main and renderer
- Services in `src/main/services/`:
  - `FileService.js` - File system operations, platform folder scanning
  - `GameService.js` - Game CRUD, search, filtering, sorting
  - `DatabaseService.js` - User data storage (ratings, favorites, tags, play stats)
  - `SettingsService.js` - App configuration (theme, games directory, emulators)
  - `LauncherService.js` - Emulator game launching
  - `TagService.js` - Tag management
  - `BoxService.js` - Game collection/box management

**Renderer Process** (HTML + vanilla JS):
- `src/renderer/index.html` - Main library view (poster wall)
- `src/renderer/detail.html` - Game detail popup window
- `src/renderer/box.html` - Game box collection view
- `src/renderer/js/` - Corresponding renderer logic

**Configuration**:
- `config/platforms.json` - Platform definitions (name, emulator config)
- `config/settings.json` - User settings (created at runtime)

### Data Model

**Game Library** (`games/{platform}/{gameFolder}/game.json`):
```json
{
  "id": "unique-id",
  "name": "Game Name",
  "platform": "ps2",
  "folderName": "game-folder",
  "status": "unplayed|playing|completed",
  "userRating": 0-5,
  "favorite": boolean,
  "tags": [],
  "description": "",
  "publishDate": "",
  "playTime": 0,
  "lastPlayed": "date"
}
```

**User Database** (JSON file at app userData):
```json
{
  "games": [...],      # Extended game data with stats
  "tags": [...],       # Tag definitions
  "game_tags": [...]   # Many-to-many relations
}
```

### IPC Communication Pattern

All renderer-to-main communication uses `ipcRenderer.invoke()` with handlers in `ipc-handlers.js`. Key channels:
- `get-platforms`, `get-games-by-platform`, `get-all-games`, `search-games` - Query operations
- `update-game-status`, `save-game-rating`, `toggle-favorite` - State mutations
- `launch-game` - Execute emulator
- `get-settings`, `save-settings`, `set-theme` - Configuration

### Window Management

Three window types managed in main.js:
1. **Main Window** - Primary library view, `index.html`
2. **Detail Window** - Frameless popup for game details, `detail.html`
3. **Box Window** - Game collection view, `box.html`

### Theme System

Dark/light themes via CSS files in `src/renderer/css/themes/`. Theme switching sends `theme-changed` event to all windows.

## Key Implementation Notes

- Despite `DatabaseService` having a `.db` path, it actually uses JSON file storage
- `getGamesDirPath()` in ipc-handlers.js resolves relative game paths against `APP_ROOT` (project root), not the Electron app path
- Games are organized by platform folder, then individual game folders, each containing a `game.json`
- Preload script (`preload.js`) is required for contextIsolation bridge between main and renderer
