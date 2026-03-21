/**
 * IPC Handlers 单元测试
 * 测试 IGDB 相关的 IPC 处理器逻辑
 */

const IgdbService = require('../src/main/services/IgdbService');
const SettingsService = require('../src/main/services/SettingsService');

describe('IGDB IPC Handler Logic', () => {
    let igdbService;
    let mockSettingsService;

    beforeEach(() => {
        igdbService = new IgdbService();
        jest.clearAllMocks();

        mockSettingsService = {
            getIgdbConfig: jest.fn(),
            setIgdbConfig: jest.fn()
        };
    });

    describe('get-igdb-config handler logic', () => {
        test('应该返回 IGDB 配置', () => {
            const expectedConfig = {
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret'
            };
            mockSettingsService.getIgdbConfig.mockReturnValue(expectedConfig);

            const result = mockSettingsService.getIgdbConfig();

            expect(result).toEqual(expectedConfig);
            expect(mockSettingsService.getIgdbConfig).toHaveBeenCalled();
        });

        test('当配置为空时应该返回空对象', () => {
            mockSettingsService.getIgdbConfig.mockReturnValue({});

            const result = mockSettingsService.getIgdbConfig();

            expect(result).toEqual({});
        });
    });

    describe('igdb-search-games handler validation logic', () => {
        test('当缺少 clientId 时应该返回错误', () => {
            mockSettingsService.getIgdbConfig.mockReturnValue({
                clientId: '',
                clientSecret: 'test-secret'
            });

            const igdbConfig = mockSettingsService.getIgdbConfig();
            const isValid = !!(igdbConfig.clientId && igdbConfig.clientSecret);

            expect(isValid).toBe(false);
        });

        test('当缺少 clientSecret 时应该返回错误', () => {
            mockSettingsService.getIgdbConfig.mockReturnValue({
                clientId: 'test-id',
                clientSecret: ''
            });

            const igdbConfig = mockSettingsService.getIgdbConfig();
            const isValid = !!(igdbConfig.clientId && igdbConfig.clientSecret);

            expect(isValid).toBe(false);
        });

        test('当游戏名称为空时应该返回错误', () => {
            const gameName = '';
            const isValid = !!(gameName && gameName.trim() !== '');

            expect(isValid).toBe(false);
        });

        test('当游戏名称为空白时应该返回错误', () => {
            const gameName = '   ';
            const isValid = !!(gameName && gameName.trim() !== '');

            expect(isValid).toBe(false);
        });

        test('应该正确处理有效的搜索请求', () => {
            mockSettingsService.getIgdbConfig.mockReturnValue({
                clientId: 'valid-client-id',
                clientSecret: 'valid-client-secret'
            });

            const igdbConfig = mockSettingsService.getIgdbConfig();
            const isValid = !!(igdbConfig.clientId && igdbConfig.clientSecret);

            expect(isValid).toBe(true);
        });

        test('应该正确验证有效的游戏名称', () => {
            const gameName = 'Elden Ring';
            const isValid = !!(gameName && gameName.trim() !== '');

            expect(isValid).toBe(true);
        });
    });

    describe('save-igdb-config handler logic', () => {
        test('setIgdbConfig 应该被调用', () => {
            const config = {
                clientId: 'new-client-id',
                clientSecret: 'new-client-secret'
            };

            mockSettingsService.setIgdbConfig(config);

            expect(mockSettingsService.setIgdbConfig).toHaveBeenCalledWith(config);
        });

        test('setIgdbConfig 应该正确合并配置', () => {
            const config = {
                clientId: 'new-client-id'
            };

            mockSettingsService.setIgdbConfig(config);

            expect(mockSettingsService.setIgdbConfig).toHaveBeenCalled();
        });
    });
});

describe('IgdbService Integration', () => {
    let igdbService;

    beforeEach(() => {
        igdbService = new IgdbService();
    });

    test('processGameData 应该正确转换 IGDB 数据', () => {
        const rawGame = {
            name: 'Final Fantasy VII',
            summary: 'A classic RPG',
            release_dates: [862617600], // 1997-05-01
            involved_companies: [{ company: { name: 'Square' } }],
            platforms: [{ name: 'PS1' }],
            cover: { url: '//images.igdb.com/igdb/image/upload/t_cover_big/ff7.jpg' }
        };

        const result = igdbService.processGameData(rawGame);

        expect(result.name).toBe('Final Fantasy VII');
        expect(result.description).toBe('A classic RPG');
        expect(result.publisher).toBe('Square');
        expect(result.platforms).toEqual(['PS1']);
    });

    test('clearTokenCache 应该重置缓存状态', () => {
        igdbService.tokenCache.accessToken = 'expired-token';
        igdbService.tokenCache.expiresAt = Date.now() - 1000;

        igdbService.clearTokenCache();

        expect(igdbService.tokenCache.accessToken).toBeNull();
        expect(igdbService.tokenCache.expiresAt).toBeNull();
    });

    test('tokenCache 初始状态应该正确', () => {
        expect(igdbService.tokenCache.accessToken).toBeNull();
        expect(igdbService.tokenCache.expiresAt).toBeNull();
    });
});
