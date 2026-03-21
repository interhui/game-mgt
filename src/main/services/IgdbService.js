/**
 * IGDB 服务
 * 负责与 IGDB API 交互，获取游戏信息
 */
const https = require('https');
const http = require('http');

class IgdbService {
    constructor() {
        // Token 缓存
        this.tokenCache = {
            accessToken: null,
            expiresAt: null
        };

        // IGDB API 基础 URL
        this.igdbApiUrl = 'api.igdb.com';
        this.igdbTokenUrl = 'id.twitch.tv';
    }

    /**
     * 获取 IGDB Access Token
     * @param {string} clientId - Twitch Client ID
     * @param {string} clientSecret - Twitch Client Secret
     * @returns {Promise<string>} Access Token
     */
    async getAccessToken(clientId, clientSecret) {
        // 检查缓存是否有效
        if (this.tokenCache.accessToken && this.tokenCache.expiresAt > Date.now()) {
            return this.tokenCache.accessToken;
        }

        return new Promise((resolve, reject) => {
            const params = new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'client_credentials'
            });

            const options = {
                hostname: this.igdbTokenUrl,
                path: '/oauth2/token?' + params.toString(),
                method: 'POST'
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);

                        if (result.error) {
                            reject(new Error(result.message || 'Failed to get access token'));
                            return;
                        }

                        // 缓存 token
                        this.tokenCache.accessToken = result.access_token;
                        // 设置过期时间（提前5分钟过期以防边界问题）
                        this.tokenCache.expiresAt = Date.now() + (result.expires_in - 300) * 1000;

                        resolve(result.access_token);
                    } catch (error) {
                        reject(new Error('Failed to parse token response: ' + error.message));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error('Network error: ' + error.message));
            });

            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    }

    /**
     * 搜索游戏
     * @param {string} accessToken - IGDB Access Token
     * @param {string} clientId - Twitch Client ID
     * @param {string} gameName - 游戏名称
     * @returns {Promise<Array>} 游戏列表
     */
    async searchGames(accessToken, clientId, gameName) {
        return new Promise((resolve, reject) => {
            // 请求体严格按照要求
            const body = `search "${gameName}"; fields name,summary,platforms.name,videos,language_supports.language,cover.url,screenshots,release_dates,involved_companies.company.name;`;

            const options = {
                hostname: this.igdbApiUrl,
                path: '/v4/games',
                method: 'POST',
                headers: {
                    'Client-ID': clientId,
                    'Authorization': 'Bearer ' + accessToken,
                    'Content-Type': 'text/plain',
                    'Content-Length': Buffer.byteLength(body)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const games = JSON.parse(data);

                        // 处理游戏数据，转换为统一格式
                        const processedGames = games.map(game => this.processGameData(game));

                        resolve(processedGames);
                    } catch (error) {
                        reject(new Error('Failed to parse games response: ' + error.message));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error('Network error: ' + error.message));
            });

            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.write(body);
            req.end();
        });
    }

    /**
     * 处理游戏数据，转换为统一格式
     * @param {object} game - IGDB 游戏数据
     * @returns {object} 处理后的游戏数据
     */
    processGameData(game) {
        // 转换发行日期
        let publishDate = '';
        if (game.release_dates && game.release_dates.length > 0) {
            const timestamp = game.release_dates[0];
            const date = new Date(timestamp * 1000);
            publishDate = date.toISOString().split('T')[0]; // yyyy-MM-dd 格式
        }

        // 获取发行商
        let publisher = '';
        if (game.involved_companies && game.involved_companies.length > 0) {
            publisher = game.involved_companies[0].company?.name || '';
        }

        // 获取平台列表
        let platforms = [];
        if (game.platforms) {
            platforms = game.platforms.map(p => p.name || '');
        }

        // 获取封面 URL
        let coverUrl = '';
        if (game.cover) {
            // IGDB 封面 URL 格式：//images.igdb.com/igdb/image/upload/t_cover_big/xxx.jpg
            // 转换为 https://
            coverUrl = 'https:' + game.cover.url;
        }

        return {
            name: game.name || '',
            description: game.summary || '',
            platforms: platforms,
            publishDate: publishDate,
            publisher: publisher,
            coverUrl: coverUrl
        };
    }

    /**
     * 清除 token 缓存
     */
    clearTokenCache() {
        this.tokenCache.accessToken = null;
        this.tokenCache.expiresAt = null;
    }
}

module.exports = IgdbService;
