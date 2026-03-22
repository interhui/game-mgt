/**
 * MainWindow 单元测试
 * 测试主窗口启动最大化的功能
 */

describe('MainWindow 窗口最大化功能', () => {
    let mockBrowserWindow;
    let mockMainWindow;
    let mockLog;
    let mockWhenReadyPromise;
    let mockWhenReadyFn;

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
        mockMainWindow = {
            once: jest.fn(),
            show: jest.fn(),
            maximize: jest.fn(),
            on: jest.fn(),
            loadFile: jest.fn()
        };

        mockBrowserWindow = jest.fn().mockImplementation(() => mockMainWindow);

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
            Menu: { buildFromTemplate: jest.fn(), setApplicationMenu: jest.fn() },
            dialog: { showMessageBox: jest.fn() }
        }));

        // 模拟 path 模块
        jest.doMock('path', () => ({
            join: jest.fn((...args) => args.join('/')),
            dirname: jest.fn()
        }));

        // 模拟 DatabaseService - 必须有 getDatabase 方法
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

        // 模拟 ipc-handlers - 必须导出 setupIpcHandlers 函数
        jest.doMock('../src/main/ipc-handlers', () => ({
            setupIpcHandlers: jest.fn()
        }));

        jest.doMock('../preload.js', () => ({}));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createMainWindow 函数行为', () => {
        test('BrowserWindow 实例化时应传入正确的配置参数', async () => {
            // 重新加载 main.js 以获取 createMainWindow 函数
            require('../main.js');

            // 等待 whenReady 的 then 执行
            await mockWhenReadyPromise;

            // 验证 BrowserWindow 构造函数被调用
            expect(mockBrowserWindow).toHaveBeenCalled();

            // 获取调用参数
            const windowConfig = mockBrowserWindow.mock.calls[0][0];

            // 验证配置参数
            expect(windowConfig.width).toBe(1280);
            expect(windowConfig.height).toBe(800);
            expect(windowConfig.minWidth).toBe(800);
            expect(windowConfig.minHeight).toBe(600);
            expect(windowConfig.title).toBe('游戏管理程序');
            expect(windowConfig.show).toBe(false);
        });

        test('ready-to-show 事件处理器应调用 show() 和 maximize()', async () => {
            require('../main.js');

            // 等待 whenReady 的 then 执行
            await mockWhenReadyPromise;

            // 获取 once 的调用参数
            const onceCall = mockMainWindow.once.mock.calls.find(
                call => call[0] === 'ready-to-show'
            );

            expect(onceCall).toBeDefined();

            // 执行 ready-to-show 回调
            const readyToShowCallback = onceCall[1];
            readyToShowCallback();

            // 验证 show() 被调用
            expect(mockMainWindow.show).toHaveBeenCalled();

            // 验证 maximize() 被调用
            expect(mockMainWindow.maximize).toHaveBeenCalled();
        });

        test('ready-to-show 事件处理器应记录日志', async () => {
            require('../main.js');

            // 等待 whenReady 的 then 执行
            await mockWhenReadyPromise;

            // 获取 once 的调用参数
            const onceCall = mockMainWindow.once.mock.calls.find(
                call => call[0] === 'ready-to-show'
            );

            // 执行 ready-to-show 回调
            const readyToShowCallback = onceCall[1];
            readyToShowCallback();

            // 验证日志记录
            expect(mockLog.info).toHaveBeenCalledWith('Main window displayed and maximized');
        });

        test('窗口关闭事件应正确处理', async () => {
            require('../main.js');

            // 等待 whenReady 的 then 执行
            await mockWhenReadyPromise;

            // 获取 on 的调用参数 (closed 事件)
            const onCall = mockMainWindow.on.mock.calls.find(
                call => call[0] === 'closed'
            );

            expect(onCall).toBeDefined();
        });

        test('loadFile 应加载正确的 HTML 文件', async () => {
            require('../main.js');

            // 等待 whenReady 的 then 执行
            await mockWhenReadyPromise;

            expect(mockMainWindow.loadFile).toHaveBeenCalled();

            // 获取 loadFile 调用参数
            const loadFileCall = mockMainWindow.loadFile.mock.calls[0];
            expect(loadFileCall[0]).toContain('index.html');
        });
    });

    describe('窗口最大化逻辑验证', () => {
        test('maximize() 应在 show() 之后调用', async () => {
            require('../main.js');

            // 等待 whenReady 的 then 执行
            await mockWhenReadyPromise;

            // 获取 once 的调用参数
            const onceCall = mockMainWindow.once.mock.calls.find(
                call => call[0] === 'ready-to-show'
            );

            // 执行 ready-to-show 回调
            const readyToShowCallback = onceCall[1];
            readyToShowCallback();

            // 验证调用顺序: show() 在 maximize() 之前
            const callOrder = [
                mockMainWindow.show.mock.invocationCallOrder,
                mockMainWindow.maximize.mock.invocationCallOrder
            ];

            expect(callOrder[0] < callOrder[1]).toBe(true);
        });

        test('once 事件处理器只应注册一次', async () => {
            require('../main.js');

            // 等待 whenReady 的 then 执行
            await mockWhenReadyPromise;

            // 获取 once 的调用次数
            const onceCalls = mockMainWindow.once.mock.calls.filter(
                call => call[0] === 'ready-to-show'
            );

            // once 只应被调用一次
            expect(onceCalls.length).toBe(1);
        });
    });
});
