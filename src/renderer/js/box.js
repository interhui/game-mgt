/**
 * 游戏盒子视图逻辑
 */

// 状态管理
const state = {
    boxName: '',
    boxData: null,
    games: [],
    platforms: [],         // 盒子中的平台列表
    currentPlatform: '',    // 当前选中的平台（左侧栏过滤）
    currentStatus: '',      // 当前选中的状态
    currentSort: 'name-asc',
    searchKeyword: '',
    viewMode: 'grid',
    selectedGames: new Set()
};

// DOM 元素
const elements = {
    backBtn: document.getElementById('back-btn'),
    boxTitle: document.getElementById('box-title'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    viewToggle: document.getElementById('view-toggle'),
    gamesGrid: document.getElementById('games-grid'),
    emptyState: document.getElementById('empty-state'),
    statsBar: {
        total: document.getElementById('total-games'),
        played: document.getElementById('played-games'),
        playing: document.getElementById('playing-games'),
        unplayed: document.getElementById('unplayed-games')
    },
    platformList: document.getElementById('platform-list'),
    platformFilter: document.getElementById('platform-filter'),
    statusFilter: document.getElementById('status-filter'),
    sortSelect: document.getElementById('sort-select')
};

// 平台名称映射
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

    // 搜索
    elements.searchBtn.addEventListener('click', () => {
        state.searchKeyword = elements.searchInput.value.trim();
        renderGames(state.games);
        updateClearButtonVisibility();
    });

    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            state.searchKeyword = e.target.value.trim();
            renderGames(state.games);
            updateClearButtonVisibility();
        }
    });

    // 清除搜索
    elements.clearSearchBtn.addEventListener('click', () => {
        elements.searchInput.value = '';
        state.searchKeyword = '';
        renderGames(state.games);
        updateClearButtonVisibility();
    });

    function updateClearButtonVisibility() {
        if (state.searchKeyword) {
            elements.clearSearchBtn.style.display = 'block';
        } else {
            elements.clearSearchBtn.style.display = 'none';
        }
    }

    // 视图切换
    elements.viewToggle.addEventListener('click', () => {
        state.viewMode = state.viewMode === 'grid' ? 'list' : 'grid';
        elements.gamesGrid.classList.toggle('list-view');
        renderGames(state.games);
    });

    // 平台筛选下拉框
    elements.platformFilter.addEventListener('change', (e) => {
        state.currentPlatform = e.target.value;

        // 更新左侧栏选中状态
        document.querySelectorAll('.box-platform-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.platform === state.currentPlatform) {
                item.classList.add('active');
            }
        });
        if (!state.currentPlatform) {
            document.querySelector('.box-platform-item[data-platform=""]')?.classList.add('active');
        }

        renderGames(state.games);
    });

    // 状态筛选
    elements.statusFilter.addEventListener('change', (e) => {
        state.currentStatus = e.target.value;
        renderGames(state.games);
    });

    // 排序
    elements.sortSelect.addEventListener('change', (e) => {
        state.currentSort = e.target.value;
        renderGames(state.games);
    });
}

/**
 * 更新清除按钮可见性
 */
function updateClearButtonVisibility() {
    if (state.searchKeyword) {
        elements.clearSearchBtn.style.display = 'block';
    } else {
        elements.clearSearchBtn.style.display = 'none';
    }
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
        const platformsSet = new Set();

        // 遍历盒子中的每个平台
        for (const [platform, platformGames] of Object.entries(boxData)) {
            if (!Array.isArray(platformGames)) continue;
            platformsSet.add(platform);

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
        state.platforms = Array.from(platformsSet);

        // 更新平台列表（左侧栏）
        updatePlatformList();

        // 更新平台筛选下拉框
        updatePlatformFilter();

        // 渲染游戏
        renderGames(games);

        // 更新统计
        updateStats(games);
    } catch (error) {
        console.error('Error loading games from box:', error);
    }
}

/**
 * 更新平台列表（左侧栏）
 */
