/**
 * 游戏启动服务
 * 负责调用模拟器启动游戏
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class LauncherService {
    constructor(emulatorsConfig = {}) {
        this.emulators = emulatorsConfig;
    }

    /**
     * 获取可用模拟器列表
     * @returns {Array} 模拟器列表
     */
    getAvailableEmulators() {
        return Object.entries(this.emulators).map(([id, config]) => ({
            id,
            name: config.name,
            path: config.path,
            arguments: config.arguments
        }));
    }

    /**
     * 启动游戏
     * @param {string} gamePath - 游戏路径
     * @param {string} platform - 平台标识
     * @param {string} emulatorPath - 模拟器可执行文件路径
     * @returns {Promise<object>} 启动结果
     */
    async launchGame(gamePath, platform, emulatorPath) {
        try {
            // 获取模拟器配置
            const emulatorConfig = this.getEmulatorConfig(platform);

            // 如果没有提供模拟器路径，使用配置中的路径
            if (!emulatorPath && emulatorConfig) {
                emulatorPath = emulatorConfig.path;
            }

            if (!emulatorPath) {
                throw new Error(`No emulator configured for platform: ${platform}`);
            }

            // 验证模拟器路径
            const exists = await this.validateEmulatorPath(emulatorPath);
            if (!exists) {
                throw new Error(`Emulator not found at: ${emulatorPath}`);
            }

            // 构建命令行参数
            let args = [];
            if (emulatorConfig && emulatorConfig.arguments) {
                args = emulatorConfig.arguments
                    .replace('{gamePath}', gamePath)
                    .replace(/{([^}]+)}/g, '')
                    .split(' ')
                    .filter(arg => arg);
            } else {
                args = [gamePath];
            }

            // 启动模拟器
            console.log(`Launching game: ${gamePath} with emulator: ${emulatorPath}`);

            const process = spawn(emulatorPath, args, {
                detached: true,
                stdio: 'ignore'
            });

            process.unref();

            return {
                success: true,
                pid: process.pid,
                emulator: emulatorPath,
                game: gamePath
            };
        } catch (error) {
            console.error('Error launching game:', error);
            throw error;
        }
    }

    /**
     * 验证模拟器路径
     * @param {string} emulatorPath - 模拟器路径
     * @returns {Promise<boolean>} 是否有效
     */
    async validateEmulatorPath(emulatorPath) {
        try {
            await fs.access(emulatorPath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 获取模拟器配置
     * @param {string} platform - 平台标识
     * @returns {object} 模拟器配置
     */
    getEmulatorConfig(platform) {
        return this.emulators[platform] || null;
    }

    /**
     * 设置模拟器配置
     * @param {string} platform - 平台标识
     * @param {object} config - 配置对象
     */
    setEmulatorConfig(platform, config) {
        this.emulators[platform] = config;
    }

    /**
     * 更新模拟器列表
     * @param {object} emulators - 模拟器配置对象
     */
    updateEmulators(emulators) {
        this.emulators = emulators;
    }

    /**
     * 检测模拟器是否可用
     * @param {string} platform - 平台标识
     * @returns {Promise<boolean>} 是否可用
     */
    async isEmulatorAvailable(platform) {
        const config = this.getEmulatorConfig(platform);
        if (!config || !config.path) {
            return false;
        }
        return await this.validateEmulatorPath(config.path);
    }

    /**
     * 获取所有可用的模拟器
     * @returns {Promise<Array>} 可用模拟器列表
     */
    async getAvailableEmulators() {
        const emulators = this.getAvailableEmulators();
        const available = [];

        for (const emulator of emulators) {
            const isAvailable = await this.validateEmulatorPath(emulator.path);
            available.push({
                ...emulator,
                available: isAvailable
            });
        }

        return available;
    }

    /**
     * 测试模拟器启动
     * @param {string} emulatorPath - 模拟器路径
     * @returns {Promise<object>} 测试结果
     */
    async testEmulator(emulatorPath) {
        try {
            const exists = await this.validateEmulatorPath(emulatorPath);
            if (!exists) {
                return {
                    success: false,
                    message: 'Emulator executable not found'
                };
            }

            // 尝试启动模拟器（不加载游戏）
            const process = spawn(emulatorPath, ['--version'], {
                detached: true,
                stdio: 'ignore'
            });

            process.unref();

            return {
                success: true,
                message: 'Emulator found and tested'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
}

module.exports = LauncherService;
