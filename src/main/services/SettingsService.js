/**
 * 配置服务
 * 负责应用配置的读取、保存和管理
 */
const FileService = require('./FileService');
const path = require('path');

class SettingsService {
    constructor(settingsPath) {
        this.settingsPath = settingsPath;
        this.fileService = new FileService();
        this.settings = null;
        this.loadSettings();
    }

    /**
     * 加载配置
     */
    loadSettings() {
        try {
            const defaultSettings = this.getDefaultSettings();
            const settings = this.fileService.readJson(this.settingsPath);

            if (settings) {
                // 合并默认配置和用户配置
                this.settings = this.mergeDeep(defaultSettings, settings);
            } else {
                // 使用默认配置
                this.settings = defaultSettings;
                // 保存默认配置
                this.saveSettings(this.settings);
            }

            return this.settings;
        } catch (error) {
            console.error('Error loading settings:', error);
            this.settings = this.getDefaultSettings();
            return this.settings;
        }
    }

    /**
     * 保存配置
     * @param {object} newSettings - 新配置
     */
    saveSettings(newSettings) {
        try {
            this.settings = { ...this.settings, ...newSettings };
            this.fileService.writeJson(this.settingsPath, this.settings);
        } catch (error) {
            console.error('Error saving settings:', error);
            throw error;
        }
    }

    /**
     * 获取完整配置
     * @returns {object} 配置对象
     */
    getSettings() {
        return this.settings;
    }

    /**
     * 获取主题设置
     * @returns {string} 主题名称（dark/light）
     */
    getTheme() {
        return this.settings.appearance.theme || 'dark';
    }

    /**
     * 设置主题
     * @param {string} theme - 主题名称
     */
    setTheme(theme) {
        this.settings.appearance.theme = theme;
        this.saveSettings(this.settings);
    }

    /**
     * 获取布局设置
     * @returns {object} 布局配置
     */
    getLayoutSettings() {
        return this.settings.layout || {};
    }

    /**
     * 设置布局配置
     * @param {object} layout - 布局配置
     */
    setLayoutSettings(layout) {
        this.settings.layout = { ...this.settings.layout, ...layout };
        this.saveSettings(this.settings);
    }

    /**
     * 获取快捷键配置
     * @returns {object} 快捷键配置
     */
    getShortcuts() {
        return this.settings.shortcuts || {};
    }

    /**
     * 设置快捷键配置
     * @param {object} shortcuts - 快捷键配置
     */
    setShortcuts(shortcuts) {
        this.settings.shortcuts = { ...this.settings.shortcuts, ...shortcuts };
        this.saveSettings(this.settings);
    }

    /**
     * 获取游戏目录配置
     * @returns {string} 游戏目录路径
     */
    getGamesDir() {
        return this.settings.library.gamesDir || path.join(__dirname, '..', 'games');
    }

    /**
     * 设置游戏目录
     * @param {string} dir - 游戏目录路径
     */
    setGamesDir(dir) {
        this.settings.library.gamesDir = dir;
        this.saveSettings(this.settings);
    }

    /**
     * 获取模拟器路径
     * @param {string} platform - 平台标识
     * @returns {string} 模拟器路径
     */
    getEmulatorPath(platform) {
        const emulator = this.settings.emulators[platform];
        return emulator ? emulator.path : null;
    }

    /**
     * 获取模拟器配置
     * @param {string} platform - 平台标识
     * @returns {object} 模拟器配置
     */
    getEmulatorConfig(platform) {
        return this.settings.emulators[platform] || null;
    }

    /**
     * 设置模拟器配置
     * @param {string} platform - 平台标识
     * @param {object} config - 模拟器配置
     */
    setEmulatorConfig(platform, config) {
        this.settings.emulators[platform] = config;
        this.saveSettings(this.settings);
    }

    /**
     * 获取语言设置
     * @returns {string} 语言代码
     */
    getLanguage() {
        return this.settings.appearance.language || 'zh-CN';
    }

    /**
     * 设置语言
     * @param {string} language - 语言代码
     */
    setLanguage(language) {
        this.settings.appearance.language = language;
        this.saveSettings(this.settings);
    }

    /**
     * 获取默认配置
     * @returns {object} 默认配置
     */
    getDefaultSettings() {
        return {
            version: '1.0.0',
            lastUpdate: Date.now(),

            appearance: {
                theme: 'dark',
                language: 'zh-CN',
                showPlatformIcons: true,
                showDescriptions: true,
                enableAnimations: true
            },

            layout: {
                sidebarWidth: 200,
                posterSize: 'medium',
                columns: 6,
                viewMode: 'grid',
                sortBy: 'name-asc',
                sortOrder: 'asc'
            },

            library: {
                gamesDir: path.join(__dirname, '..', '..', 'games'),
                scanOnStartup: true,
                autoRefresh: false,
                showHiddenFiles: false,
                includeSubfolders: true
            },

            emulators: {
                ps2: {
                    name: 'PCSX2',
                    path: 'C:\\Emulators\\PCSX2\\pcsx2.exe',
                    arguments: '-boot {gamePath}'
                },
                ps1: {
                    name: 'DuckStation',
                    path: 'C:\\Emulators\\DuckStation\\duckstation.exe',
                    arguments: '-batchmode -cdrom {gamePath}'
                },
                psp: {
                    name: 'PPSSPP',
                    path: 'C:\\Emulators\\PPSSPP\\PPSSPPSDL.exe',
                    arguments: '-boot {gamePath}'
                },
                xbox360: {
                    name: 'Xenia',
                    path: 'C:\\Emulators\\Xenia\\xenia.exe',
                    arguments: '--game {gamePath}'
                },
                switch: {
                    name: 'Ryujinx',
                    path: 'C:\\Emulators\\Ryujinx\\ryujinx.exe',
                    arguments: '{gamePath}'
                }
            },

            shortcuts: {
                openSearch: 'Ctrl+F',
                focusSearch: 'Ctrl+K',
                launchGame: 'Enter',
                gameDetails: 'Ctrl+D',
                editGame: 'Ctrl+E',
                deleteGame: 'Delete',
                toggleFavorite: 'F',
                refreshLibrary: 'R',
                openSettings: 'Ctrl+Comma'
            },

            notifications: {
                enableStartup: true,
                enableLibraryUpdate: true,
                showPlayReminders: true
            },

            import: {
                autoImport: false,
                importPaths: []
            }
        };
    }

    /**
     * 深度合并对象
     * @param {object} target - 目标对象
     * @param {object} source - 源对象
     * @returns {object} 合并后的对象
     */
    mergeDeep(target, source) {
        const output = { ...target };

        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target)) {
                        output[key] = source[key];
                    } else {
                        output[key] = this.mergeDeep(target[key], source[key]);
                    }
                } else {
                    output[key] = source[key];
                }
            });
        }

        return output;
    }

    /**
     * 检查是否为对象
     * @param {any} item - 要检查的值
     * @returns {boolean} 是否为对象
     */
    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    /**
     * 重置为默认配置
     */
    resetToDefaults() {
        this.settings = this.getDefaultSettings();
        this.saveSettings(this.settings);
    }

    /**
     * 导出配置
     * @returns {string} JSON 字符串
     */
    exportSettings() {
        return JSON.stringify(this.settings, null, 2);
    }

    /**
     * 导入配置
     * @param {string} jsonString - JSON 字符串
     */
    importSettings(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.saveSettings(imported);
        } catch (error) {
            console.error('Error importing settings:', error);
            throw error;
        }
    }
}

module.exports = SettingsService;
