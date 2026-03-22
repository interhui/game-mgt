/**
 * Electron 主进程入口文件
 * 游戏管理程序主入口
 */
const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const log = require('electron-log');

// 配置日志
log.transports.file.level = 'info';
log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs', 'main.log');

// 引入服务
const FileService = require('./src/main/services/FileService');
const GameService = require('./src/main/services/GameService');
const BoxService = require('./src/main/services/BoxService');
const DatabaseService = require('./src/main/services/DatabaseService');
const SettingsService = require('./src/main/services/SettingsService');
const LauncherService = require('./src/main/services/LauncherService');
const IgdbService = require('./src/main/services/IgdbService');
const { setupIpcHandlers } = require('./src/main/ipc-handlers');

// 全局变量
let mainWindow = null;
let detailWindow = null;

// 服务实例
let fileService = null;
let gameService = null;
let dbService = null;
let settingsService = null;
let launcherService = null;
let boxService = null;
let igdbService = null;

/**
 * 初始化服务
 */
function initializeServices() {
    const userDataPath = app.getPath('userData');

    fileService = new FileService();
    gameService = new GameService();
    dbService = new DatabaseService(path.join(userDataPath, 'database', 'games.db'));
    settingsService = new SettingsService(path.join(__dirname, 'config', 'settings.json'));
    launcherService = new LauncherService(settingsService.getSettings().emulators || {});
    boxService = new BoxService();
    igdbService = new IgdbService();

    log.info('Services initialized successfully');
}

/**
 * 创建主窗口
 */
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: '游戏管理程序',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        },
        show: false
    });

    // 加载主界面
    mainWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'index.html'));

    // 显示窗口后ready-to-show
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.maximize();
        log.info('Main window displayed and maximized');
    });

    // 窗口关闭事件
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // 创建菜单
    createApplicationMenu();
}

/**
 * 创建应用菜单
 */
function createApplicationMenu() {
    const template = [
        {
            label: '游戏',
            submenu: [
                {
                    label: '添加游戏',
                    submenu: [
                        {
                            label: '手动添加',
                            accelerator: 'CmdOrCtrl+N',
                            click: () => {
                                if (mainWindow) {
                                    mainWindow.webContents.send('open-add-game');
                                }
                            }
                        },
                        {
                            label: 'IGDB导入',
                            accelerator: 'CmdOrCtrl+I',
                            click: () => {
                                if (mainWindow) {
                                    mainWindow.webContents.send('open-igdb-import');
                                }
                            }
                        },
                        {
                            label: 'JSON导入',
                            click: () => {
                                if (mainWindow) {
                                    mainWindow.webContents.send('open-json-import');
                                }
                            }
                        }
                    ]
                },
                { type: 'separator' },
                {
                    label: '刷新游戏库',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('refresh-library');
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: '设置',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('open-settings');
                        }
                    }
                },
                { type: 'separator' },
                { label: '退出', role: 'quit' }
            ]
        },
        {
            label: '视图',
            submenu: [
                {
                    label: '重新加载',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('refresh-library');
                        }
                    }
                },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: '帮助',
            submenu: [
                {
                    label: '关于',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: '关于',
                            message: '游戏管理程序 v1.0.0',
                            detail: '基于 Electron 的模拟器游戏管理工具'
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

/**
 * 创建游戏详情窗口
 * @param {Object} gameData - 游戏数据
 */
function createGameDetailWindow(gameData) {
    if (detailWindow) {
        detailWindow.focus();
        detailWindow.webContents.send('load-game-detail', gameData);
        return;
    }

    detailWindow = new BrowserWindow({
        width: 800,
        height: 680,
        minWidth: 600,
        minHeight: 580,
        frame: false,
        title: '游戏详情',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        },
        show: false
    });

    detailWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'detail.html'));

    detailWindow.once('ready-to-show', () => {
        detailWindow.show();
        detailWindow.webContents.send('load-game-detail', gameData);
    });

    detailWindow.on('closed', () => {
        detailWindow = null;
    });
}

/**
 * 创建游戏盒子窗口
 */
let boxWindow = null;

function createBoxWindow(boxName) {
    if (boxWindow) {
        boxWindow.focus();
        return;
    }

    boxWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: `游戏盒子 - ${boxName}`,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        },
        show: false
    });

    boxWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'box.html'), {
        query: { name: boxName }
    });

    boxWindow.once('ready-to-show', () => {
        boxWindow.show();
    });

    boxWindow.on('closed', () => {
        boxWindow = null;
    });
}

// 全局异常处理
process.on('uncaughtException', (error) => {
    log.error('Uncaught Exception:', error);
    dialog.showErrorBox('错误', `发生未处理的错误: ${error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
    log.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// App 事件
app.whenReady().then(() => {
    log.info('App starting...');

    // 初始化服务
    initializeServices();

    // 设置 IPC 处理器
    setupIpcHandlers({
        fileService,
        gameService,
        dbService,
        settingsService,
        launcherService,
        boxService,
        igdbService,
        getMainWindow: () => mainWindow,
        createGameDetailWindow,
        createBoxWindow
    });

    // 创建主窗口
    createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });

    log.info('App started successfully');
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    log.info('App quitting...');
    if (dbService) {
        dbService.close();
    }
});

module.exports = { mainWindow, detailWindow };
