/**
 * 预加载脚本
 * 用于安全地暴露 API 给渲染进程
 */
const { contextBridge, ipcRenderer } = require('electron');

// 暴露给渲染进程的 API
contextBridge.exposeInMainWorld('electronAPI', {
    // 游戏查询
    getPlatforms: () => ipcRenderer.invoke('get-platforms'),
    getGamesByPlatform: (filters) => ipcRenderer.invoke('get-games-by-platform', filters),
    searchGames: (params) => ipcRenderer.invoke('search-games', params),
    getAllGames: (filters) => ipcRenderer.invoke('get-all-games', filters),
    getGameDetail: (gameId) => ipcRenderer.invoke('get-game-detail', gameId),

    // 游戏状态管理
    updateGameStatus: (data) => ipcRenderer.invoke('update-game-status', data),
    updateGamePlaytime: (data) => ipcRenderer.invoke('update-game-playtime', data),
    toggleFavorite: (gameId) => ipcRenderer.invoke('toggle-favorite', gameId),
    saveGameRating: (data) => ipcRenderer.invoke('save-game-rating', data),

    // 游戏启动
    launchGame: (gamePath, platform) => ipcRenderer.invoke('launch-game', gamePath, platform),
    getEmulators: () => ipcRenderer.invoke('get-emulators'),

    // 统计数据
    getGameStats: (platform) => ipcRenderer.invoke('get-game-stats', platform),

    // 配置管理
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (newSettings) => ipcRenderer.invoke('save-settings', newSettings),
    updateGamesDir: (dirPath) => ipcRenderer.invoke('update-games-dir', dirPath),
    getGamesDir: () => ipcRenderer.invoke('get-games-dir'),
    setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
    getPlatformConfig: () => ipcRenderer.invoke('get-platform-config'),

    // 批量操作
    batchUpdateStatus: (data) => ipcRenderer.invoke('batch-update-status', data),
    batchToggleFavorite: (data) => ipcRenderer.invoke('batch-toggle-favorite', data),
    batchDeleteGames: (data) => ipcRenderer.invoke('batch-delete-games', data),

    // 游戏编辑与删除
    saveGameEdit: (gameData) => ipcRenderer.invoke('save-game-edit', gameData),
    deleteGame: (gameData) => ipcRenderer.invoke('delete-game', gameData),

    // 游戏盒子管理
    getAllBoxes: () => ipcRenderer.invoke('get-all-boxes'),
    createBox: (boxName) => ipcRenderer.invoke('create-box', boxName),
    deleteBox: (boxName) => ipcRenderer.invoke('delete-box', boxName),
    getBoxDetail: (boxName) => ipcRenderer.invoke('get-box-detail', boxName),
    addGameToBox: (data) => ipcRenderer.invoke('add-game-to-box', data),
    removeGameFromBox: (data) => ipcRenderer.invoke('remove-game-from-box', data),
    updateGameInBox: (data) => ipcRenderer.invoke('update-game-in-box', data),

    // 窗口管理
    openGameDetail: (gameData) => ipcRenderer.invoke('open-game-detail', gameData),
    closeDetailWindow: () => ipcRenderer.invoke('close-detail-window'),
    openBoxWindow: (boxName) => ipcRenderer.invoke('open-box-window', boxName),
    setDetailEditMode: (isEditing) => ipcRenderer.invoke('set-detail-edit-mode', isEditing),

    // 文件选择对话框
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    selectFile: (filters) => ipcRenderer.invoke('select-file', filters),
    selectImage: () => ipcRenderer.invoke('select-image'),

    // 添加游戏
    addGame: (gameData) => ipcRenderer.invoke('add-game', gameData),
    batchImportGames: (gamesData) => ipcRenderer.invoke('batch-import-games', gamesData),

    // 事件监听
    onRefreshLibrary: (callback) => {
        ipcRenderer.on('refresh-library', callback);
    },
    onBoxUpdated: (callback) => {
        ipcRenderer.on('box-updated', callback);
    },
    onOpenSettings: (callback) => {
        ipcRenderer.on('open-settings', callback);
    },
    onLoadGameDetail: (callback) => {
        ipcRenderer.on('load-game-detail', (event, gameData) => callback(gameData));
    },
    onThemeChanged: (callback) => {
        ipcRenderer.on('theme-changed', (event, theme) => callback(theme));
    },
    onDetailEditModeChanged: (callback) => {
        ipcRenderer.on('detail-edit-mode-changed', (event, isEditing) => callback(isEditing));
    },

    // 移除事件监听
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    },

    // 窗口操作
    resizeWindow: (width, height) => ipcRenderer.invoke('resize-window', width, height),
    setMinSize: (minWidth, minHeight) => ipcRenderer.invoke('set-min-size', minWidth, minHeight),

    // IGDB
    getIgdbConfig: () => ipcRenderer.invoke('get-igdb-config'),
    saveIgdbConfig: (config) => ipcRenderer.invoke('save-igdb-config', config),
    igdbSearchGames: (gameName) => ipcRenderer.invoke('igdb-search-games', gameName),
    onOpenIgdbImport: (callback) => {
        ipcRenderer.on('open-igdb-import', callback);
    },
    onOpenAddGame: (callback) => {
        ipcRenderer.on('open-add-game', callback);
    },
    onOpenJsonImport: (callback) => {
        ipcRenderer.on('open-json-import', callback);
    }
});

console.log('Preload script loaded');
