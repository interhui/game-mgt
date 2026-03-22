/**
 * IgdbService 单元测试
 */
const IgdbService = require('../src/main/services/IgdbService');

describe('IgdbService', () => {
    let igdbService;

    beforeEach(() => {
        igdbService = new IgdbService();
    });

    describe('constructor', () => {
        test('应该正确初始化', () => {
            expect(igdbService.tokenCache).toBeDefined();
            expect(igdbService.tokenCache.accessToken).toBeNull();
            expect(igdbService.tokenCache.expiresAt).toBeNull();
        });
    });

    describe('getAccessToken', () => {
        test('应该从缓存返回 token 当 token 有效时', async () => {
            // 设置一个有效的缓存 token
            igdbService.tokenCache.accessToken = 'cached-token';
            igdbService.tokenCache.expiresAt = Date.now() + 60000; // 1分钟后过期

            const token = await igdbService.getAccessToken('test-client-id', 'test-client-secret');

            expect(token).toBe('cached-token');
        });
    });

    describe('processGameData', () => {
        test('应该正确处理游戏数据', () => {
            const rawGame = {
                name: 'Test Game',
                summary: 'Test Description',
                first_release_date: 1704067200, // 2024-01-01
                involved_companies: [{ company: { name: 'Test Publisher' } }],
                platforms: [{ name: 'PS2' }, { name: 'PS1' }],
                cover: { url: '//images.igdb.com/igdb/image/upload/t_cover_big/abc123.jpg' }
            };

            const processed = igdbService.processGameData(rawGame);

            expect(processed.name).toBe('Test Game');
            expect(processed.description).toBe('Test Description');
            expect(processed.publishDate).toBe('2024-01-01');
            expect(processed.publisher).toBe('Test Publisher');
            expect(processed.platforms).toEqual(['PS2', 'PS1']);
            expect(processed.coverUrl).toBe('https://images.igdb.com/igdb/image/upload/t_cover_big/abc123.jpg');
        });

        test('应该处理缺少可选字段的游戏数据', () => {
            const rawGame = {
                name: 'Minimal Game'
                // 所有可选字段都缺失
            };

            const processed = igdbService.processGameData(rawGame);

            expect(processed.name).toBe('Minimal Game');
            expect(processed.description).toBe('');
            expect(processed.publishDate).toBe('');
            expect(processed.publisher).toBe('');
            expect(processed.platforms).toEqual([]);
            expect(processed.coverUrl).toBe('');
        });

        test('应该处理没有发行商的游戏数据', () => {
            const rawGame = {
                name: 'Game Without Publisher',
                first_release_date: 1704067200
                // involved_companies 为空或未定义
            };

            const processed = igdbService.processGameData(rawGame);

            expect(processed.publisher).toBe('');
        });

        test('应该处理没有 platforms 的游戏数据', () => {
            const rawGame = {
                name: 'Game Without Platforms',
                platforms: null
            };

            const processed = igdbService.processGameData(rawGame);

            expect(processed.platforms).toEqual([]);
        });

        test('应该处理没有 cover 的游戏数据', () => {
            const rawGame = {
                name: 'Game Without Cover',
                cover: null
            };

            const processed = igdbService.processGameData(rawGame);

            expect(processed.coverUrl).toBe('');
        });

        test('应该处理没有 involved_companies 的游戏数据', () => {
            const rawGame = {
                name: 'Game Without Companies',
                involved_companies: null
            };

            const processed = igdbService.processGameData(rawGame);

            expect(processed.publisher).toBe('');
        });

        test('应该处理没有 release_dates 的游戏数据', () => {
            const rawGame = {
                name: 'Game Without Release Date'
            };

            const processed = igdbService.processGameData(rawGame);

            expect(processed.publishDate).toBe('');
        });
    });

    describe('clearTokenCache', () => {
        test('应该清除 token 缓存', () => {
            igdbService.tokenCache.accessToken = 'some-token';
            igdbService.tokenCache.expiresAt = Date.now() + 60000;

            igdbService.clearTokenCache();

            expect(igdbService.tokenCache.accessToken).toBeNull();
            expect(igdbService.tokenCache.expiresAt).toBeNull();
        });
    });
});
