/**
 * 文件系统服务
 * 负责所有文件系统的操作
 */
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

class FileService {
    constructor() {
        this.baseDir = path.join(__dirname, '..', '..');
    }

    /**
     * 获取指定目录下所有子文件夹名称
     * @param {string} baseDir - 基础目录路径
     * @returns {Promise<string[]>} 返回文件夹名称数组
     */
    async getSimulatorFolders(baseDir) {
        try {
            const fullPath = path.resolve(baseDir);
            const exists = await this.fileExists(fullPath);
            if (!exists) {
                return [];
            }

            const entries = await fs.readdir(fullPath, { withFileTypes: true });
            const folders = entries
                .filter(entry => entry.isDirectory())
                .map(entry => entry.name);

            return folders;
        } catch (error) {
            console.error('Error getting simulator folders:', error);
            throw error;
        }
    }

    /**
     * 获取指定模拟器目录下所有游戏文件夹
     * @param {string} platformDir - 平台目录路径
     * @returns {Promise<object>} 返回 {folderName: folderPath} 对象
     */
    async getGameFolders(platformDir) {
        try {
            const fullPath = path.resolve(platformDir);
            const exists = await this.fileExists(fullPath);
            if (!exists) {
                return {};
            }

            const entries = await fs.readdir(fullPath, { withFileTypes: true });
            const gameFolders = {};

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    gameFolders[entry.name] = path.join(fullPath, entry.name);
                }
            }

