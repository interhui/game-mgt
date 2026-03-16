/**
 * 游戏服务
 * 负责游戏数据的业务逻辑处理
 */
const FileService = require('./FileService');
const path = require('path');

class GameService {
    constructor() {
        this.fileService = new FileService();
    }

    /**
     * 获取所有平台及其游戏列表
     * @param {string} gamesDir - 游戏存储目录
     * @returns {Promise<object>} 返回平台游戏数据
     */
    async getAllPlatforms(gamesDir) {
        try {
            const platforms = await this.fileService.getSimulatorFolders(gamesDir);
            const platformData = {};

            for (const platform of platforms) {
                const platformPath = path.join(gamesDir, platform);
                const games = await this.getGamesByPlatform(platform, gamesDir);
                platformData[platform] = {
                    id: platform,
                    name: this.getPlatformName(platform),
                    gameCount: games.length,
                    games: games
                };
            }

            return platformData;
        } catch (error) {
            console.error('Error getting all platforms:', error);
            throw error;
        }
    }

    /**
     * 获取平台统计数据
     * @param {string[]} platforms - 平台列表
     * @param {string} gamesDir - 游戏目录
     * @returns {Promise<object>} 平台统计
     */
    async getPlatformStats(platforms, gamesDir) {
        try {
            const platformData = [];

            for (const platform of platforms) {
                const platformPath = path.join(gamesDir, platform);
                const games = await this.getGamesByPlatform(platform, gamesDir);
                platformData.push({
                    id: platform,
                    name: this.getPlatformName(platform),
                    shortName: this.getPlatformShortName(platform),
                    gameCount: games.length,
                    games: games
                });
            }

            return platformData;
        } catch (error) {
            console.error('Error getting platform stats:', error);
            throw error;
        }
    }

    /**
     * 根据平台获取游戏列表
     * @param {string} platform - 平台名称
     * @param {string} gamesDir - 游戏存储目录
     * @param {object} options - 筛选和排序选项
     * @returns {Promise<Array>} 返回游戏列表
     */
    async getGamesByPlatform(platform, gamesDir, options = {}) {
        try {
            const { sortBy, sortOrder } = options;
            const platformPath = path.join(gamesDir, platform);

            const exists = await this.fileService.fileExists(platformPath);
            if (!exists) {
                return [];
            }

            const gameFolders = await this.fileService.getGameFolders(platformPath);
            const games = [];

            for (const [folderName, folderPath] of Object.entries(gameFolders)) {
                const gameData = await this.fileService.readGameJson(folderPath);
                if (gameData) {
                    // 生成完整游戏数据
                    const game = this.generateGameData(gameData, folderName, platform, folderPath);
                    games.push(game);
                }
            }

            // 排序
            return this.sortGames(games, sortBy, sortOrder);
        } catch (error) {
            console.error('Error getting games by platform:', error);
            throw error;
        }
    }

    /**
     * 获取所有游戏
     * @param {string} gamesDir - 游戏存储目录
     * @param {object} options - 筛选和排序选项
     * @returns {Promise<Array>} 游戏列表
     */
    async getAllGames(gamesDir, options = {}) {
        try {
            const platforms = await this.fileService.getSimulatorFolders(gamesDir);
            const allGames = [];

            for (const platform of platforms) {
                const games = await this.getGamesByPlatform(platform, gamesDir, options);
                allGames.push(...games);
            }

            return allGames;
        } catch (error) {
            console.error('Error getting all games:', error);
            throw error;
        }
    }

    /**
     * 搜索游戏
     * @param {string} keyword - 搜索关键词
     * @param {string} gamesDir - 游戏存储目录
     * @param {object} filters - 筛选条件
     * @returns {Promise<Array>} 返回匹配的游戏列表
     */
    async searchGames(keyword, gamesDir, filters = {}) {
        try {
            const allGames = await this.getAllGames(gamesDir);
            let results = allGames;

            // 关键字搜索
            if (keyword) {
                const lowerKeyword = keyword.toLowerCase();
                results = results.filter(game =>
                    game.name.toLowerCase().includes(lowerKeyword) ||
                    (game.description && game.description.toLowerCase().includes(lowerKeyword))
                );
            }

            // 平台筛选
            if (filters.platform) {
                results = results.filter(game => game.platform === filters.platform);
            }

            // 收藏筛选
            if (filters.favorite) {
                results = results.filter(game => game.favorite);
            }

            // 标签筛选
            if (filters.tagId) {
                results = results.filter(game =>
                    game.tags && game.tags.includes(filters.tagId)
                );
            }

            // 排序
            return this.sortGames(results, filters.sortBy, filters.sortOrder);
        } catch (error) {
            console.error('Error searching games:', error);
            throw error;
        }
    }

