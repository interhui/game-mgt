/**
 * IPC 处理器
 * 处理渲染进程和主进程之间的通信
 */
const { ipcMain, dialog, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

// 程序根目录
const APP_ROOT = path.join(__dirname, '..', '..');

/**
 * 从 URL 下载文件到临时目录
 * @param {string} url - 文件 URL
 * @returns {Promise<string>} 临时文件路径
 */
function downloadFileToTemp(url) {
    return new Promise((resolve, reject) => {
        console.log('[Cover Download] Starting download:', url);
        const ext = path.extname(url) || '.jpg';
        const tempPath = path.join(APP_ROOT, `temp_cover_${Date.now()}${ext}`);
        console.log('[Cover Download] Temp path:', tempPath);
        const file = fs.createWriteStream(tempPath);

        const protocol = url.startsWith('https:') ? https : http;

        protocol.get(url, (response) => {
            console.log('[Cover Download] Response status:', response.statusCode);
            // 处理重定向
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                console.log('[Cover Download] Redirect to:', response.headers.location);
                file.close();
                fs.unlinkSync(tempPath);
                downloadFileToTemp(response.headers.location).then(resolve).catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                console.log('[Cover Download] Non-200 status, rejecting');
                file.close();
                fs.unlinkSync(tempPath);
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log('[Cover Download] Download complete:', tempPath);
                resolve(tempPath);
            });
        }).on('error', (err) => {
            console.log('[Cover Download] Error:', err.message);
            file.close();
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
            reject(err);
        });
    });
}

/**
 * 获取游戏目录的绝对路径
 * @param {string} gamesDir - 游戏目录配置（可能是相对路径或绝对路径）
 * @returns {string} 绝对路径
 */
function getGamesDirPath(gamesDir) {
    if (!gamesDir) {
        return path.join(APP_ROOT, 'games');
    }
    // 如果是绝对路径，直接返回
    if (path.isAbsolute(gamesDir)) {
        return gamesDir;
    }
    // 如果是相对路径，基于程序根目录解析
    return path.join(APP_ROOT, gamesDir);
}

/**
 * 设置所有 IPC 处理器
 * @param {Object} services - 服务实例对象
 */
