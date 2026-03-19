/**
 * 游戏盒子服务
 * 负责游戏盒子的业务逻辑处理
 */
const FileService = require('./FileService');
const path = require('path');

class BoxService {
    constructor() {
        this.fileService = new FileService();
    }

    /**
     * 获取盒子目录路径
     * @param {string} gameboxDir - 游戏盒子目录
     * @returns {string} 盒子目录路径
     */
    getBoxesDir(gameboxDir) {
        return gameboxDir;
    }

    /**
     * 获取所有游戏盒子
     * @param {string} gameboxDir - 基础目录
     * @returns {Promise<Array>} 盒子列表
     */
    async getAllBoxes(gameboxDir) {
        try {
            const boxesDir = this.getBoxesDir(gameboxDir);
            const exists = await this.fileService.fileExists(boxesDir);

            if (!exists) {
                return [];
            }

            const files = await this.fileService.readDir(boxesDir);
            const boxes = [];

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const boxName = file.replace('.json', '');
                    const boxData = await this.readBoxFile(boxesDir, boxName);
                    if (boxData) {
                        // 计算盒子中的游戏总数
                        let gameCount = 0;
                        for (const platform of Object.keys(boxData)) {
                            gameCount += Array.isArray(boxData[platform]) ? boxData[platform].length : 0;
                        }
                        boxes.push({
                            name: boxName,
                            gameCount: gameCount,
                            platforms: Object.keys(boxData)
                        });
                    }
                }
            }