    /**
     * 获取单个游戏详情
     * @param {string} gameId - 游戏 ID
     * @param {string} gamesDir - 游戏存储目录
     * @returns {Promise<object>} 返回游戏详情
     */
    async getGameDetail(gameId, gamesDir) {
        try {
            const platforms = await this.fileService.getSimulatorFolders(gamesDir);

            for (const platform of platforms) {
                const platformPath = path.join(gamesDir, platform);
                const gameFolders = await this.fileService.getGameFolders(platformPath);

                for (const [folderName, folderPath] of Object.entries(gameFolders)) {
                    const gameData = await this.fileService.readGameJson(folderPath);
                    if (gameData && (gameData.id === gameId || folderName === gameId)) {
                        const game = this.generateGameData(gameData, folderName, platform, folderPath);
                        // 添加更多详情信息
                        game.poster = await this.getGamePoster(folderPath);
                        return game;
                    }
                }
            }

            return null;
        } catch (error) {
            console.error('Error getting game detail:', error);
            throw error;
        }
    }

    /**
     * 验证游戏有效性
     * @param {string} gamePath - 游戏路径
     * @returns {Promise<boolean>} 是否有效
     */
    async isGameValid(gamePath) {
        try {
            const gameData = await this.fileService.readGameJson(gamePath);
            return gameData !== null && gameData.name !== undefined;
        } catch (error) {
            console.error('Error validating game:', error);
            return false;
        }
    }

    /**
     * 切换收藏状态
     * @param {string} gameId - 游戏 ID
     * @param {string} gamesDir - 游戏目录
     * @returns {Promise<boolean>} 收藏状态
     */
    async toggleFavorite(gameId, gamesDir) {
        try {
            const gameDetail = await this.getGameDetail(gameId, gamesDir);
            if (!gameDetail) {
                throw new Error('Game not found');
            }

            const gameData = await this.fileService.readGameJson(gameDetail.path);
            if (!gameData) {
                throw new Error('Game data not found');
            }

            gameData.favorite = !gameData.favorite;
            await this.fileService.writeGameJson(gameDetail.path, gameData);

            return gameData.favorite;
        } catch (error) {
            console.error('Error toggling favorite:', error);
            throw error;
        }
    }

    /**
     * 保存用户评分
     * @param {string} gameId - 游戏 ID
     * @param {number} rating - 评分 (1-5)
     * @param {string} comment - 评论
     * @param {string} gamesDir - 游戏目录
     */
    async saveRating(gameId, rating, comment, gamesDir) {
        try {
            const gameDetail = await this.getGameDetail(gameId, gamesDir);
            if (!gameDetail) {
                throw new Error('Game not found');
            }

            const gameData = await this.fileService.readGameJson(gameDetail.path);
            if (!gameData) {
                throw new Error('Game data not found');
            }

            gameData.userRating = rating;
            if (comment !== undefined) {
                gameData.userComment = comment;
            }

            await this.fileService.writeGameJson(gameDetail.path, gameData);

            return { success: true };
        } catch (error) {
            console.error('Error saving rating:', error);
            throw error;
        }
    }

    /**
     * 批量切换收藏状态
     * @param {string[]} gameIds - 游戏 ID 数组
     * @param {string} gamesDir - 游戏目录
     * @returns {Promise<object>} 更新结果
     */
    async batchToggleFavorite(gameIds, gamesDir) {
        try {
            const results = [];
            for (const gameId of gameIds) {
                const favorite = await this.toggleFavorite(gameId, gamesDir);
                results.push({ gameId, favorite });
            }
            return { success: true, results };
        } catch (error) {
            console.error('Error batch toggling favorite:', error);
            throw error;
        }
    }

    /**
     * 批量删除游戏
     * @param {string[]} gameIds - 游戏 ID 数组
     * @param {string} gamesDir - 游戏目录
     * @returns {Promise<object>} 删除结果
     */
    async batchDeleteGames(gameIds, gamesDir) {
        try {
            const results = [];
            for (const gameId of gameIds) {
                const gameDetail = await this.getGameDetail(gameId, gamesDir);
                if (gameDetail) {
                    await this.fileService.deleteDir(gameDetail.path);
                    results.push({ gameId, deleted: true });
                }
            }
            return { success: true, count: results.length };
        } catch (error) {
            console.error('Error batch deleting games:', error);
            throw error;
        }
    }

    /**
     * 获取游戏统计数据
     * @param {string} platform - 平台筛选
     * @param {string} gamesDir - 游戏目录
     * @returns {Promise<object>} 统计数据
     */
    async getStats(platform, gamesDir) {
        try {
            let games;
            if (platform) {
                games = await this.getGamesByPlatform(platform, gamesDir);
            } else {
                games = await this.getAllGames(gamesDir);
            }

            const stats = {
                totalGames: games.length,
                avgRating: this.calculateAverageRating(games),
                favoriteCount: games.filter(g => g.favorite).length
            };

            return stats;
        } catch (error) {
            console.error('Error getting stats:', error);
            throw error;
        }
    }

