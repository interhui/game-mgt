# 游戏管理程序 - 代码结构

## 1. 项目结构

```
game-mgt/
├── main.js                 # Electron 主进程入口
├── preload.js              # 预加载脚本（暴露 API）
├── package.json            # 项目配置
├── src/
│   ├── main/               # 主进程代码
│   │   ├── ipc-handlers.js # IPC 处理器
│   │   └── services/        # 服务层
│   │       ├── FileService.js
│   │       ├── GameService.js
│   │       ├── BoxService.js
│   │       ├── DatabaseService.js
│   │       ├── SettingsService.js
│   │       ├── LauncherService.js
│   │       └── TagService.js
│   └── renderer/            # 渲染进程代码
│       ├── index.html       # 主页面
│       ├── detail.html      # 游戏详情页
│       ├── box.html         # 游戏盒子页
│       ├── css/             # 样式文件
│       └── js/              # JavaScript 文件
├── config/                 # 配置文件
│   ├── settings.json       # 应用设置
│   └── platforms.json      # 平台配置
├── games/                  # 游戏目录
└── boxes/                  # 游戏盒子目录
```

## 2. 主进程 (main.js)

### 2.1 窗口管理

```javascript
// 创建主窗口
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    mainWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'index.html'));
}

// 创建游戏详情窗口
function createGameDetailWindow(gameData) {
    detailWindow = new BrowserWindow({
        width: 800,
        height: 680,
        frame: false,
        webPreferences: { ... }
    });
    detailWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'detail.html'));
    detailWindow.once('ready-to-show', () => {
        detailWindow.webContents.send('load-game-detail', gameData);
    });
}

// 创建游戏盒子窗口
function createBoxWindow(boxName) {
    boxWindow = new BrowserWindow({ ... });
    boxWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'box.html'), {
        query: { name: boxName }
    });
}
```

### 2.2 服务初始化

```javascript
function initializeServices() {
    fileService = new FileService();
    gameService = new GameService();
    dbService = new DatabaseService(...);
    settingsService = new SettingsService(...);
    launcherService = new LauncherService(...);
    tagService = new TagService(...);
    boxService = new BoxService();
}
```

## 3. 预加载脚本 (preload.js)

通过 contextBridge 安全暴露 API：

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
    // 游戏查询
    getPlatforms: () => ipcRenderer.invoke('get-platforms'),
    getGamesByPlatform: (filters) => ipcRenderer.invoke('get-games-by-platform', filters),
    searchGames: (params) => ipcRenderer.invoke('search-games', params),
    getAllGames: (filters) => ipcRenderer.invoke('get-all-games', filters),
    getGameDetail: (gameId) => ipcRenderer.invoke('get-game-detail', gameId),

    // 游戏盒子
    getAllBoxes: () => ipcRenderer.invoke('get-all-boxes'),
    createBox: (boxName) => ipcRenderer.invoke('create-box', boxName),
    addGameToBox: (data) => ipcRenderer.invoke('add-game-to-box', data),
    removeGameFromBox: (data) => ipcRenderer.invoke('remove-game-from-box', data),
    updateGameInBox: (data) => ipcRenderer.invoke('update-game-in-box', data),

    // 窗口管理
    openGameDetail: (gameData) => ipcRenderer.invoke('open-game-detail', gameData),
    openBoxWindow: (boxName) => ipcRenderer.invoke('open-box-window', boxName),

    // 事件监听
    onLoadGameDetail: (callback) => { ... },
    onBoxUpdated: (callback) => { ... },
    onRefreshLibrary: (callback) => { ... }
});
```

## 4. IPC 处理器 (ipc-handlers.js)

### 4.1 游戏查询

```javascript
// 获取所有平台
ipcMain.handle('get-platforms', async () => {
    const platforms = await fileService.getSimulatorFolders(gamesDir);
    const stats = await gameService.getPlatformStats(platforms, gamesDir);
    return stats;
});

// 获取游戏详情
ipcMain.handle('get-game-detail', async (event, gameId) => {
    const detail = await gameService.getGameDetail(gameId, gamesDir);
    return detail;
});

// 搜索游戏
ipcMain.handle('search-games', async (event, params) => {
    const games = await gameService.searchGames(keyword, gamesDir, filters);
    return games;
});
```

### 4.2 游戏盒子管理

```javascript
// 获取所有盒子
ipcMain.handle('get-all-boxes', async () => {
    const boxes = await boxService.getAllBoxes(gameboxDir);
    return boxes;
});

