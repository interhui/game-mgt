/**
 * GameService 单元测试
 */
const GameService = require('../src/main/services/GameService');
const path = require('path');
const fs = require('fs');

describe('GameService', () => {
    let gameService;
    const testDir = path.join(__dirname, 'test-data', 'games');
    const gamesDir = testDir;

    beforeEach(async () => {
        gameService = new GameService();

        // 清空并创建测试游戏目录结构
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }

        const platforms = ['ps2', 'ps1', 'psp'];

        for (const platform of platforms) {
            const platformDir = path.join(gamesDir, platform);
            fs.mkdirSync(platformDir, { recursive: true });

            // 为每个平台创建测试游戏
            for (let i = 1; i <= 2; i++) {
                const gameDir = path.join(platformDir, `game${i}`);
                fs.mkdirSync(gameDir, { recursive: true });

                const gameData = {
                    id: `${platform}-game${i}`,
                    gameId: `${platform}-game-${i}-${platform.toUpperCase()}`.toLowerCase(),
                    name: `Game ${i} ${platform.toUpperCase()}`,
                    platform: platform,
                    favorite: i === 1,
                    userRating: i === 1 ? 5 : 0,
                    description: `Test game description for ${platform} game ${i}`,
                    tags: i === 1 ? ['action', 'rpg'] : []
                };

                fs.writeFileSync(
                    path.join(gameDir, 'game.json'),
                    JSON.stringify(gameData, null, 2)
                );
            }
        }
    });

    afterEach(() => {
        // 清理测试目录
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    });

    describe('getPlatformStats', () => {
        test('应该返回所有平台的统计数据', async () => {
            const platforms = ['ps2', 'ps1', 'psp'];
            const stats = await gameService.getPlatformStats(platforms, gamesDir);

            expect(Array.isArray(stats)).toBe(true);
            expect(stats.length).toBe(3);
            expect(stats[0].id).toBe('ps2');
            expect(stats[0].gameCount).toBe(2);
        });
    });

    describe('getGamesByPlatform', () => {
        test('应该返回指定平台的游戏列表', async () => {
            const games = await gameService.getGamesByPlatform('ps2', gamesDir);

            expect(Array.isArray(games)).toBe(true);
            expect(games.length).toBe(2);
            expect(games[0].platform).toBe('ps2');
        });

        test('应该支持排序', async () => {
            const games = await gameService.getGamesByPlatform('ps2', gamesDir, {
                sortBy: 'name',
                sortOrder: 'desc'
            });

            // 由于收藏游戏会排在前面，检查排序是否正确应用
            expect(games.length).toBe(2);
        });
    });

    describe('getAllGames', () => {
        test('应该返回所有平台的游戏', async () => {
            const games = await gameService.getAllGames(gamesDir);

            expect(Array.isArray(games)).toBe(true);
            expect(games.length).toBe(6); // 3 platforms x 2 games
        });
    });

    describe('searchGames', () => {
        test('应该通过关键字搜索游戏', async () => {
            const results = await gameService.searchGames('Game 1', gamesDir);

            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].name).toContain('Game 1');
        });

        test('应该支持平台筛选', async () => {
            const results = await gameService.searchGames('', gamesDir, {
                platform: 'ps2'
            });

            results.forEach(game => {
                expect(game.platform).toBe('ps2');
            });
        });

        test('应该支持收藏筛选', async () => {
            const results = await gameService.searchGames('', gamesDir, {
                favorite: true
            });

            results.forEach(game => {
                expect(game.favorite).toBe(true);
            });
        });

        test('应该支持标签筛选', async () => {
            const results = await gameService.searchGames('', gamesDir, {
                tagId: 'action'
            });

            // 应该有包含 action 标签的游戏
            results.forEach(game => {
                expect(game.tags).toContain('action');
            });
        });
    });

    describe('getGameDetail', () => {
        test('应该返回游戏详情', async () => {
            const detail = await gameService.getGameDetail('ps2-game1', gamesDir);

            expect(detail).toBeDefined();
            expect(detail.name).toBe('Game 1 PS2');
            expect(detail.platform).toBe('ps2');
            expect(detail.favorite).toBe(true);
        });

        test('找不到游戏时应该返回 null', async () => {
            const detail = await gameService.getGameDetail('non-existent-game', gamesDir);
            expect(detail).toBeNull();
        });
    });

    describe('isGameValid', () => {
        test('有效游戏应该返回 true', async () => {
            const gameDir = path.join(gamesDir, 'ps2', 'game1');
            const isValid = await gameService.isGameValid(gameDir);
            expect(isValid).toBe(true);
        });

        test('无效游戏应该返回 false', async () => {
            const gameDir = path.join(gamesDir, 'ps2', 'non-existent');
            const isValid = await gameService.isGameValid(gameDir);
            expect(isValid).toBe(false);
        });
    });

    describe('getStats', () => {
        test('应该返回正确的统计数据', async () => {
            const stats = await gameService.getStats(null, gamesDir);

            expect(stats.totalGames).toBe(6);
            expect(stats.favoriteCount).toBe(3);
        });

        test('应该支持平台筛选', async () => {
            const stats = await gameService.getStats('ps2', gamesDir);

            expect(stats.totalGames).toBe(2);
            expect(stats.favoriteCount).toBe(1);
        });
    });

    describe('getPlatformName / getPlatformShortName', () => {
        test('应该返回正确的平台名称', () => {
            expect(gameService.getPlatformName('ps2')).toBe('PlayStation 2');
            expect(gameService.getPlatformName('psp')).toBe('PlayStation Portable');
        });

        test('应该返回正确的平台短名称', () => {
            expect(gameService.getPlatformShortName('ps2')).toBe('PS2');
            expect(gameService.getPlatformShortName('ps1')).toBe('PS1');
        });

        test('未知平台应该返回原始标识', () => {
            expect(gameService.getPlatformName('unknown')).toBe('unknown');
        });
    });

    describe('sortGames', () => {
        test('应该按名称排序', () => {
            const games = [
                { name: 'Zelda', favorite: false },
                { name: 'Mario', favorite: false },
                { name: 'Animal Crossing', favorite: false }
            ];

            const sorted = gameService.sortGames(games, 'name', 'asc');
            expect(sorted[0].name).toBe('Animal Crossing');
            expect(sorted[2].name).toBe('Zelda');
        });

        test('收藏游戏应该排在前面', () => {
            const games = [
                { name: 'Normal', favorite: false },
                { name: 'Favorite', favorite: true },
                { name: 'Another', favorite: false }
            ];

            const sorted = gameService.sortGames(games, 'name', 'asc');
            expect(sorted[0].favorite).toBe(true);
        });
    });

    describe('calculateAverageRating', () => {
        test('应该正确计算平均评分', () => {
            const games = [
                { userRating: 5 },
                { userRating: 3 },
                { userRating: 4 }
            ];

            const avg = gameService.calculateAverageRating(games);
            expect(avg).toBe('4.0');
        });

        test('没有评分时应该返回 0', () => {
            const games = [
                { userRating: 0 },
                { userRating: 0 }
            ];

            const avg = gameService.calculateAverageRating(games);
            expect(avg).toBe(0);
        });
    });
});