            return boxes;
        } catch (error) {
            console.error('Error getting all boxes:', error);
            throw error;
        }
    }

    /**
     * 读取盒子文件
     * @param {string} boxesDir - 盒子目录
     * @param {string} boxName - 盒子名称
     * @returns {Promise<object>} 盒子数据
     */
    async readBoxFile(boxesDir, boxName) {
        try {
            const filePath = path.join(boxesDir, `${boxName}.json`);
            const exists = await this.fileService.fileExists(filePath);

            if (!exists) {
                return null;
            }

            const content = await this.fileService.readFile(filePath);

            // 检查内容是否为空或无效
            if (!content || content.trim() === '') {
                console.warn(`Box file ${boxName}.json is empty, returning empty object`);
                return {};
            }

            return JSON.parse(content);
        } catch (error) {
            console.error('Error reading box file:', error);
            // 如果是 JSON 解析错误，返回空对象而不是抛出异常
            if (error instanceof SyntaxError) {
                return {};
            }
            throw error;
        }
    }

    /**
     * 创建游戏盒子
     * @param {string} boxName - 盒子名称
     * @param {string} gameboxDir - 基础目录
     * @returns {Promise<object>} 创建结果
     */
    async createBox(boxName, gameboxDir) {
        try {
            const boxesDir = this.getBoxesDir(gameboxDir);

            // 确保盒子目录存在
            await this.fileService.ensureDir(boxesDir);

            // 检查盒子是否已存在
            const boxPath = path.join(boxesDir, `${boxName}.json`);
            const exists = await this.fileService.fileExists(boxPath);

            if (exists) {
                throw new Error('盒子已存在');
            }

            // 创建空盒子
            const emptyBox = {};
            await this.fileService.writeFile(boxPath, JSON.stringify(emptyBox, null, 2));

            return { success: true, name: boxName };
        } catch (error) {
            console.error('Error creating box:', error);
            throw error;
        }
    }

    /**
     * 删除游戏盒子
     * @param {string} boxName - 盒子名称
     * @param {string} gameboxDir - 基础目录
     * @returns {Promise<object>} 删除结果
     */
    async deleteBox(boxName, gameboxDir) {
        try {
            const boxesDir = this.getBoxesDir(gameboxDir);
            const boxPath = path.join(boxesDir, `${boxName}.json`);

            const exists = await this.fileService.fileExists(boxPath);
            if (!exists) {
                throw new Error('盒子不存在');
            }

            await this.fileService.deleteFile(boxPath);

            return { success: true };
        } catch (error) {
            console.error('Error deleting box:', error);
            throw error;
        }
    }

    /**
     * 获取盒子详情
     * @param {string} boxName - 盒子名称
     * @param {string} gameboxDir - 基础目录
     * @returns {Promise<object>} 盒子详情
     */
    async getBoxDetail(boxName, gameboxDir) {
        try {
            const boxesDir = this.getBoxesDir(gameboxDir);
            const boxData = await this.readBoxFile(boxesDir, boxName);

            if (!boxData) {
                return null;
            }

            return {
                name: boxName,
                data: boxData
            };
        } catch (error) {
            console.error('Error getting box detail:', error);
            throw error;
        }
    }

    /**
     * 添加游戏到盒子
     * @param {string} boxName - 盒子名称
     * @param {object} gameInfo - 游戏信息（包含id, status等）
     * @param {string} platform - 游戏平台
     * @param {string} gameboxDir - 基础目录
     * @returns {Promise<object>} 添加结果
     */
    async addGameToBox(boxName, platform, gameInfo, gameboxDir) {
        try {
            const boxesDir = this.getBoxesDir(gameboxDir);
            const boxPath = path.join(boxesDir, `${boxName}.json`);

            // 读取现有盒子数据
            let boxData = await this.readBoxFile(boxesDir, boxName);

            if (!boxData) {
                boxData = {};
            }

            // 初始化平台数组
            if (!boxData[platform]) {
                boxData[platform] = [];
            }

            // 检查游戏是否已存在
            const existingIndex = boxData[platform].findIndex(g => g.id === gameInfo.id);

            if (existingIndex >= 0) {
                // 更新现有游戏信息
                boxData[platform][existingIndex] = {
                    ...boxData[platform][existingIndex],
                    ...gameInfo
                };
            } else {
                // 添加新游戏
                boxData[platform].push({
                    id: gameInfo.id,
                    status: gameInfo.status || 'unplayed',
                    firstPlayed: gameInfo.firstPlayed || '',
                    lastPlayed: gameInfo.lastPlayed || '',
                    totalPlayTime: gameInfo.totalPlayTime || 0,
                    playCount: gameInfo.playCount || 0
                });
            }

            // 保存盒子数据
            await this.fileService.writeFile(boxPath, JSON.stringify(boxData, null, 2));

            return { success: true };
        } catch (error) {
            console.error('Error adding game to box:', error);
            throw error;
        }
    }

    /**
     * 从盒子中移除游戏
     * @param {string} boxName - 盒子名称
     * @param {string} gameId - 游戏ID
     * @param {string} platform - 游戏平台
     * @param {string} gameboxDir - 基础目录
     * @returns {Promise<object>} 移除结果
     */
    async removeGameFromBox(boxName, platform, gameId, gameboxDir) {
        try {
            const boxesDir = this.getBoxesDir(gameboxDir);
            const boxData = await this.readBoxFile(boxesDir, boxName);

            if (!boxData || !boxData[platform]) {
                throw new Error('盒子或平台不存在');
            }

            // 移除游戏
            boxData[platform] = boxData[platform].filter(g => g.id !== gameId);

            // 如果平台数组为空，删除该平台
            if (boxData[platform].length === 0) {
                delete boxData[platform];
            }

            // 保存盒子数据
            const boxPath = path.join(boxesDir, `${boxName}.json`);
            await this.fileService.writeFile(boxPath, JSON.stringify(boxData, null, 2));

            return { success: true };
        } catch (error) {
            console.error('Error removing game from box:', error);
            throw error;
        }
    }

    /**
     * 更新盒子中游戏的状态
     * @param {string} boxName - 盒子名称
     * @param {string} platform - 游戏平台
     * @param {string} gameId - 游戏ID
     * @param {object} gameInfo - 游戏信息
     * @param {string} gameboxDir - 基础目录
     * @returns {Promise<object>} 更新结果
     */
    async updateGameInBox(boxName, platform, gameId, gameInfo, gameboxDir) {
        try {
            const boxesDir = this.getBoxesDir(gameboxDir);
            const boxData = await this.readBoxFile(boxesDir, boxName);

            if (!boxData || !boxData[platform]) {
                throw new Error('盒子或平台不存在');
            }

            // 查找游戏
            const gameIndex = boxData[platform].findIndex(g => g.id === gameId);

            if (gameIndex < 0) {
                throw new Error('游戏不存在');
            }

            // 更新游戏信息
            boxData[platform][gameIndex] = {
                ...boxData[platform][gameIndex],
                ...gameInfo
            };

            // 保存盒子数据
            const boxPath = path.join(boxesDir, `${boxName}.json`);
            await this.fileService.writeFile(boxPath, JSON.stringify(boxData, null, 2));

            return { success: true };
        } catch (error) {
            console.error('Error updating game in box:', error);
            throw error;
        }
    }
}

module.exports = BoxService;