// 添加游戏到盒子
ipcMain.handle('add-game-to-box', async (event, data) => {
    const result = await boxService.addGameToBox(boxName, platform, gameInfo, gameboxDir);
    notifyBoxUpdated();
    return result;
});

// 更新盒子中游戏状态
ipcMain.handle('update-game-in-box', async (event, data) => {
    const result = await boxService.updateGameInBox(boxName, platform, gameId, gameInfo, gameboxDir);
    notifyBoxUpdated();
    return result;
});
```

## 5. 服务层

### 5.1 GameService (GameService.js)

```javascript
// 获取所有平台及其游戏列表
async getAllPlatforms(gamesDir) { ... }

// 获取指定平台的游戏列表
async getGamesByPlatform(platform, gamesDir, options = {}) { ... }

// 搜索游戏
async searchGames(keyword, gamesDir, filters = {}) { ... }

// 获取游戏详情
async getGameDetail(gameId, gamesDir) { ... }

// 生成完整的游戏数据对象
generateGameData(gameData, folderName, platform, folderPath) {
    return {
        id: gameData.id || `${platform}-${folderName}`,
        gameId: this.generateGameId(platform, gameData.name || folderName),
        name: gameData.name || folderName,
        description: gameData.description || '',
        platform: platform,
        favorite: gameData.favorite || false,
        userRating: gameData.userRating || 0,
        tags: gameData.tags || [],
        path: folderPath,
        folderName: folderName
    };
}

// 生成游戏ID
generateGameId(platform, gameName) {
    const normalizedName = gameName.toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    return `${platform}-${normalizedName}`;
}
```

### 5.2 BoxService (BoxService.js)

```javascript
// 获取所有游戏盒子
async getAllBoxes(gameboxDir) { ... }

// 读取盒子文件
async readBoxFile(boxesDir, boxName) {
    const content = await this.fileService.readFile(filePath);
    if (!content || content.trim() === '') {
        return {};  // 空文件返回空对象
    }
    return JSON.parse(content);
}

// 创建游戏盒子
async createBox(boxName, gameboxDir) { ... }

// 添加游戏到盒子
async addGameToBox(boxName, platform, gameInfo, gameboxDir) {
    let boxData = await this.readBoxFile(boxesDir, boxName);
    if (!boxData[platform]) {
        boxData[platform] = [];
    }
    boxData[platform].push({
        id: gameInfo.id,
        status: gameInfo.status || 'unplayed',
        firstPlayed: gameInfo.firstPlayed || '',
        lastPlayed: gameInfo.lastPlayed || '',
        totalPlayTime: gameInfo.totalPlayTime || 0,
        playCount: gameInfo.playCount || 0
    });
    await this.fileService.writeFile(boxPath, JSON.stringify(boxData, null, 2));
}

// 更新盒子中游戏的状态
async updateGameInBox(boxName, platform, gameId, gameInfo, gameboxDir) { ... }

// 从盒子中移除游戏
async removeGameFromBox(boxName, platform, gameId, gameboxDir) { ... }
```

### 5.3 SettingsService (SettingsService.js)

```javascript
// 获取完整配置
getSettings() {
    return this.settings;
}

// 获取游戏目录
getGamesDir() {
    return this.settings.library.gamesDir;
}

// 获取游戏盒子目录
getGameboxDir() {
    return this.settings.gamebox.gameboxDir;
}

// 获取模拟器配置
getEmulatorConfig(platform) {
    return this.settings.emulators[platform] || null;
}
```

## 6. 渲染进程 JavaScript

### 6.1 main.js (主界面逻辑)

```javascript
// 状态管理
const state = {
    platforms: [],
    boxes: [],
    games: [],
    currentPlatform: '',
    currentBox: '',
    searchKeyword: '',
    viewMode: 'grid',
    selectedGames: new Set()
};