function updatePlatformList() {
    const totalCount = state.games.length;
    let html = `
        <li class="box-platform-item active" data-platform="">
            <span class="platform-name">全部</span>
            <span class="game-count">${totalCount}</span>
        </li>
    `;

    state.platforms.forEach(platform => {
        const count = state.games.filter(g => g.platform === platform).length;
        const name = platformNames[platform] || platform;
        html += `
            <li class="box-platform-item" data-platform="${platform}">
                <span class="platform-name">${name}</span>
                <span class="game-count">${count}</span>
            </li>
        `;
    });

    elements.platformList.innerHTML = html;

    // 绑定点击事件
    document.querySelectorAll('.box-platform-item').forEach(item => {
        item.addEventListener('click', () => {
            // 清除选中状态
            document.querySelectorAll('.box-platform-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // 更新下拉框
            state.currentPlatform = item.dataset.platform;
            elements.platformFilter.value = state.currentPlatform;

            // 重新渲染
            renderGames(state.games);
        });
    });
}

/**
 * 更新平台筛选下拉框
 */
function updatePlatformFilter() {
    elements.platformFilter.innerHTML = '<option value="">全部平台</option>';
    state.platforms.forEach(platform => {
        const count = state.games.filter(g => g.platform === platform).length;
        const name = platformNames[platform] || platform;
        const option = document.createElement('option');
        option.value = platform;
        option.textContent = `${name} (${count})`;
        elements.platformFilter.appendChild(option);
    });
}

/**
 * 渲染游戏列表
 */
function renderGames(games) {
    // 应用过滤
    let filteredGames = games;

    // 平台过滤
    if (state.currentPlatform) {
        filteredGames = filteredGames.filter(g => g.platform === state.currentPlatform);
    }

    // 状态过滤
    if (state.currentStatus) {
        filteredGames = filteredGames.filter(g => g.boxStatus === state.currentStatus);
    }

    // 搜索过滤（名称、描述、标签）
    if (state.searchKeyword) {
        const keyword = state.searchKeyword.toLowerCase();
        filteredGames = filteredGames.filter(g =>
            g.name.toLowerCase().includes(keyword) ||
            (g.description && g.description.toLowerCase().includes(keyword)) ||
            (g.tags && g.tags.some(tag => tag.toLowerCase().includes(keyword)))
        );
    }

    // 排序
    const [sortBy, sortOrder] = state.currentSort.split('-');
    filteredGames = sortGames(filteredGames, sortBy, sortOrder);

    if (!filteredGames || filteredGames.length === 0) {
        elements.gamesGrid.innerHTML = '';
        elements.gamesGrid.classList.remove('list-view');
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
                    <input type="checkbox" id="select-all" ${state.selectedGames.size === filteredGames.length && filteredGames.length > 0 ? 'checked' : ''}>
                </div>
                <div class="game-action-col">操作</div>
                <div class="game-icon"></div>
                <div class="game-id-col">游戏ID</div>
                <div class="game-name">名称</div>
                <div class="game-description-col">描述</div>
                <div class="game-publish-date">发行时间</div>
                <div class="game-time">游戏时间</div>
                <div class="game-last-played">最后游戏</div>
                <div class="game-status">状态</div>
                <div class="game-rating">评分</div>
            </div>
        `;
    }

    html += filteredGames.map(game => {
        const isSelected = state.selectedGames.has(game.gameId);

        if (state.viewMode === 'list') {
            // 列表视图
            return `
                <div class="box-game-card game-card ${isSelected ? 'selected' : ''}" data-game-id="${game.gameId}">
                    <div class="game-checkbox">
                        <input type="checkbox" class="game-select-checkbox" data-game-id="${game.gameId}" ${isSelected ? 'checked' : ''}>
                    </div>
                    <div class="game-action-col">
                        <button class="remove-btn" data-game-id="${game.gameId}" title="从盒子中移除">✕</button>
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
                    <div class="game-description-col">${game.description ? (game.description.length > 20 ? game.description.substring(0, 20) + '...' : game.description) : '-'}</div>
                    <div class="game-publish-date">${game.publishDate || '-'}</div>
                    <div class="game-time">${formatPlaytime(game.boxTotalPlayTime)}</div>
                    <div class="game-last-played">${game.boxLastPlayed || '-'}</div>
                    <div class="game-status"><span class="box-list-status ${game.boxStatus || 'unplayed'}">${getStatusText(game.boxStatus)}</span></div>
                    <div class="game-rating">${game.userRating ? '⭐'.repeat(game.userRating) : '-'}</div>
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
                            <span>${platformNames[game.platform] || game.platform}</span>
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

    // 绑定全选复选框事件
    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                filteredGames.forEach(game => state.selectedGames.add(game.gameId));
            } else {
                state.selectedGames.clear();
            }
            renderGames(state.games);
        });
    }

    // 绑定单个复选框事件
    document.querySelectorAll('.game-select-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const gameId = checkbox.dataset.gameId;
            if (checkbox.checked) {
                state.selectedGames.add(gameId);
            } else {
                state.selectedGames.delete(gameId);
            }
            updateSelectAllState();
        });
    });
}

/**
 * 更新全选复选框状态
 */
function updateSelectAllState() {
    const selectAllCheckbox = document.getElementById('select-all');
    const checkboxes = document.querySelectorAll('.game-select-checkbox');
    if (selectAllCheckbox && checkboxes.length > 0) {
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        selectAllCheckbox.checked = allChecked;
    }
}

/**
 * 对游戏列表进行排序
 */
function sortGames(games, sortBy = 'name', sortOrder = 'asc') {
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
