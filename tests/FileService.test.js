/**
 * FileService 单元测试
 */
const FileService = require('../src/main/services/FileService');
const path = require('path');
const fs = require('fs');

// 创建测试目录和文件
const testDir = path.join(__dirname, 'test-data');
const testGameDir = path.join(testDir, 'ps2', 'test-game');

describe('FileService', () => {
    let fileService;

    beforeAll(async () => {
        fileService = new FileService();

        // 创建测试目录结构
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }
        if (!fs.existsSync(testGameDir)) {
            fs.mkdirSync(testGameDir, { recursive: true });
        }

        // 创建测试 game.json
        const gameData = {
            name: 'Test Game',
            platform: 'ps2',
            status: 'unplayed'
        };
        fs.writeFileSync(
            path.join(testGameDir, 'game.json'),
            JSON.stringify(gameData, null, 2)
        );

        // 创建测试海报
        fs.writeFileSync(
            path.join(testGameDir, 'poster.jpg'),
            'test-image-data'
        );
    });

    afterAll(async () => {
        // 清理测试目录
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    });

    describe('fileExists', () => {
        test('应该返回 true 当文件存在', async () => {
            const exists = await fileService.fileExists(__filename);
            expect(exists).toBe(true);
        });

        test('当文件不存在时应该返回 false', async () => {
            const exists = await fileService.fileExists(path.join(__dirname, 'non-existent-file.txt'));
            expect(exists).toBe(false);
        });
    });

    describe('readGameJson', () => {
        test('应该正确读取 game.json', async () => {
            const gameData = await fileService.readGameJson(testGameDir);
            expect(gameData).toBeDefined();
            expect(gameData.name).toBe('Test Game');
            expect(gameData.platform).toBe('ps2');
        });

        test('当 game.json 不存在时应该返回 null', async () => {
            const gameData = await fileService.readGameJson(testDir);
            expect(gameData).toBeNull();
        });
    });

    describe('writeGameJson', () => {
        test('应该正确写入 game.json', async () => {
            const newGameData = {
                name: 'New Game',
                platform: 'ps2',
                status: 'playing',
                userRating: 5
            };

            const newGameDir = path.join(testDir, 'ps2', 'new-game');
            fs.mkdirSync(newGameDir, { recursive: true });

            await fileService.writeGameJson(newGameDir, newGameData);

            const readData = await fileService.readGameJson(newGameDir);
            expect(readData.name).toBe('New Game');
            expect(readData.userRating).toBe(5);
        });
    });

    describe('getSimulatorFolders', () => {
        test('应该返回目录中的文件夹列表', async () => {
            const folders = await fileService.getSimulatorFolders(path.join(testDir, 'ps2'));
            expect(Array.isArray(folders)).toBe(true);
        });
    });

    describe('getGameFolders', () => {
        test('应该返回游戏文件夹及其路径', async () => {
            const gameFolders = await fileService.getGameFolders(path.join(testDir, 'ps2'));
            expect(typeof gameFolders).toBe('object');
            expect(gameFolders['test-game']).toBeDefined();
        });
    });

    describe('readJson / writeJson', () => {
        test('应该正确读取和写入 JSON 文件', async () => {
            const testFile = path.join(testDir, 'test.json');
            const testData = { foo: 'bar', num: 123 };

            await fileService.writeJson(testFile, testData);
            const readData = await fileService.readJson(testFile);

            expect(readData.foo).toBe('bar');
            expect(readData.num).toBe(123);

            // 清理
            fs.unlinkSync(testFile);
        });
    });

    describe('getFileExtension', () => {
        test('应该正确返回文件扩展名', () => {
            expect(fileService.getFileExtension('test.jpg')).toBe('.jpg');
            expect(fileService.getFileExtension('test.PNG')).toBe('.png');
            expect(fileService.getFileExtension('noextension')).toBe('');
        });
    });

    describe('getMimeType', () => {
        test('应该返回正确的 MIME 类型', () => {
            expect(fileService.getMimeType('.jpg')).toBe('image/jpeg');
            expect(fileService.getMimeType('.png')).toBe('image/png');
            expect(fileService.getMimeType('.gif')).toBe('image/gif');
            expect(fileService.getMimeType('.unknown')).toBe('application/octet-stream');
        });
    });

    describe('createDir / deleteDir', () => {
        test('应该创建和删除目录', async () => {
            const newDir = path.join(testDir, 'new-directory');

            await fileService.createDir(newDir);
            const exists = await fileService.fileExists(newDir);
            expect(exists).toBe(true);

            await fileService.deleteDir(newDir);
            const existsAfter = await fileService.fileExists(newDir);
            expect(existsAfter).toBe(false);
        });
    });
});
