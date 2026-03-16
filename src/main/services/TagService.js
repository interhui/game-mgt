/**
 * 标签服务
 * 负责标签的管理，包括标签的增删改查
 */
const path = require('path');

class TagService {
    constructor(database) {
        this.db = database;
    }

    /**
     * 获取所有标签
     * @returns {Array} 标签列表
     */
    getAllTags() {
        try {
            const stmt = this.db.prepare('SELECT * FROM tags ORDER BY name');
            return stmt.all();
        } catch (error) {
            console.error('Error getting all tags:', error);
            throw error;
        }
    }

    /**
     * 创建新标签
     * @param {string} name - 标签名称
     * @param {string} color - 标签颜色
     * @returns {object} 创建的标签
     */
    createTag(name, color = '#0078d4') {
        try {
            const id = this.generateId(name);
            const stmt = this.db.prepare(`
                INSERT INTO tags (id, name, color, created_at)
                VALUES (?, ?, ?, ?)
            `);

            stmt.run(id, name, color, Date.now());

            return { id, name, color };
        } catch (error) {
            console.error('Error creating tag:', error);
            throw error;
        }
    }

    /**
     * 删除标签
     * @param {string} tagId - 标签 ID
     */
    deleteTag(tagId) {
        try {
            // 先删除关联
            const deleteRelations = this.db.prepare('DELETE FROM game_tags WHERE tag_id = ?');
            deleteRelations.run(tagId);

            // 删除标签
            const deleteTag = this.db.prepare('DELETE FROM tags WHERE id = ?');
            deleteTag.run(tagId);
        } catch (error) {
            console.error('Error deleting tag:', error);
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
            const stmt = this.db.prepare(`
                INSERT OR IGNORE INTO game_tags (game_id, tag_id) VALUES (?, ?)
            `);

            for (const tagId of tagIds) {
                stmt.run(gameId, tagId);
            }
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
            const placeholders = tagIds.map(() => '?').join(',');
            const stmt = this.db.prepare(`
                DELETE FROM game_tags WHERE game_id = ? AND tag_id IN (${placeholders})
            `);

            stmt.run(gameId, ...tagIds);
        } catch (error) {
            console.error('Error removing tags from game:', error);
            throw error;
        }
    }

    /**
     * 管理游戏标签（添加或移除）
     * @param {string} gameId - 游戏 ID
     * @param {Array} tags - 标签 ID 数组
     * @param {string} action - 操作类型：'add' 或 'remove'
     * @returns {object} 操作结果
     */
    manageTags(gameId, tags, action) {
        try {
            if (action === 'add') {
                this.addTagsToGame(gameId, tags);
            } else if (action === 'remove') {
                this.removeTagsFromGame(gameId, tags);
            } else if (action === 'set') {
                // 先移除所有标签，然后添加新标签
                this.removeAllTagsFromGame(gameId);
                this.addTagsToGame(gameId, tags);
            }

            return { success: true };
        } catch (error) {
            console.error('Error managing tags:', error);
            throw error;
        }
    }

    /**
     * 从游戏移除所有标签
     * @param {string} gameId - 游戏 ID
     */
    removeAllTagsFromGame(gameId) {
        try {
            const stmt = this.db.prepare('DELETE FROM game_tags WHERE game_id = ?');
            stmt.run(gameId);
        } catch (error) {
            console.error('Error removing all tags from game:', error);
            throw error;
        }
    }

    /**
     * 根据标签获取游戏列表
     * @param {string} tagId - 标签 ID
     * @returns {Array} 游戏列表
     */
    getGamesByTag(tagId) {
        try {
            const stmt = this.db.prepare(`
                SELECT g.* FROM games g
                JOIN game_tags gt ON g.id = gt.game_id
                WHERE gt.tag_id = ?
            `);
            return stmt.all(tagId);
        } catch (error) {
            console.error('Error getting games by tag:', error);
            throw error;
        }
    }

    /**
     * 更新标签信息
     * @param {string} tagId - 标签 ID
     * @param {object} data - 更新数据
     */
    updateTag(tagId, data) {
        try {
            let query = 'UPDATE tags SET ';
            const params = [];

            if (data.name) {
                query += 'name = ?, ';
                params.push(data.name);
            }

            if (data.color) {
                query += 'color = ?, ';
                params.push(data.color);
            }

            query = query.slice(0, -2); // 移除最后的逗号和空格
            query += ' WHERE id = ?';
            params.push(tagId);

            const stmt = this.db.prepare(query);
            stmt.run(...params);
        } catch (error) {
            console.error('Error updating tag:', error);
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
            const stmt = this.db.prepare(`
                SELECT t.* FROM tags t
                JOIN game_tags gt ON t.id = gt.tag_id
                WHERE gt.game_id = ?
            `);
            return stmt.all(gameId);
        } catch (error) {
            console.error('Error getting game tags:', error);
            throw error;
        }
    }

    /**
     * 检查标签是否存在
     * @param {string} name - 标签名称
     * @returns {boolean} 是否存在
     */
    tagExists(name) {
        try {
            const stmt = this.db.prepare('SELECT COUNT(*) as count FROM tags WHERE name = ?');
            const result = stmt.get(name);
            return result.count > 0;
        } catch (error) {
            console.error('Error checking tag exists:', error);
            throw error;
        }
    }

    /**
     * 获取或创建标签
     * @param {string} name - 标签名称
     * @param {string} color - 标签颜色
     * @returns {object} 标签
     */
    getOrCreateTag(name, color = '#0078d4') {
        try {
            // 检查是否已存在
            const stmt = this.db.prepare('SELECT * FROM tags WHERE name = ?');
            const existing = stmt.get(name);

            if (existing) {
                return existing;
            }

            // 创建新标签
            return this.createTag(name, color);
        } catch (error) {
            console.error('Error getting or creating tag:', error);
            throw error;
        }
    }

    /**
     * 获取标签使用统计
     * @returns {Array} 标签统计列表
     */
    getTagStats() {
        try {
            const stmt = this.db.prepare(`
                SELECT t.*, COUNT(gt.game_id) as gameCount
                FROM tags t
                LEFT JOIN game_tags gt ON t.id = gt.tag_id
                GROUP BY t.id
                ORDER BY gameCount DESC
            `);
            return stmt.all();
        } catch (error) {
            console.error('Error getting tag stats:', error);
            throw error;
        }
    }

    /**
     * 生成标签 ID
     * @param {string} name - 标签名称
     * @returns {string} 标签 ID
     */
    generateId(name) {
        return `tag_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    }
}

module.exports = TagService;