    /**
     * 生成完整的游戏数据对象
     * @param {object} gameData - 游戏 JSON 数据
     * @param {string} folderName - 文件夹名称
     * @param {string} platform - 平台
     * @param {string} folderPath - 文件夹路径
     * @returns {object} 完整游戏数据
     */
    generateGameData(gameData, folderName, platform, folderPath) {
        // 生成 gameId：格式为 "平台-游戏名称"，小写字母
        const gameId = gameData.gameId || this.generateGameId(platform, gameData.name || folderName);

        return {
            id: gameData.id || `${platform}-${folderName}`,
            gameId: gameId,
            name: gameData.name || folderName,
            description: gameData.description || '',
            publishDate: gameData.publishDate || '',
            platform: platform,
            favorite: gameData.favorite || false,
            userRating: gameData.userRating || 0,
            userComment: gameData.userComment || '',
            tags: gameData.tags || [],
            customTags: gameData.customTags || [],
            developer: gameData.developer || '',
            publisher: gameData.publisher || '',
            genre: gameData.genre || [],
            notes: gameData.notes || '',
            path: folderPath,
            folderName: folderName
        };
    }

    /**
     * 获取游戏海报
     * @param {string} gamePath - 游戏路径
     * @returns {Promise<string>} 海报路径或 base64
     */
    async getGamePoster(gamePath) {
        const posterExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const posterNames = ['poster', 'cover', 'folder'];

        for (const name of posterNames) {
            for (const ext of posterExtensions) {
                const posterPath = path.join(gamePath, `${name}${ext}`);
                if (await this.fileService.fileExists(posterPath)) {
                    return posterPath;
                }
            }
        }

        return null;
    }

    /**
     * 获取平台显示名称
     * @param {string} platform - 平台标识
     * @returns {string} 显示名称
     */
    getPlatformName(platform) {
        const names = {
            'ps2': 'PlayStation 2',
            'ps1': 'PlayStation',
            'psp': 'PlayStation Portable',
            'xbox360': 'Xbox 360',
            'switch': 'Nintendo Switch',
            'pc': 'PC Games',
            'wii': 'Nintendo Wii',
            'wiiu': 'Nintendo Wii U',
            '3ds': 'Nintendo 3DS',
            'n64': 'Nintendo 64'
        };
        return names[platform] || platform;
    }

    /**
     * 获取平台短名称
     * @param {string} platform - 平台标识
     * @returns {string} 短名称
     */
    getPlatformShortName(platform) {
        const names = {
            'ps2': 'PS2',
            'ps1': 'PS1',
            'psp': 'PSP',
            'xbox360': 'X360',
            'switch': 'Switch',
            'pc': 'PC',
            'wii': 'Wii',
            'wiiu': 'Wii U',
            '3ds': '3DS',
            'n64': 'N64'
        };
        return names[platform] || platform;
    }

    /**
     * 对游戏列表进行排序
     * @param {Array} games - 游戏列表
     * @param {string} sortBy - 排序字段
     * @param {string} sortOrder - 排序方向
     * @returns {Array} 排序后的列表
     */
    sortGames(games, sortBy = 'name', sortOrder = 'asc') {
        if (!sortBy) {
            return games;
        }

        const sorted = [...games];

        sorted.sort((a, b) => {
            let valA, valB;

            switch (sortBy) {
                case 'name':
                    valA = a.name.toLowerCase();
                    valB = b.name.toLowerCase();
                    break;
                case 'rating':
                    valA = a.userRating || 0;
                    valB = b.userRating || 0;
                    break;
                default:
                    valA = a.name.toLowerCase();
                    valB = b.name.toLowerCase();
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        // 收藏游戏排在前面
        sorted.sort((a, b) => {
            if (a.favorite && !b.favorite) return -1;
            if (!a.favorite && b.favorite) return 1;
            return 0;
        });

        return sorted;
    }

    /**
     * 计算平均评分
     * @param {Array} games - 游戏列表
     * @returns {number} 平均评分
     */
    calculateAverageRating(games) {
        const ratedGames = games.filter(g => g.userRating && g.userRating > 0);
        if (ratedGames.length === 0) return 0;
        const sum = ratedGames.reduce((acc, g) => acc + g.userRating, 0);
        return (sum / ratedGames.length).toFixed(1);
    }

    /**
     * 生成游戏ID
     * 格式：平台-游戏名称（小写字母）
     * @param {string} platform - 平台标识
     * @param {string} gameName - 游戏名称
     * @returns {string} 游戏ID
     */
    generateGameId(platform, gameName) {
        // 将游戏名称转换为小写，去除特殊字符，只保留字母、数字和连字符
        const normalizedName = gameName.toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-') // 非字母数字中文转为连字符
            .replace(/-+/g, '-') // 多个连字符合并为一个
            .replace(/^-|-$/g, ''); // 去除首尾连字符

        return `${platform}-${normalizedName}`;
    }
}

module.exports = GameService;
