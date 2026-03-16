/**
 * 游戏盒子视图逻辑
 */

// 状态管理
const state = {
    boxName: '',
    boxData: null,
    games: [],
    viewMode: 'grid',
    selectedGames: new Set()
};

// DOM 元素
const elements = {
    backBtn: document.getElementById('back-btn'),
    boxTitle: document.getElementById('box-title'),
    viewToggle: document.getElementById('view-toggle'),
    gamesGrid: document.getElementById('games-grid'),
    emptyState: document.getElementById('empty-state'),
    statsBar: {
        total: document.getElementById('total-games'),
        played: document.getElementById('played-games'),
        playing: document.getElementById('playing-games'),
        unplayed: document.getElementById('unplayed-games')
    }
};

/**
 * 初始化
 */
async function init() {
    console.log('Box view initialized');

    // 获取URL参数中的盒子名称
    const urlParams = new URLSearchParams(window.location.search);
    state.boxName = urlParams.get('name');

    if (!state.boxName) {
        alert('未指定游戏盒子');
        window.close();
        return;
    }

    // 设置页面标题
    elements.boxTitle.textContent = state.boxName;

    // 绑定事件
    bindEvents();

    // 加载盒子数据
    await loadBoxData();
}

/**
 * 绑定事件
 */
function bindEvents() {
    // 返回按钮
    elements.backBtn.addEventListener('click', () => {
        window.close();
    });

    // 视图切换
    elements.viewToggle.addEventListener('click', () => {
        state.viewMode = state.viewMode === 'grid' ? 'list' : 'grid';
        elements.gamesGrid.classList.toggle('list-view');
        renderGames(state.games);
    });
}

/**
 * 加载盒子数据
 */
async function loadBoxData() {
    try {
        const boxDetail = await window.electronAPI.getBoxDetail(state.boxName);

        if (!boxDetail || boxDetail.error) {
            console.error('Error loading box:', boxDetail.error);
            alert('加载盒子失败');
            return;
        }

        state.boxData = boxDetail.data;

        // 获取所有游戏详情
        await loadGamesFromBox(boxDetail.data);
    } catch (error) {
        console.error('Error loading box data:', error);
    }
}

/**
 * 从盒子数据加载游戏
 */
async function loadGamesFromBox(boxData) {
    try {
        const allGames = await window.electronAPI.getAllGames({});
        const games = [];

        // 遍历盒子中的每个平台
        for (const [platform, platformGames] of Object.entries(boxData)) {
            if (!Array.isArray(platformGames)) continue;

            for (const boxGame of platformGames) {
                // 在所有游戏中查找对应的游戏
                const game = allGames.find(g => g.gameId === boxGame.id && g.platform === platform);

                if (game) {
                    games.push({
                        ...game,
                        boxStatus: boxGame.status,
                        boxFirstPlayed: boxGame.firstPlayed,
                        boxLastPlayed: boxGame.lastPlayed,
                        boxTotalPlayTime: boxGame.totalPlayTime,
                        boxPlayCount: boxGame.playCount
                    });
                }
            }
        }

        state.games = games;
        renderGames(games);
        updateStats(games);
    } catch (error) {
        console.error('Error loading games from box:', error);
    }
}

/**
 * 渲染游戏列表
 */