// 统一设置当前平台（联动侧边栏和下拉框）
function setCurrentPlatform(platform) {
    state.currentPlatform = platform;
    // 更新侧边栏选中状态
    document.querySelectorAll('.platform-item').forEach(item => {
        if (item.dataset.platform === platform) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    // 更新下拉框
    elements.platformFilter.value = platform;
    // 加载游戏
    loadGames();
}

// 加载游戏
async function loadGames() {
    if (state.searchKeyword) {
        games = await window.electronAPI.searchGames({ ... });
    } else if (state.currentPlatform) {
        games = await window.electronAPI.getGamesByPlatform({ ... });
    } else {
        games = await window.electronAPI.getAllGames({ ... });
    }
    renderGames(games);
}
```

### 6.2 box.js (游戏盒子逻辑)

```javascript
// 状态管理
const state = {
    boxName: '',
    boxData: null,
    games: [],
    platforms: [],
    currentPlatform: '',
    currentStatus: '',
    searchKeyword: '',
    viewMode: 'grid',
    selectedGames: new Set()
};

// 从盒子数据加载游戏
async function loadGamesFromBox(boxData) {
    const allGames = await window.electronAPI.getAllGames({});
    for (const [platform, platformGames] of Object.entries(boxData)) {
        for (const boxGame of platformGames) {
            const game = allGames.find(g => g.gameId === boxGame.id && g.platform === platform);
            if (game) {
                games.push({
                    ...game,
                    boxStatus: boxGame.status,
                    boxFirstPlayed: boxGame.firstPlayed,
                    boxLastPlayed: boxGame.lastPlayed,
                    boxTotalPlayTime: boxGame.totalPlayTime,
                    boxPlayCount: boxGame.playCount
                });
            }
        }
    }
}

// 批量移除游戏
async function batchRemoveGames() {
    for (const gameId of state.selectedGames) {
        await window.electronAPI.removeGameFromBox({ ... });
    }
    state.selectedGames.clear();
    await loadBoxData();
}
```

### 6.3 detail.js (游戏详情逻辑)

```javascript
// 加载游戏详情
function loadGameDetail(game) {
    currentGame = game;
    fromBox = game.fromBox || false;
    boxName = game.boxName || '';

    if (fromBox) {
        // 盒子模式：显示盒子特有信息和按钮
        elements.normalActions.style.display = 'none';
        elements.boxActions.style.display = 'flex';
        elements.boxInfoSection.style.display = 'block';
        // 显示游戏状态、游戏时间、最后游戏
    }
}

// 进入编辑模式
function enterEditMode() {
    isEditMode = true;
    // 将显示元素转换为输入框
    elements.gameTitleContainer.innerHTML = `<input type="text" id="edit-name" ...>`;
    // 禁用普通按钮，显示编辑按钮
    elements.normalActions.style.display = 'none';
    elements.editActions.style.display = 'flex';
}

// 保存编辑
async function saveEdit() {
    const result = await window.electronAPI.saveGameEdit(updatedData);
    if (!result.error) {
        currentGame = updatedData;
        exitEditMode();
    }
}
```

## 7. 关键数据结构

### 7.1 游戏数据 (game.json)

```javascript
{
    id: "ps2-gta-san-andreas",      // 游戏唯一标识
    name: "GTA: San Andreas",       // 游戏名称
    description: "游戏描述...",      // 游戏描述
    publishDate: "2004-10-26",     // 发行日期
    platform: "ps2",               // 游戏平台
    status: "completed",           // 游戏状态
    playCount: 15,                 // 游玩次数
    totalPlayTime: 3600,           // 总游戏时长（分钟）
    lastPlayed: "2024-02-15",      // 最后游玩日期
    firstPlayed: "2024-01-01",     // 首次游玩日期
    favorite: true,                // 是否收藏
    userRating: 5,                // 用户评分（1-5）
    userComment: "经典中的经典！",  // 用户评论
    tags: ["action", "adventure"], // 标签
    customTags: ["必玩", "神作"],   // 自定义标签
    developer: "Rockstar Games",   // 开发商
    publisher: "Rockstar Games",    // 发行商
    genre: ["action", "adventure"] // 游戏类型
}
```

### 7.2 盒子游戏数据

```javascript
{
    id: "ps2-gta-san-andreas",      // 游戏ID（对应游戏目录）
    status: "unplayed",            // 盒子中的游戏状态
    firstPlayed: "",               // 首次游玩（盒子内）
    lastPlayed: "",                // 最后游玩（盒子内）
    totalPlayTime: 0,             // 总游戏时长（分钟）
    playCount: 0                  // 游玩次数
}
```
