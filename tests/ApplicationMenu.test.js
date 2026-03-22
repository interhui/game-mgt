/**
 * ApplicationMenu 单元测试
 * 测试应用菜单优化后的结构
 */

describe('ApplicationMenu 菜单结构测试', () => {
    let mockMenu;
    let mockMenuTemplate;
    let createApplicationMenu;
    let mainWindow;
    let mockLog;
    let mockWhenReadyPromise;

    beforeEach(() => {
        // 重置模块缓存
        jest.resetModules();

        // 创建待解决的 Promise
        mockWhenReadyPromise = Promise.resolve();

        // 模拟完整的 electron-log
        mockLog = {
            info: jest.fn(),
            error: jest.fn(),
            transports: {
                file: {
                    level: 'info',
                    resolvePathFn: jest.fn()
                }
            }
        };
        jest.doMock('electron-log', () => mockLog);

        // 模拟 BrowserWindow
        const mockMainWindowInstance = {
            once: jest.fn(),
            show: jest.fn(),
            maximize: jest.fn(),
            on: jest.fn(),
            loadFile: jest.fn(),
            webContents: {
                send: jest.fn()
            }
        };

        const mockBrowserWindow = jest.fn().mockImplementation(() => mockMainWindowInstance);

        // 捕获菜单模板
        mockMenuTemplate = null;
        mockMenu = {
            buildFromTemplate: jest.fn().mockImplementation((template) => {
                mockMenuTemplate = template;
                return mockMenu;
            }),
            setApplicationMenu: jest.fn()
        };

        // 模拟 electron 模块
        jest.doMock('electron', () => ({
            BrowserWindow: mockBrowserWindow,
            app: {
                getPath: jest.fn().mockReturnValue('/mock/userData'),
                whenReady: jest.fn().mockImplementation(() => mockWhenReadyPromise),
                on: jest.fn(),
                quit: jest.fn()
            },
            ipcMain: { handle: jest.fn() },
            Menu: mockMenu,
            dialog: { showMessageBox: jest.fn() }
        }));

        // 模拟 path 模块
        jest.doMock('path', () => ({
            join: jest.fn((...args) => args.join('/')),
            dirname: jest.fn()
        }));

        // 模拟 DatabaseService
        const mockDbService = {
            getDatabase: jest.fn().mockReturnValue({}),
            close: jest.fn()
        };
        jest.doMock('../src/main/services/DatabaseService', () => jest.fn().mockImplementation(() => mockDbService));

        // 模拟 SettingsService
        jest.doMock('../src/main/services/SettingsService', () => jest.fn().mockImplementation(() => ({
            getSettings: jest.fn().mockReturnValue({ emulators: {} })
        })));

        // 模拟其他服务
        jest.doMock('../src/main/services/FileService', () => jest.fn());
        jest.doMock('../src/main/services/GameService', () => jest.fn());
        jest.doMock('../src/main/services/BoxService', () => jest.fn());
        jest.doMock('../src/main/services/LauncherService', () => jest.fn());
        jest.doMock('../src/main/services/IgdbService', () => jest.fn());
        jest.doMock('../src/main/ipc-handlers', () => ({
            setupIpcHandlers: jest.fn()
        }));
        jest.doMock('../preload.js', () => ({}));

        mainWindow = mockMainWindowInstance;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('菜单结构验证', () => {
        test('菜单模板应包含"游戏"菜单', async () => {
            require('../main.js');
            await mockWhenReadyPromise;

            // 查找"游戏"菜单
            const gameMenu = mockMenuTemplate.find(item => item.label === '游戏');
            expect(gameMenu).toBeDefined();
        });

        test('"游戏"菜单应包含"刷新游戏库"项', async () => {
            require('../main.js');
            await mockWhenReadyPromise;

            const gameMenu = mockMenuTemplate.find(item => item.label === '游戏');
            const refreshItem = gameMenu.submenu.find(item => item.label === '刷新游戏库');
            expect(refreshItem).toBeDefined();
        });

        test('"游戏"菜单应包含"添加游戏"子菜单', async () => {
            require('../main.js');
            await mockWhenReadyPromise;

            const gameMenu = mockMenuTemplate.find(item => item.label === '游戏');
            const addGameItem = gameMenu.submenu.find(item => item.label === '添加游戏');
            expect(addGameItem).toBeDefined();
            expect(addGameItem.submenu).toBeDefined();
        });

        test('"添加游戏"子菜单应包含"手动添加"', async () => {
            require('../main.js');
            await mockWhenReadyPromise;

            const gameMenu = mockMenuTemplate.find(item => item.label === '游戏');
            const addGameItem = gameMenu.submenu.find(item => item.label === '添加游戏');
            const manualAddItem = addGameItem.submenu.find(item => item.label === '手动添加');
            expect(manualAddItem).toBeDefined();
        });

        test('"添加游戏"子菜单应包含"IGDB导入"', async () => {
            require('../main.js');
            await mockWhenReadyPromise;

            const gameMenu = mockMenuTemplate.find(item => item.label === '游戏');
            const addGameItem = gameMenu.submenu.find(item => item.label === '添加游戏');
            const igdbImportItem = addGameItem.submenu.find(item => item.label === 'IGDB导入');
            expect(igdbImportItem).toBeDefined();
        });

        test('"添加游戏"子菜单应包含"JSON导入"', async () => {
            require('../main.js');
            await mockWhenReadyPromise;

            const gameMenu = mockMenuTemplate.find(item => item.label === '游戏');
            const addGameItem = gameMenu.submenu.find(item => item.label === '添加游戏');
            const jsonImportItem = addGameItem.submenu.find(item => item.label === 'JSON导入');
            expect(jsonImportItem).toBeDefined();
        });

        test('"游戏"菜单应包含"设置"项', async () => {
            require('../main.js');
            await mockWhenReadyPromise;

            const gameMenu = mockMenuTemplate.find(item => item.label === '游戏');
            const settingsItem = gameMenu.submenu.find(item => item.label === '设置');
            expect(settingsItem).toBeDefined();
        });

        test('"游戏"菜单应包含"退出"项', async () => {
            require('../main.js');
            await mockWhenReadyPromise;

            const gameMenu = mockMenuTemplate.find(item => item.label === '游戏');
            const quitItem = gameMenu.submenu.find(item => item.role === 'quit');
            expect(quitItem).toBeDefined();
        });

        test('"游戏"菜单不应包含"文件"菜单', async () => {
            require('../main.js');
            await mockWhenReadyPromise;

            const fileMenu = mockMenuTemplate.find(item => item.label === '文件');
            expect(fileMenu).toBeUndefined();
        });

        test('"视图"菜单应包含"重新加载"中文标签', async () => {
            require('../main.js');
            await mockWhenReadyPromise;

            const viewMenu = mockMenuTemplate.find(item => item.label === '视图');
            const reloadItem = viewMenu.submenu.find(item => item.label === '重新加载');
            expect(reloadItem).toBeDefined();
        });
    });

    describe('菜单功能验证', () => {
        test('"刷新游戏库"点击应发送 refresh-library 事件', async () => {
            require('../main.js');
            await mockWhenReadyPromise;

            const gameMenu = mockMenuTemplate.find(item => item.label === '游戏');
            const refreshItem = gameMenu.submenu.find(item => item.label === '刷新游戏库');

            // 执行点击
            refreshItem.click();

            expect(mainWindow.webContents.send).toHaveBeenCalledWith('refresh-library');
        });

        test('"手动添加"点击应发送 open-add-game 事件', async () => {
            require('../main.js');
            await mockWhenReadyPromise;

            const gameMenu = mockMenuTemplate.find(item => item.label === '游戏');
            const addGameItem = gameMenu.submenu.find(item => item.label === '添加游戏');
            const manualAddItem = addGameItem.submenu.find(item => item.label === '手动添加');

            // 执行点击
            manualAddItem.click();

            expect(mainWindow.webContents.send).toHaveBeenCalledWith('open-add-game');
        });

        test('"IGDB导入"点击应发送 open-igdb-import 事件', async () => {
            require('../main.js');
            await mockWhenReadyPromise;

            const gameMenu = mockMenuTemplate.find(item => item.label === '游戏');
            const addGameItem = gameMenu.submenu.find(item => item.label === '添加游戏');
            const igdbImportItem = addGameItem.submenu.find(item => item.label === 'IGDB导入');

            // 执行点击
            igdbImportItem.click();

            expect(mainWindow.webContents.send).toHaveBeenCalledWith('open-igdb-import');
        });

        test('"JSON导入"点击应发送 open-json-import 事件', async () => {
            require('../main.js');
            await mockWhenReadyPromise;

            const gameMenu = mockMenuTemplate.find(item => item.label === '游戏');
            const addGameItem = gameMenu.submenu.find(item => item.label === '添加游戏');
            const jsonImportItem = addGameItem.submenu.find(item => item.label === 'JSON导入');

            // 执行点击
            jsonImportItem.click();

            expect(mainWindow.webContents.send).toHaveBeenCalledWith('open-json-import');
        });

        test('"设置"点击应发送 open-settings 事件', async () => {
            require('../main.js');
            await mockWhenReadyPromise;

            const gameMenu = mockMenuTemplate.find(item => item.label === '游戏');
            const settingsItem = gameMenu.submenu.find(item => item.label === '设置');

            // 执行点击
            settingsItem.click();

            expect(mainWindow.webContents.send).toHaveBeenCalledWith('open-settings');
        });
    });

    describe('菜单顺序验证', () => {
        test('菜单顺序应为: 游戏、视图、帮助', async () => {
            require('../main.js');
            await mockWhenReadyPromise;

            expect(mockMenuTemplate[0].label).toBe('游戏');
            expect(mockMenuTemplate[1].label).toBe('视图');
            expect(mockMenuTemplate[2].label).toBe('帮助');
        });

        test('"游戏"菜单应包含刷新游戏库、添加游戏、设置、退出', async () => {
            require('../main.js');
            await mockWhenReadyPromise;

            const gameMenu = mockMenuTemplate.find(item => item.label === '游戏');
            const submenuLabels = gameMenu.submenu.map(item => item.label || item.role);

            // 检查菜单项存在: 刷新游戏库、添加游戏、设置、退出
            expect(submenuLabels).toContain('刷新游戏库');
            expect(submenuLabels).toContain('添加游戏');
            expect(submenuLabels).toContain('设置');
            expect(submenuLabels).toContain('退出');

            // 检查有3个分隔符
            const separators = gameMenu.submenu.filter(item => item.type === 'separator');
            expect(separators.length).toBe(3);
        });
    });
});