function renderGames(games) {
    if (!games || games.length === 0) {
        elements.gamesGrid.innerHTML = '';
        elements.emptyState.style.display = 'flex';
        return;
    }

    elements.emptyState.style.display = 'none';

    let html = '';

    if (state.viewMode === 'list') {
        // 列表视图
        html += `
            <div class="list-view-header">
                <div class="game-checkbox">
                    <input type="checkbox" id="select-all" ${state.selectedGames.size === games.length && games.length > 0 ? 'checked' : ''}>
                </div>
                <div class="game-icon"></div>
                <div class="game-id-col">游戏ID</div>
                <div class="game-name">名称</div>
                <div class="game-platform-info">平台</div>
                <div class="game-status">状态</div>
                <div class="game-time">时长</div>
            </div>
        `;
    }

    html += games.map(game => {
        const isSelected = state.selectedGames.has(game.gameId);

        if (state.viewMode === 'list') {
            // 列表视图
            return `
                <div class="box-game-card game-card ${isSelected ? 'selected' : ''}" data-game-id="${game.gameId}">
                    <button class="remove-btn" data-game-id="${game.gameId}" title="从盒子中移除">✕</button>
                    <div class="game-checkbox">
                        <input type="checkbox" class="game-select-checkbox" data-game-id="${game.gameId}" ${isSelected ? 'checked' : ''}>
                    </div>
                    <div class="game-icon">
                        ${game.poster ?
                            `<img src="${game.poster}" alt="${game.name}">` :
                            `<div class="game-icon-placeholder">🎮</div>`
                        }
                    </div>
                    <div class="game-id-col">${game.gameId || ''}</div>
                    <div class="game-name">
                        ${game.favorite ? '<span class="game-favorite">❤️</span>' : ''}
                        ${game.name}
                    </div>
                    <div class="game-platform-info">${getPlatformName(game.platform)}</div>
                    <div class="game-status"><span class="box-list-status ${game.boxStatus || 'unplayed'}">${getStatusText(game.boxStatus)}</span></div>
                    <div class="game-time">${formatPlaytime(game.boxTotalPlayTime)}</div>
                </div>
            `;
        } else {
            // 网格视图
            return `
                <div class="box-game-card game-card" data-game-id="${game.gameId}">
                    <button class="remove-btn" data-game-id="${game.gameId}" title="从盒子中移除">✕</button>
                    <span class="box-status-tag ${game.boxStatus || 'unplayed'}">${getStatusText(game.boxStatus)}</span>
                    ${game.poster ?
                        `<img class="game-poster" src="${game.poster}" alt="${game.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                         <div class="game-poster-placeholder" style="display:none;">🎮</div>` :
                        `<div class="game-poster-placeholder">🎮</div>`
                    }
                    <div class="game-info">
                        <div class="game-name">${game.name}</div>
                        <div class="game-platform">
                            ${game.favorite ? '<span class="game-favorite">❤️</span>' : ''}
                            <span>${getPlatformName(game.platform)}</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }).join('');

    elements.gamesGrid.innerHTML = html;

    // 绑定点击事件
    document.querySelectorAll('.box-game-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // 如果点击的是移除按钮，不打开详情
            if (e.target.classList.contains('remove-btn')) return;
            if (e.target.type === 'checkbox') return;

            const gameId = card.dataset.gameId;
            openGameDetail(gameId);
        });
    });

    // 绑定移除按钮事件
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const gameId = btn.dataset.gameId;
            await removeGameFromBox(gameId);
        });
    });
}

/**
 * 从盒子中移除游戏
 */
async function removeGameFromBox(gameId) {
    const confirmed = confirm('确定要从盒子中移除这个游戏吗？');

    if (!confirmed) return;

    try {
        // 找到游戏所在的平台
        const game = state.games.find(g => g.gameId === gameId);
        if (!game) return;

        const result = await window.electronAPI.removeGameFromBox({
            boxName: state.boxName,
            platform: game.platform,
            gameId: gameId
        });

        if (!result.error) {
            // 重新加载盒子数据
            await loadBoxData();
        } else {
            alert('移除失败: ' + result.error);
        }
    } catch (error) {
        console.error('Error removing game from box:', error);
        alert('移除失败: ' + error.message);
    }
}

/**
 * 打开游戏详情
 */
async function openGameDetail(gameId) {
    try {
        const game = state.games.find(g => g.gameId === gameId);
        if (game) {
            await window.electronAPI.openGameDetail(game);
        }
    } catch (error) {
        console.error('Error opening game detail:', error);
    }
}

/**
 * 获取状态文本
 */
function getStatusText(status) {
    const statusMap = {
        'unplayed': '未玩',
        'playing': '游戏中',
        'played': '已玩',
        'completed': '已完成'
    };
    return statusMap[status] || status;
}

/**
 * 格式化游戏时长
 */
function formatPlaytime(minutes) {
    if (!minutes || minutes === 0) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}分钟`;
    return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`;
}

/**
 * 获取平台名称
 */
function getPlatformName(platformId) {
    const platformNames = {
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
    return platformNames[platformId] || platformId;
}

/**
 * 更新统计数据
 */
function updateStats(games) {
    elements.statsBar.total.textContent = `游戏总数：${games.length}`;
    elements.statsBar.played.textContent = `已玩：${games.filter(g => g.boxStatus === 'played').length}`;
    elements.statsBar.playing.textContent = `游戏中：${games.filter(g => g.boxStatus === 'playing').length}`;
    elements.statsBar.unplayed.textContent = `未玩：${games.filter(g => g.boxStatus === 'unplayed').length}`;
}

// 初始化
document.addEventListener('DOMContentLoaded', init);