            return gameFolders;
        } catch (error) {
            console.error('Error getting game folders:', error);
            throw error;
        }
    }

    /**
     * 读取 game.json 文件内容
     * @param {string} gamePath - 游戏文件夹路径
     * @returns {Promise<object>} 返回游戏信息对象
     */
    async readGameJson(gamePath) {
        try {
            const gameJsonPath = path.join(gamePath, 'game.json');
            const exists = await this.fileExists(gameJsonPath);
            if (!exists) {
                return null;
            }

            const content = await fs.readFile(gameJsonPath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            console.error('Error reading game.json:', error);
            throw error;
        }
    }

    /**
     * 写入 game.json 文件
     * @param {string} gamePath - 游戏文件夹路径
     * @param {object} gameData - 游戏数据对象
     */
    async writeGameJson(gamePath, gameData) {
        try {
            const gameJsonPath = path.join(gamePath, 'game.json');
            await fs.writeFile(gameJsonPath, JSON.stringify(gameData, null, 2), 'utf-8');
        } catch (error) {
            console.error('Error writing game.json:', error);
            throw error;
        }
    }

    /**
     * 检查文件是否存在
     * @param {string} filePath - 文件路径
     * @returns {Promise<boolean>} 是否存在
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 检查文件是否存在（同步版本）
     * @param {string} filePath - 文件路径
     * @returns {boolean} 是否存在
     */
    fileExistsSync(filePath) {
        return fsSync.existsSync(filePath);
    }

    /**
     * 读取目录内容
     * @param {string} dirPath - 目录路径
     * @returns {Promise<string[]>} 文件列表
     */
    async readDir(dirPath) {
        try {
            const exists = await this.fileExists(dirPath);
            if (!exists) {
                return [];
            }
            return await fs.readdir(dirPath);
        } catch (error) {
            console.error('Error reading directory:', error);
            throw error;
        }
    }

    /**
     * 创建目录
     * @param {string} dirPath - 目录路径
     */
    async createDir(dirPath) {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            console.error('Error creating directory:', error);
            throw error;
        }
    }

    /**
     * 确保目录存在（如果不存在则创建）
     * @param {string} dirPath - 目录路径
     */
    async ensureDir(dirPath) {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            // 忽略目录已存在的错误
            if (error.code !== 'EEXIST') {
                console.error('Error ensuring directory:', error);
                throw error;
            }
        }
    }

    /**
     * 写入文件
     * @param {string} filePath - 文件路径
     * @param {string} content - 文件内容
     */
    async writeFile(filePath, content) {
        try {
            await fs.writeFile(filePath, content, 'utf-8');
        } catch (error) {
            console.error('Error writing file:', error);
            throw error;
        }
    }

    /**
     * 读取文件
     * @param {string} filePath - 文件路径
     * @returns {Promise<string>} 文件内容
     */
    async readFile(filePath) {
        try {
            return await fs.readFile(filePath, 'utf-8');
        } catch (error) {
            console.error('Error reading file:', error);
            throw error;
        }
    }

    /**
     * 删除文件
     * @param {string} filePath - 文件路径
     */
    async deleteFile(filePath) {
        try {
            const exists = await this.fileExists(filePath);
            if (exists) {
                await fs.unlink(filePath);
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    }

    /**
     * 删除目录
     * @param {string} dirPath - 目录路径
     */
    async deleteDir(dirPath) {
        try {
            const exists = await this.fileExists(dirPath);
            if (exists) {
                await fs.rm(dirPath, { recursive: true, force: true });
            }
        } catch (error) {
            console.error('Error deleting directory:', error);
            throw error;
        }
    }

    /**
     * 复制文件
     * @param {string} srcPath - 源路径
     * @param {string} destPath - 目标路径
     */
    async copyFile(srcPath, destPath) {
        try {
            await fs.copyFile(srcPath, destPath);
        } catch (error) {
            console.error('Error copying file:', error);
            throw error;
        }
    }

    /**
     * 读取 JSON 文件
     * @param {string} filePath - 文件路径
     * @returns {Promise<object>} JSON 对象
     */
    async readJson(filePath) {
        try {
            const exists = await this.fileExists(filePath);
            if (!exists) {
                return null;
            }
            const content = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            console.error('Error reading JSON file:', error);
            throw error;
        }
    }

    /**
     * 写入 JSON 文件
     * @param {string} filePath - 文件路径
     * @param {object} data - 数据对象
     */
    async writeJson(filePath, data) {
        try {
            const dir = path.dirname(filePath);
            await this.createDir(dir);
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        } catch (error) {
            console.error('Error writing JSON file:', error);
            throw error;
        }
    }

    /**
     * 获取平台配置文件
     * @returns {Promise<object>} 平台配置
     */
    async getPlatformConfig() {
        const configPath = path.join(this.baseDir, 'config', 'platforms.json');
        return await this.readJson(configPath);
    }

    /**
     * 保存平台配置文件
     * @param {object} config - 平台配置
     */
    async savePlatformConfig(config) {
        const configPath = path.join(this.baseDir, 'config', 'platforms.json');
        await this.writeJson(configPath, config);
    }

    /**
     * 获取文件扩展名
     * @param {string} filePath - 文件路径
     * @returns {string} 扩展名
     */
    getFileExtension(filePath) {
        return path.extname(filePath).toLowerCase();
    }

    /**
     * 获取文件名（不含扩展名）
     * @param {string} filePath - 文件路径
     * @returns {string} 文件名
     */
    getFileNameWithoutExtension(filePath) {
        return path.basename(filePath, path.extname(filePath));
    }

    /**
     * 读取图片文件为 base64
     * @param {string} imagePath - 图片路径
     * @returns {Promise<string>} base64 字符串
     */
    async readImageAsBase64(imagePath) {
        try {
            const exists = await this.fileExists(imagePath);
            if (!exists) {
                return null;
            }
            const buffer = await fs.readFile(imagePath);
            const ext = this.getFileExtension(imagePath);
            const mimeType = this.getMimeType(ext);
            return `data:${mimeType};base64,${buffer.toString('base64')}`;
        } catch (error) {
            console.error('Error reading image:', error);
            return null;
        }
    }

    /**
     * 获取 MIME 类型
     * @param {string} ext - 扩展名
     * @returns {string} MIME 类型
     */
    getMimeType(ext) {
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }
}

module.exports = FileService;