function setupIpcHandlers(services) {
    const {
        fileService,
        gameService,
        dbService,
        settingsService,
        launcherService,
        boxService,
        igdbService,
        getMainWindow,
        createGameDetailWindow,
        createBoxWindow
    } = services;

    // ==================== 游戏查询接口 ====================

    // 获取所有平台
    ipcMain.handle('get-platforms', async () => {
        try {
            const settings = settingsService.getSettings();
            const gamesDir = getGamesDirPath(settings.library.gamesDir);
            const platforms = await fileService.getSimulatorFolders(gamesDir);
            const stats = await gameService.getPlatformStats(platforms, gamesDir);
            return stats;
        } catch (error) {
            console.error('Error getting platforms:', error);
            return { error: error.message };
        }
    });

    // 获取指定平台的游戏列表
    ipcMain.handle('get-games-by-platform', async (event, filters) => {
        try {
            const settings = settingsService.getSettings();
            const gamesDir = getGamesDirPath(settings.library.gamesDir);
            const { platform, status, sortBy, sortOrder } = filters || {};
            const games = await gameService.getGamesByPlatform(platform, gamesDir, { status, sortBy, sortOrder });
            return games;
        } catch (error) {
            console.error('Error getting games by platform:', error);
            return { error: error.message };
        }
    });

    // 搜索游戏
    ipcMain.handle('search-games', async (event, params) => {
        try {
            const settings = settingsService.getSettings();
            const gamesDir = getGamesDirPath(settings.library.gamesDir);
            const { keyword, filters = {} } = params;
            const games = await gameService.searchGames(keyword, gamesDir, filters);
            return games;
        } catch (error) {
            console.error('Error searching games:', error);
            return { error: error.message };
        }
    });

    // 获取所有游戏
    ipcMain.handle('get-all-games', async (event, filters) => {
        try {
            const settings = settingsService.getSettings();
            const gamesDir = getGamesDirPath(settings.library.gamesDir);
            const games = await gameService.getAllGames(gamesDir, filters);
            return games;
        } catch (error) {
            console.error('Error getting all games:', error);
            return { error: error.message };
        }
    });

    // 获取游戏详情
    ipcMain.handle('get-game-detail', async (event, gameId) => {
        try {
            const settings = settingsService.getSettings();
            const gamesDir = getGamesDirPath(settings.library.gamesDir);
            const detail = await gameService.getGameDetail(gameId, gamesDir);
            return detail;
        } catch (error) {
            console.error('Error getting game detail:', error);
            return { error: error.message };
        }
    });

    // ==================== 游戏状态管理 ====================

    // 更新游戏状态
    ipcMain.handle('update-game-status', async (event, data) => {
        try {
            const settings = settingsService.getSettings();
            const gamesDir = getGamesDirPath(settings.library.gamesDir);
            const { gameId, status, playTime } = data;
            const result = await gameService.updateGameState(gameId, status, playTime, gamesDir);
            await dbService.saveGameState(gameId, { status, playTime });
            return result;
        } catch (error) {
            console.error('Error updating game status:', error);
            return { error: error.message };
        }
    });

    // 更新游戏时长
    ipcMain.handle('update-game-playtime', async (event, data) => {
        try {
            const { gameId, duration } = data;
            const result = await gameService.updatePlayTime(gameId, duration);
            await dbService.updatePlayTime(gameId, duration);
            return result;
        } catch (error) {
            console.error('Error updating playtime:', error);
            return { error: error.message };
        }
    });

    // 标记/取消收藏
    ipcMain.handle('toggle-favorite', async (event, gameId) => {
        try {
            const settings = settingsService.getSettings();
            const gamesDir = getGamesDirPath(settings.library.gamesDir);
            const isFavorite = await gameService.toggleFavorite(gameId, gamesDir);
            await dbService.setFavorite(gameId, isFavorite);
            return { favorite: isFavorite };
        } catch (error) {
            console.error('Error toggling favorite:', error);
            return { error: error.message };
        }
    });

    // 保存用户评分
    ipcMain.handle('save-game-rating', async (event, data) => {
        try {
            const settings = settingsService.getSettings();
            const gamesDir = getGamesDirPath(settings.library.gamesDir);
            const { gameId, rating, comment } = data;
            await gameService.saveRating(gameId, rating, comment, gamesDir);
            await dbService.saveUserRating(gameId, rating, comment);
            return { success: true };
        } catch (error) {
            console.error('Error saving rating:', error);
            return { error: error.message };
        }
    });

    // ==================== 游戏启动 ====================

    // 启动游戏
    ipcMain.handle('launch-game', async (event, gamePath, platform) => {
        try {
            const emulatorPath = settingsService.getEmulatorPath(platform);
            const result = await launcherService.launchGame(gamePath, platform, emulatorPath);
            return result;
        } catch (error) {
            console.error('Error launching game:', error);
            return { error: error.message };
        }
    });

    // 获取可用模拟器列表
    ipcMain.handle('get-emulators', async () => {
        try {
            const emulators = launcherService.getAvailableEmulators();
            return emulators;
        } catch (error) {
            console.error('Error getting emulators:', error);
            return { error: error.message };
        }
    });

    // ==================== 统计数据 ====================

    // 获取游戏统计数据
    ipcMain.handle('get-game-stats', async (event, platform) => {
        try {
            const settings = settingsService.getSettings();
            const gamesDir = getGamesDirPath(settings.library.gamesDir);
            const stats = await gameService.getStats(platform, gamesDir);
            return stats;
        } catch (error) {
            console.error('Error getting game stats:', error);
            return { error: error.message };
        }
    });

    // ==================== 配置管理 ====================

    // 获取应用配置
    ipcMain.handle('get-settings', async () => {
        try {
            const settings = settingsService.getSettings();
            return settings;
        } catch (error) {
            console.error('Error getting settings:', error);
            return { error: error.message };
        }
    });

    // 保存应用配置
    ipcMain.handle('save-settings', async (event, newSettings) => {
        try {
            settingsService.saveSettings(newSettings);
            return { success: true };
        } catch (error) {
            console.error('Error saving settings:', error);
            return { error: error.message };
        }
    });

    // 更新游戏目录配置
    ipcMain.handle('update-games-dir', async (event, dirPath) => {
        try {
            settingsService.setGamesDir(dirPath);
            return { success: true, dirPath };
        } catch (error) {
            console.error('Error updating games dir:', error);
            return { error: error.message };
        }
    });

    // 获取游戏目录配置
    ipcMain.handle('get-games-dir', async () => {
        try {
            const dir = settingsService.getGamesDir();
            return { dirPath: dir };
        } catch (error) {
            console.error('Error getting games dir:', error);
            return { error: error.message };
        }
    });

    // 切换主题
    ipcMain.handle('set-theme', async (event, theme) => {
        try {
            settingsService.setTheme(theme);
            // 通知所有窗口主题已更改
            BrowserWindow.getAllWindows().forEach(win => {
                win.webContents.send('theme-changed', theme);
            });
            return { success: true, theme };
        } catch (error) {
            console.error('Error setting theme:', error);
            return { error: error.message };
        }
    });

    // 获取平台配置
    ipcMain.handle('get-platform-config', async () => {
        try {
            const config = await fileService.getPlatformConfig();
            return config;
        } catch (error) {
            console.error('Error getting platform config:', error);
            return { error: error.message };
        }
    });

    // ==================== 批量操作 ====================

    // 批量更新游戏状态
    ipcMain.handle('batch-update-status', async (event, { gameIds, status }) => {
        try {
            const settings = settingsService.getSettings();
            const gamesDir = getGamesDirPath(settings.library.gamesDir);
            const result = await gameService.batchUpdateStatus(gameIds, status, gamesDir);
            return result;
        } catch (error) {
            console.error('Error batch updating status:', error);
            return { error: error.message };
        }
    });

    // 批量收藏/取消收藏
    ipcMain.handle('batch-toggle-favorite', async (event, { gameIds }) => {
        try {
            const settings = settingsService.getSettings();
            const gamesDir = getGamesDirPath(settings.library.gamesDir);
            const result = await gameService.batchToggleFavorite(gameIds, gamesDir);
            return result;
        } catch (error) {
            console.error('Error batch toggling favorite:', error);
            return { error: error.message };
        }
    });

    // 批量删除游戏
    ipcMain.handle('batch-delete-games', async (event, { gameIds }) => {
        try {
            const settings = settingsService.getSettings();
            const gamesDir = getGamesDirPath(settings.library.gamesDir);
            const result = await gameService.batchDeleteGames(gameIds, gamesDir);
            return result;
        } catch (error) {
            console.error('Error batch deleting games:', error);
            return { error: error.message };
        }
    });

    // 保存游戏编辑
    ipcMain.handle('save-game-edit', async (event, gameData) => {
        try {
            const settings = settingsService.getSettings();
            const gamesDir = getGamesDirPath(settings.library.gamesDir);

            // 读取现有游戏数据
            const gameFilePath = path.join(gamesDir, gameData.platform, gameData.folderName, 'game.json');
            const existingData = JSON.parse(fs.readFileSync(gameFilePath, 'utf-8'));

            // 更新可编辑字段
            existingData.name = gameData.name;
            existingData.publishDate = gameData.publishDate;
            existingData.status = gameData.status;
            existingData.userRating = gameData.userRating;
            existingData.favorite = gameData.favorite;
            existingData.tags = gameData.tags;
            existingData.description = gameData.description;
            existingData.userComment = gameData.userComment;

            // 写入更新后的数据
            fs.writeFileSync(gameFilePath, JSON.stringify(existingData, null, 2), 'utf-8');

            // 通知主窗口刷新
            const mainWindow = getMainWindow();
            if (mainWindow) {
                mainWindow.webContents.send('refresh-library');
            }

            return { success: true };
        } catch (error) {
            console.error('Error saving game edit:', error);
            return { error: error.message };
        }
    });

    // 删除单个游戏
    ipcMain.handle('delete-game', async (event, gameData) => {
        try {
            const settings = settingsService.getSettings();
            const gamesDir = getGamesDirPath(settings.library.gamesDir);

            // 删除游戏描述文件
            const gameFilePath = path.join(gamesDir, gameData.platform, gameData.folderName, 'game.json');
            if (fs.existsSync(gameFilePath)) {
                fs.unlinkSync(gameFilePath);
            }

            // 通知主窗口刷新
            const mainWindow = getMainWindow();
            if (mainWindow) {
                mainWindow.webContents.send('refresh-library');
            }

            return { success: true };
        } catch (error) {
            console.error('Error deleting game:', error);
            return { error: error.message };
        }
    });

    // ==================== 游戏盒子管理 ====================

    // 获取所有游戏盒子
    ipcMain.handle('get-all-boxes', async () => {
        try {
            const gameboxDir = settingsService.getGameboxDir();
            const boxes = await boxService.getAllBoxes(gameboxDir);
            return boxes;
        } catch (error) {
            console.error('Error getting all boxes:', error);
            return { error: error.message };
        }
    });

    // 通知所有窗口刷新盒子列表
    function notifyBoxUpdated() {
        BrowserWindow.getAllWindows().forEach(win => {
            win.webContents.send('box-updated');
        });
    }

    // 创建游戏盒子
    ipcMain.handle('create-box', async (event, boxName) => {
        try {
            const gameboxDir = settingsService.getGameboxDir();
            const result = await boxService.createBox(boxName, gameboxDir);
            notifyBoxUpdated();
            return result;
        } catch (error) {
            console.error('Error creating box:', error);
            return { error: error.message };
        }
    });

    // 删除游戏盒子
    ipcMain.handle('delete-box', async (event, boxName) => {
        try {
            const gameboxDir = settingsService.getGameboxDir();
            const result = await boxService.deleteBox(boxName, gameboxDir);
            notifyBoxUpdated();
            return result;
        } catch (error) {
            console.error('Error deleting box:', error);
            return { error: error.message };
        }
    });

    // 获取盒子详情
    ipcMain.handle('get-box-detail', async (event, boxName) => {
        try {
            const gameboxDir = settingsService.getGameboxDir();
            const result = await boxService.getBoxDetail(boxName, gameboxDir);
            return result;
        } catch (error) {
            console.error('Error getting box detail:', error);
            return { error: error.message };
        }
    });

    // 添加游戏到盒子
    ipcMain.handle('add-game-to-box', async (event, data) => {
        try {
            const gameboxDir = settingsService.getGameboxDir();
            const { boxName, platform, gameInfo } = data;
            const result = await boxService.addGameToBox(boxName, platform, gameInfo, gameboxDir);
            notifyBoxUpdated();
            return result;
        } catch (error) {
            console.error('Error adding game to box:', error);
            return { error: error.message };
        }
    });

    // 从盒子中移除游戏
    ipcMain.handle('remove-game-from-box', async (event, data) => {
        try {
            const gameboxDir = settingsService.getGameboxDir();
            const { boxName, platform, gameId } = data;
            const result = await boxService.removeGameFromBox(boxName, platform, gameId, gameboxDir);
            notifyBoxUpdated();
            return result;
        } catch (error) {
            console.error('Error removing game from box:', error);
            return { error: error.message };
        }
    });

    // 更新盒子中游戏的状态
    ipcMain.handle('update-game-in-box', async (event, data) => {
        try {
            const gameboxDir = settingsService.getGameboxDir();
            const { boxName, platform, gameId, gameInfo } = data;
            const result = await boxService.updateGameInBox(boxName, platform, gameId, gameInfo, gameboxDir);
            notifyBoxUpdated();
            return result;
        } catch (error) {
            console.error('Error updating game in box:', error);
            return { error: error.message };
        }
    });

    // ==================== 窗口管理 ====================

    // 打开游戏详情窗口
    ipcMain.handle('open-game-detail', async (event, gameData) => {
        try {
            createGameDetailWindow(gameData);
            return { success: true };
        } catch (error) {
            console.error('Error opening game detail:', error);
            return { error: error.message };
        }
    });

    // 关闭详情窗口
    ipcMain.handle('close-detail-window', async () => {
        try {
            const windows = BrowserWindow.getAllWindows();
            // 找到非主窗口（详情窗口）
            const detailWin = windows.find(w => w !== BrowserWindow.getFocusedWindow()?.mainWindow);
            if (detailWin) {
                detailWin.close();
            } else if (windows.length > 0) {
                // 如果找不到，关闭最后一个窗口
                windows[windows.length - 1].close();
            }
            return { success: true };
        } catch (error) {
            console.error('Error closing detail window:', error);
            return { error: error.message };
        }
    });

    // 设置详情窗口编辑模式状态（锁定/解锁主窗口游戏卡片点击）
    ipcMain.handle('set-detail-edit-mode', async (event, isEditing) => {
        try {
            // 发送事件给主窗口，通知游戏卡片是否应该被锁定
            const mainWindow = services.getMainWindow();
            if (mainWindow) {
                mainWindow.webContents.send('detail-edit-mode-changed', isEditing);
            }
            return { success: true };
        } catch (error) {
            console.error('Error setting detail edit mode:', error);
            return { error: error.message };
        }
    });

    // 打开游戏盒子窗口
    ipcMain.handle('open-box-window', async (event, boxName) => {
        try {
            createBoxWindow(boxName);
            return { success: true };
        } catch (error) {
            console.error('Error opening box window:', error);
            return { error: error.message };
        }
    });

    // ==================== 文件选择对话框 ====================

    // 选择目录
    ipcMain.handle('select-directory', async () => {
        try {
            const result = await dialog.showOpenDialog({
                properties: ['openDirectory']
            });
            if (result.canceled) {
                return { canceled: true };
            }
            return { canceled: false, path: result.filePaths[0] };
        } catch (error) {
            console.error('Error selecting directory:', error);
            return { error: error.message };
        }
    });

    // 选择文件
    ipcMain.handle('select-file', async (event, filters) => {
        try {
            const result = await dialog.showOpenDialog({
                properties: ['openFile'],
                filters: filters || []
            });
            if (result.canceled) {
                return { canceled: true };
            }
            return { canceled: false, path: result.filePaths[0] };
        } catch (error) {
            console.error('Error selecting file:', error);
            return { error: error.message };
        }
    });

    // 调整窗口大小
    ipcMain.handle('resize-window', async (event, width, height) => {
        try {
            const win = BrowserWindow.fromWebContents(event.sender);
            if (win) {
                win.setSize(width, height);
            }
            return { success: true };
        } catch (error) {
            console.error('Error resizing window:', error);
            return { error: error.message };
        }
    });

    // ==================== 添加游戏 ====================

    // 添加单个游戏
    ipcMain.handle('add-game', async (event, gameData) => {
        try {
            const settings = settingsService.getSettings();
            const gamesDir = getGamesDirPath(settings.library.gamesDir);

            // 处理封面图片（如果是 URL 或 base64 数据，则下载/保存为文件）
            let coverImagePath = null;
            if (gameData.coverImage) {
                // coverImage 可以是文件路径、base64 数据或 URL
                if (gameData.coverImage.startsWith('data:')) {
                    // base64 数据，需要保存到文件
                    const base64Data = gameData.coverImage.replace(/^data:image\/\w+;base64,/, '');
                    const ext = gameData.coverImage.match(/^data:image\/(\w+);base64,/)?.[1] || 'png';
                    const tempPath = path.join(APP_ROOT, 'temp_cover_' + Date.now() + '.' + ext);
                    fs.writeFileSync(tempPath, Buffer.from(base64Data, 'base64'));
                    coverImagePath = tempPath;
                } else if (gameData.coverImage.startsWith('http:') || gameData.coverImage.startsWith('https:')) {
                    // URL，需要下载到临时文件
                    console.log('[Add Game] Detected cover URL:', gameData.coverImage);
                    try {
                        coverImagePath = await downloadFileToTemp(gameData.coverImage);
                        console.log('[Add Game] Downloaded to:', coverImagePath);
                    } catch (downloadError) {
                        console.error('[Add Game] Failed to download cover image:', downloadError);
                        // 下载失败不影响游戏添加，只是不保存封面
                    }
                } else {
                    // 假设是本地文件路径
                    coverImagePath = gameData.coverImage;
                }
            }

            const result = await gameService.addGame(gameData, coverImagePath, gamesDir);

            // 删除临时文件
            if (coverImagePath && coverImagePath.includes('temp_cover_')) {
                require('fs').unlinkSync(coverImagePath);
            }

            // 通知主窗口刷新
            const mainWindow = getMainWindow();
            if (mainWindow) {
                mainWindow.webContents.send('refresh-library');
            }

            return result;
        } catch (error) {
            console.error('Error adding game:', error);
            return { error: error.message };
        }
    });

    // 批量导入游戏
    ipcMain.handle('batch-import-games', async (event, gamesData) => {
        try {
            const settings = settingsService.getSettings();
            const gamesDir = getGamesDirPath(settings.library.gamesDir);

            const result = await gameService.batchImportGames(gamesData, gamesDir);

            // 通知主窗口刷新
            const mainWindow = getMainWindow();
            if (mainWindow) {
                mainWindow.webContents.send('refresh-library');
            }

            return result;
        } catch (error) {
            console.error('Error batch importing games:', error);
            return { error: error.message };
        }
    });

    // 选择图片文件
    ipcMain.handle('select-image', async () => {
        try {
            const result = await dialog.showOpenDialog({
                properties: ['openFile'],
                filters: [
                    { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
                ]
            });
            if (result.canceled) {
                return { canceled: true };
            }
            return { canceled: false, path: result.filePaths[0] };
        } catch (error) {
            console.error('Error selecting image:', error);
            return { error: error.message };
        }
    });

    // 设置窗口最小尺寸
    ipcMain.handle('set-min-size', async (event, minWidth, minHeight) => {
        try {
            const win = BrowserWindow.fromWebContents(event.sender);
            if (win) {
                win.setMinimumSize(minWidth, minHeight);
            }
            return { success: true };
        } catch (error) {
            console.error('Error setting min size:', error);
            return { error: error.message };
        }
    });

    // ==================== IGDB 接口 ====================

    // 获取 IGDB 配置
    ipcMain.handle('get-igdb-config', async () => {
        try {
            const igdbConfig = settingsService.getIgdbConfig();
            return igdbConfig;
        } catch (error) {
            console.error('Error getting IGDB config:', error);
            return { error: error.message };
        }
    });

    // 保存 IGDB 配置
    ipcMain.handle('save-igdb-config', async (event, config) => {
        try {
            settingsService.setIgdbConfig(config);
            return { success: true };
        } catch (error) {
            console.error('Error saving IGDB config:', error);
            return { error: error.message };
        }
    });

    // 搜索 IGDB 游戏
    ipcMain.handle('igdb-search-games', async (event, gameName) => {
        try {
            const igdbConfig = settingsService.getIgdbConfig();

            if (!igdbConfig.clientId || !igdbConfig.clientSecret) {
                return { error: '请先配置 IGDB API 凭证（Client ID 和 Client Secret）' };
            }

            if (!gameName || gameName.trim() === '') {
                return { error: '请输入游戏名称' };
            }

            // 获取 token
            const accessToken = await igdbService.getAccessToken(
                igdbConfig.clientId,
                igdbConfig.clientSecret
            );

            // 搜索游戏
            const games = await igdbService.searchGames(
                accessToken,
                igdbConfig.clientId,
                gameName.trim()
            );

            return games;
        } catch (error) {
            console.error('Error searching IGDB games:', error);
            return { error: error.message };
        }
    });

    console.log('IPC handlers setup complete');
}

module.exports = { setupIpcHandlers };
