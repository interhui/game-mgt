/**
 * 数据库服务
 * 负责使用 JSON 文件进行数据存储
 */
const FileService = require('./FileService');
const path = require('path');
const fs = require('fs');

class DatabaseService {
    constructor(dbPath) {
        this.dbPath = dbPath;
        this.fileService = new FileService();
        this.data = {
            games: [],
            tags: [],
            game_tags: []
        };
        this.init(dbPath);
    }

    /**
     * 初始化数据库
     * @param {string} dbPath - 数据库文件路径
     */
    init(dbPath) {
        try {
            // 确保目录存在
            const dir = path.dirname(dbPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // 加载或创建数据文件
            this.loadData();
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Error initializing database:', error);
            throw error;
        }
    }

    /**
     * 加载数据
     */
    loadData() {
        try {
            if (fs.existsSync(this.dbPath)) {
                const content = fs.readFileSync(this.dbPath, 'utf-8');
                this.data = JSON.parse(content);
            } else {
                this.saveData();
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.data = { games: [], tags: [], game_tags: [] };
        }
    }

    /**
     * 保存数据
     */
    saveData() {
        try {
            fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf-8');
        } catch (error) {
            console.error('Error saving data:', error);
            throw error;
        }
    }

    /**
     * 获取数据库实例（兼容接口）
     * @returns {object} 数据库对象（此处返回自身）
     */
    getDatabase() {
        return this;
    }

    /**
     * 保存游戏状态
     * @param {string} gameId - 游戏 ID
     * @param {object} state - 游戏状态数据
     */
    saveGameState(gameId, state) {
        try {
            const game = this.data.games.find(g => g.id === gameId);
            if (game) {
                game.status = state.status;
                game.totalPlayTime = (game.totalPlayTime || 0) + (state.playTime || 0);
                game.playCount = (game.playCount || 0) + 1;
                game.lastPlayed = new Date().toISOString().split('T')[0];
                game.updated_at = Date.now();
                this.saveData();
            }
        } catch (error) {
            console.error('Error saving game state:', error);
            throw error;
        }
    }

    /**
     * 获取游戏状态
     * @param {string} gameId - 游戏 ID
     * @returns {object} 游戏状态数据
     */
    getGameState(gameId) {
        try {
            const game = this.data.games.find(g => g.id === gameId);
            if (game) {
                return {
                    status: game.status,
                    playCount: game.playCount,
                    totalPlayTime: game.totalPlayTime,
                    lastPlayed: game.lastPlayed,
                    firstPlayed: game.firstPlayed
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting game state:', error);
            throw error;
        }
    }

    /**
     * 获取游戏统计数据
     * @param {string} platform - 平台筛选（可选）
     * @returns {object} 统计数据
     */
    getGameStats(platform = null) {
        try {
            let games = this.data.games;
            if (platform) {
                games = games.filter(g => g.platform === platform);
            }

            const stats = {
                totalGames: games.length,
                playedGames: games.filter(g => g.status === 'completed').length,
                playingGames: games.filter(g => g.status === 'playing').length,
                unplayedGames: games.filter(g => g.status === 'unplayed').length,
                totalHours: (games.reduce((sum, g) => sum + (g.totalPlayTime || 0), 0) / 60).toFixed(1),
                avgRating: this.calculateAverageRating(games)
            };

            return stats;
        } catch (error) {
            console.error('Error getting game stats:', error);
            throw error;
        }
    }

    /**
     * 计算平均评分
     */
    calculateAverageRating(games) {
        const ratedGames = games.filter(g => g.userRating && g.userRating > 0);
        if (ratedGames.length === 0) return 0;
        const sum = ratedGames.reduce((acc, g) => acc + g.userRating, 0);
        return (sum / ratedGames.length).toFixed(1);
    }

    /**
     * 更新游戏时长
     * @param {string} gameId - 游戏 ID
     * @param {number} duration - 时长（分钟）
     */
    updatePlayTime(gameId, duration) {
        try {
            const game = this.data.games.find(g => g.id === gameId);
            if (game) {
                game.totalPlayTime = (game.totalPlayTime || 0) + duration;
                game.playCount = (game.playCount || 0) + 1;
                game.lastPlayed = new Date().toISOString().split('T')[0];
                game.updated_at = Date.now();
                this.saveData();
            }
        } catch (error) {
            console.error('Error updating play time:', error);
            throw error;
        }
    }

    /**
     * 保存用户评分
     * @param {string} gameId - 游戏 ID
     * @param {number} rating - 评分 (1-5)
     * @param {string} comment - 评论
     */
    saveUserRating(gameId, rating, comment) {
        try {
            const game = this.data.games.find(g => g.id === gameId);
            if (game) {
                game.userRating = rating;
                game.userComment = comment || '';
                game.updated_at = Date.now();
                this.saveData();
            }
        } catch (error) {
            console.error('Error saving user rating:', error);
            throw error;
        }
    }

    /**
     * 设置收藏状态
     * @param {string} gameId - 游戏 ID
     * @param {boolean} isFavorite - 是否收藏
     */
    setFavorite(gameId, isFavorite) {
        try {
            const game = this.data.games.find(g => g.id === gameId);
            if (game) {
                game.favorite = isFavorite ? 1 : 0;
                game.updated_at = Date.now();
                this.saveData();
            }
        } catch (error) {
            console.error('Error setting favorite:', error);
            throw error;
        }
    }

    /**
     * 获取标签列表
     * @returns {Array} 标签列表
     */
    getTags() {
        try {
            return [...this.data.tags].sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error('Error getting tags:', error);
            throw error;
        }
    }

    /**
     * 为游戏添加标签
     * @param {string} gameId - 游戏 ID
     * @param {Array} tagIds - 标签 ID 数组
     */
    addTagsToGame(gameId, tagIds) {
        try {
            for (const tagId of tagIds) {
                const exists = this.data.game_tags.find(
                    gt => gt.game_id === gameId && gt.tag_id === tagId
                );
                if (!exists) {
                    this.data.game_tags.push({ game_id: gameId, tag_id: tagId });
                }
            }
            this.saveData();
        } catch (error) {
            console.error('Error adding tags to game:', error);
            throw error;
        }
    }

    /**
     * 从游戏移除标签
     * @param {string} gameId - 游戏 ID
     * @param {Array} tagIds - 标签 ID 数组
     */
    removeTagsFromGame(gameId, tagIds) {
        try {
            this.data.game_tags = this.data.game_tags.filter(
                gt => !(gt.game_id === gameId && tagIds.includes(gt.tag_id))
            );
            this.saveData();
        } catch (error) {
            console.error('Error removing tags from game:', error);
            throw error;
        }
    }

    /**
     * 获取游戏的标签
     * @param {string} gameId - 游戏 ID
     * @returns {Array} 标签列表
     */
    getGameTags(gameId) {
        try {
            const tagIds = this.data.game_tags
                .filter(gt => gt.game_id === gameId)
                .map(gt => gt.tag_id);
            return this.data.tags.filter(t => tagIds.includes(t.id));
        } catch (error) {
            console.error('Error getting game tags:', error);
            throw error;
        }
    }

    /**
     * 插入或更新游戏
     * @param {object} game - 游戏数据
     */
    upsertGame(game) {
        try {
            const index = this.data.games.findIndex(g => g.id === game.id);
            const now = Date.now();

            const gameData = {
                ...game,
                favorite: game.favorite ? 1 : 0,
                updated_at: now,
                created_at: game.created_at || now
            };

            if (index >= 0) {
                this.data.games[index] = { ...this.data.games[index], ...gameData };
            } else {
                this.data.games.push(gameData);
            }

            this.saveData();
        } catch (error) {
            console.error('Error upserting game:', error);
            throw error;
        }
    }

    /**
     * 搜索游戏
     * @param {string} keyword - 搜索关键字
     * @param {object} filters - 筛选条件
     * @returns {Array} 游戏列表
     */
    searchGames(keyword, filters = {}) {
        try {
            let results = [...this.data.games];

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

            // 状态筛选
            if (filters.status) {
                results = results.filter(game => game.status === filters.status);
            }

            // 收藏筛选
            if (filters.favorite) {
                results = results.filter(game => game.favorite === 1);
            }

            // 排序
            const sortMapping = {
                'name-asc': (a, b) => a.name.localeCompare(b.name),
                'name-desc': (a, b) => b.name.localeCompare(a.name),
                'playtime-desc': (a, b) => (b.totalPlayTime || 0) - (a.totalPlayTime || 0),
                'playtime-asc': (a, b) => (a.totalPlayTime || 0) - (b.totalPlayTime || 0),
                'rating-desc': (a, b) => (b.userRating || 0) - (a.userRating || 0),
                'rating-asc': (a, b) => (a.userRating || 0) - (b.userRating || 0),
                'last-played-desc': (a, b) => (b.lastPlayed || '').localeCompare(a.lastPlayed || ''),
                'created-desc': (a, b) => (b.created_at || 0) - (a.created_at || 0)
            };

            if (filters.sort && sortMapping[filters.sort]) {
                results.sort(sortMapping[filters.sort]);
            } else {
                results.sort((a, b) => {
                    if (b.favorite === 1 && a.favorite !== 1) return 1;
                    if (a.favorite === 1 && b.favorite !== 1) return -1;
                    return a.name.localeCompare(b.name);
                });
            }

            return results;
        } catch (error) {
            console.error('Error searching games:', error);
            throw error;
        }
    }

    /**
     * 批量删除游戏
     * @param {Array} gameIds - 游戏 ID 数组
     */
    deleteGames(gameIds) {
        try {
            this.data.games = this.data.games.filter(g => !gameIds.includes(g.id));
            this.data.game_tags = this.data.game_tags.filter(
                gt => !gameIds.includes(gt.game_id)
            );
            this.saveData();
        } catch (error) {
            console.error('Error deleting games:', error);
            throw error;
        }
    }

    /**
     * 关闭数据库连接
     */
    close() {
        this.saveData();
        console.log('Database connection closed');
    }
}

module.exports = DatabaseService;
