/**
 * SettingsService 单元测试
 */
const SettingsService = require('../src/main/services/SettingsService');
const path = require('path');
const fs = require('fs');

describe('SettingsService', () => {
    let settingsService;
    const testSettingsPath = path.join(__dirname, 'test-settings.json');

    beforeEach(() => {
        // 删除测试配置文件（如果存在）
        if (fs.existsSync(testSettingsPath)) {
            fs.unlinkSync(testSettingsPath);
        }

        // 使用测试配置文件路径
        settingsService = new SettingsService(testSettingsPath);
    });

    afterEach(() => {
        // 清理测试文件
        if (fs.existsSync(testSettingsPath)) {
            fs.unlinkSync(testSettingsPath);
        }
    });

    describe('constructor', () => {
        test('应该创建默认设置', () => {
            expect(settingsService.settings).toBeDefined();
            expect(settingsService.settings.version).toBeDefined();
        });
    });

    describe('getSettings', () => {
        test('应该返回完整设置对象', () => {
            const settings = settingsService.getSettings();

            expect(settings).toHaveProperty('appearance');
            expect(settings).toHaveProperty('layout');
            expect(settings).toHaveProperty('library');
            expect(settings).toHaveProperty('emulators');
            expect(settings).toHaveProperty('shortcuts');
        });
    });

    describe('getTheme / setTheme', () => {
        test('应该返回默认主题', () => {
            expect(settingsService.getTheme()).toBe('dark');
        });

        test('应该设置主题', () => {
            settingsService.setTheme('light');
            expect(settingsService.getTheme()).toBe('light');

            settingsService.setTheme('dark');
            expect(settingsService.getTheme()).toBe('dark');
        });
    });

    describe('getLayoutSettings / setLayoutSettings', () => {
        test('应该返回默认布局设置', () => {
            const layout = settingsService.getLayoutSettings();

            expect(layout.sidebarWidth).toBe(200);
            expect(layout.columns).toBe(6);
            expect(layout.viewMode).toBe('grid');
        });

        test('应该设置布局配置', () => {
            settingsService.setLayoutSettings({
                sidebarWidth: 250,
                columns: 8
            });

            const layout = settingsService.getLayoutSettings();
            expect(layout.sidebarWidth).toBe(250);
            expect(layout.columns).toBe(8);
        });
    });

    describe('getShortcuts / setShortcuts', () => {
        test('应该返回快捷键配置', () => {
            const shortcuts = settingsService.getShortcuts();

            expect(shortcuts.openSearch).toBeDefined();
            expect(shortcuts.launchGame).toBeDefined();
        });

        test('应该设置快捷键配置', () => {
            settingsService.setShortcuts({
                openSearch: 'CmdOrCtrl+Shift+F',
                customShortcut: 'CmdOrCtrl+Shift+X'
            });

            const shortcuts = settingsService.getShortcuts();
            expect(shortcuts.openSearch).toBe('CmdOrCtrl+Shift+F');
            expect(shortcuts.customShortcut).toBe('CmdOrCtrl+Shift+X');
        });
    });

    describe('getGamesDir / setGamesDir', () => {
        test('应该返回默认游戏目录', () => {
            const gamesDir = settingsService.getGamesDir();
            expect(gamesDir).toBeDefined();
            expect(typeof gamesDir).toBe('string');
        });

        test('应该设置游戏目录', () => {
            const newDir = 'D:\\Games\\MyGames';
            settingsService.setGamesDir(newDir);

            expect(settingsService.getGamesDir()).toBe(newDir);
        });
    });

    describe('getEmulatorPath / setEmulatorConfig / getEmulatorConfig', () => {
        test('应该返回配置的模拟器路径', () => {
            const emulatorPath = settingsService.getEmulatorPath('ps2');
            expect(emulatorPath).toBeDefined();
        });

        test('未配置的模拟器应该返回 null', () => {
            const emulatorPath = settingsService.getEmulatorPath('non-existent');
            expect(emulatorPath).toBeNull();
        });

        test('应该设置模拟器配置', () => {
            settingsService.setEmulatorConfig('custom', {
                name: 'Custom Emulator',
                path: 'C:\\Emulators\\custom.exe',
                arguments: '{gamePath}'
            });

            const config = settingsService.getEmulatorConfig('custom');
            expect(config.name).toBe('Custom Emulator');
            expect(config.path).toBe('C:\\Emulators\\custom.exe');
        });
    });

    describe('getLanguage / setLanguage', () => {
        test('应该返回默认语言', () => {
            expect(settingsService.getLanguage()).toBe('zh-CN');
        });

        test('应该设置语言', () => {
            settingsService.setLanguage('en-US');
            expect(settingsService.getLanguage()).toBe('en-US');

            settingsService.setLanguage('ja-JP');
            expect(settingsService.getLanguage()).toBe('ja-JP');
        });
    });

    describe('saveSettings / loadSettings', () => {
        test.skip('应该保存和加载设置', () => {
            // 修改设置
            settingsService.setTheme('light');
            settingsService.setLayoutSettings({ columns: 8 });
            settingsService.saveSettings(settingsService.settings);

            // 创建新的服务实例来加载保存的设置
            const newService = new SettingsService(testSettingsPath);

            expect(newService.getTheme()).toBe('light');
            expect(newService.getLayoutSettings().columns).toBe(8);
        });
    });

    describe('resetToDefaults', () => {
        test('应该重置为默认设置', () => {
            // 修改设置
            settingsService.setTheme('light');
            settingsService.setLayoutSettings({ columns: 10 });

            // 重置
            settingsService.resetToDefaults();

            expect(settingsService.getTheme()).toBe('dark');
            expect(settingsService.getLayoutSettings().columns).toBe(6);
        });
    });

    describe('mergeDeep', () => {
        test('应该深度合并对象', () => {
            const target = {
                a: 1,
                b: {
                    c: 2,
                    d: 3
                }
            };

            const source = {
                b: {
                    c: 10,
                    e: 4
                },
                f: 5
            };

            const result = settingsService.mergeDeep(target, source);

            expect(result.a).toBe(1);
            expect(result.b.c).toBe(10);
            expect(result.b.d).toBe(3);
            expect(result.b.e).toBe(4);
            expect(result.f).toBe(5);
        });
    });

    describe('exportSettings / importSettings', () => {
        test('应该导出和导入设置', () => {
            settingsService.setTheme('light');
            settingsService.setLayoutSettings({ columns: 8 });

            // 导出
            const exported = settingsService.exportSettings();
            const parsed = JSON.parse(exported);

            expect(parsed.appearance.theme).toBe('light');
            expect(parsed.layout.columns).toBe(8);

            // 导入到新实例
            const newService = new SettingsService(testSettingsPath);
            newService.importSettings(exported);

            expect(newService.getTheme()).toBe('light');
            expect(newService.getLayoutSettings().columns).toBe(8);
        });

        test('无效 JSON 应该抛出错误', () => {
            expect(() => {
                settingsService.importSettings('invalid json');
            }).toThrow(SyntaxError);
        });
    });
});
