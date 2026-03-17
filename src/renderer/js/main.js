/**
 * 主界面逻辑
 */

// 状态管理
const state = {
    platforms: [],
    boxes: [],
    games: [],
    currentPlatform: '',
    currentBox: '',
    currentSort: 'name-asc',
    searchKeyword: '',
    viewMode: 'grid',
    settings: {},
    selectedGames: new Set()
};

// DOM 元素
const elements = {
    platformFilter: document.getElementById('platform-filter'),
    sortSelect: document.getElementById('sort-select'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    viewToggle: document.getElementById('view-toggle'),
    settingsBtn: document.getElementById('settings-btn'),
    platformList: document.getElementById('platform-list'),
    boxList: document.getElementById('box-list'),
    gamesGrid: document.getElementById('games-grid'),
    emptyState: document.getElementById('empty-state'),
    statsBar: {
        total: document.getElementById('total-games'),
        played: document.getElementById('played-games'),
        playing: document.getElementById('playing-games'),
        unplayed: document.getElementById('unplayed-games')
    },
    settingsModal: document.getElementById('settings-modal'),
    closeSettings: document.getElementById('close-settings'),
    saveSettings: document.getElementById('save-settings'),
    cancelSettings: document.getElementById('cancel-settings'),
    themeSelect: document.getElementById('theme-select'),
    sidebarWidth: document.getElementById('sidebar-width'),
    posterSize: document.getElementById('poster-size'),
    gamesDirInput: document.getElementById('games-dir-input'),
    selectDirBtn: document.getElementById('select-dir-btn'),
    gameboxDirInput: document.getElementById('gamebox-dir-input'),
    selectGameboxDirBtn: document.getElementById('select-gamebox-dir-btn'),
    addBoxBtn: document.getElementById('add-box-btn'),
    boxList: document.getElementById('box-list'),
    createBoxModal: document.getElementById('create-box-modal'),
    boxNameInput: document.getElementById('box-name-input'),
    confirmCreateBox: document.getElementById('confirm-create-box'),
    cancelCreateBox: document.getElementById('cancel-create-box'),
    closeCreateBox: document.getElementById('close-create-box')
};

/**
 * 初始化应用
 */
async function init() {
    console.log('Initializing app...');

    // 加载设置
    await loadSettings();

    // 加载平台列表
    await loadPlatforms();

    // 加载盒子列表
    await loadBoxes();

    // 加载游戏
    await loadGames();

    // 绑定事件
    bindEvents();

    // 加载统计数据
    await loadStats();

    console.log('App initialized');
}

/**
 * 加载设置
 */
async function loadSettings() {
    try {
        state.settings = await window.electronAPI.getSettings();

        // 应用主题
        applyTheme(state.settings.appearance.theme);

        // 应用布局设置
        applyLayoutSettings(state.settings.layout);

        // 更新设置表单
        elements.themeSelect.value = state.settings.appearance.theme;
        elements.sidebarWidth.value = state.settings.layout.sidebarWidth;
        elements.posterSize.value = state.settings.layout.posterSize || 'medium';
        elements.gamesDirInput.value = state.settings.library.gamesDir;
        elements.gameboxDirInput.value = state.settings.gamebox.gameboxDir;

        state.viewMode = state.settings.layout.viewMode;
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

/**
 * 应用主题
 */
function applyTheme(theme) {
    const link = document.querySelector('link[rel="stylesheet"]');
    if (theme === 'light') {
        link.href = 'css/themes/light.css';
    } else {
        link.href = 'css/themes/dark.css';
    }
}

/**
 * 应用布局设置
 */
function applyLayoutSettings(layout) {
    document.documentElement.style.setProperty('--sidebar-width', `${layout.sidebarWidth}px`);
    document.documentElement.style.setProperty('--poster-min-width', getPosterMinSize(layout.posterSize));
    document.documentElement.style.setProperty('--poster-max-width', getPosterMaxSize(layout.posterSize));

    // 使用 CSS Grid 的自动填充实现响应式布局
    // 不再使用固定列数，让浏览器根据窗口大小自动计算

    if (layout.viewMode === 'list') {
        elements.gamesGrid.classList.add('list-view');
    } else {
        elements.gamesGrid.classList.remove('list-view');
    }
}

/**
 * 获取海报尺寸
 */
function getPosterSize(size) {
    const sizes = {
        small: '120px',
        medium: '180px',
        large: '240px'
    };
    return sizes[size] || sizes.medium;
}

/**
 * 获取海报最小尺寸（用于自动响应式计算）
 */
function getPosterMinSize(size) {
    const sizes = {
        small: '100px',
        medium: '140px',
        large: '180px'
    };
    return sizes[size] || sizes.medium;
}

/**
 * 获取海报最大尺寸
 */
function getPosterMaxSize(size) {
    const sizes = {
        small: '150px',
        medium: '220px',
        large: '280px'
    };
    return sizes[size] || sizes.medium;
}

/**
 * 加载平台列表
 */
async function loadPlatforms() {
    try {
        const platforms = await window.electronAPI.getPlatforms();

        if (platforms.error) {
            console.error('Error loading platforms:', platforms.error);
            return;
        }

        state.platforms = platforms;

        // 更新筛选下拉框
        updatePlatformFilter(platforms);

        // 更新侧边栏
        updateSidebar(platforms);
    } catch (error) {
        console.error('Error loading platforms:', error);
    }
}

/**
 * 更新平台筛选下拉框
 */
function updatePlatformFilter(platforms) {
    elements.platformFilter.innerHTML = '<option value="">全部平台</option>';
    platforms.forEach(platform => {
        const option = document.createElement('option');
        option.value = platform.id;
        option.textContent = `${platform.name} (${platform.gameCount})`;
        elements.platformFilter.appendChild(option);
    });
}

/**
 * 更新侧边栏
 */
function updateSidebar(platforms) {
    let html = `
        <li class="platform-item active" data-platform="">
            <span class="platform-name">全部平台</span>
            <span class="game-count">${getTotalGameCount(platforms)}</span>
        </li>
    `;

    platforms.forEach(platform => {
        html += `
            <li class="platform-item" data-platform="${platform.id}">
                <span class="platform-name">${platform.name}</span>
                <span class="game-count">${platform.gameCount}</span>
            </li>
        `;
    });

    elements.platformList.innerHTML = html;

    // 绑定点击事件
    document.querySelectorAll('.platform-item').forEach(item => {
        item.addEventListener('click', () => {
            // 清除平台选中状态
            document.querySelectorAll('.platform-item').forEach(i => i.classList.remove('active'));
            // 清除盒子选中状态
            document.querySelectorAll('.box-item').forEach(i => i.classList.remove('active'));

            item.classList.add('active');
            state.currentPlatform = item.dataset.platform;
            state.currentBox = ''; // 清除当前盒子
            loadGames();
        });
    });
}

/**
 * 获取游戏总数
 */
function getTotalGameCount(platforms) {
    return platforms.reduce((sum, p) => sum + p.gameCount, 0);
}

/**
 * 加载盒子列表
 */
async function loadBoxes() {
    try {
        const boxes = await window.electronAPI.getAllBoxes();
        state.boxes = boxes;
        updateBoxList(boxes);
    } catch (error) {
        console.error('Error loading boxes:', error);
    }
}

/**
 * 更新盒子列表
 */
function updateBoxList(boxes) {
    let html = '';

    boxes.forEach(box => {
        html += `
            <li class="box-item" data-box="${box.name}">
                <span class="box-name">${box.name}</span>
                <span class="box-count">${box.gameCount}</span>
            </li>
        `;
    });

    elements.boxList.innerHTML = html;

    // 绑定点击事件
    document.querySelectorAll('.box-item').forEach(item => {
        item.addEventListener('click', () => {
            // 清除平台选中状态
            document.querySelectorAll('.platform-item').forEach(i => i.classList.remove('active'));

            // 清除之前的盒子选中状态
            document.querySelectorAll('.box-item').forEach(i => i.classList.remove('active'));

            // 设置当前盒子选中状态
            item.classList.add('active');
            state.currentBox = item.dataset.box;

            // 打开盒子视图
            openBoxView(state.currentBox);
        });
    });
}

/**
 * 打开盒子视图
 */
async function openBoxView(boxName) {
    try {
        await window.electronAPI.openBoxWindow(boxName);
    } catch (error) {
        console.error('Error opening box view:', error);
    }
}

/**
 * 加载游戏列表
 */
async function loadGames() {
    try {
        let games;

        if (state.searchKeyword) {
            // 搜索游戏
            games = await window.electronAPI.searchGames({
                keyword: state.searchKeyword,
                filters: {
                    platform: state.currentPlatform,
                    sort: state.currentSort
                }
            });
        } else if (state.currentPlatform) {
            // 按平台加载
            games = await window.electronAPI.getGamesByPlatform({
                platform: state.currentPlatform,
                sortBy: state.currentSort.split('-')[0],
                sortOrder: state.currentSort.split('-')[1]
            });
        } else {
            // 加载所有游戏
            games = await window.electronAPI.getAllGames({
                sortBy: state.currentSort.split('-')[0],
                sortOrder: state.currentSort.split('-')[1]
            });
        }

        if (games.error) {
            console.error('Error loading games:', games.error);
            return;
        }

        state.games = games;
        renderGames(games);
    } catch (error) {
        console.error('Error loading games:', error);
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
        // 列表视图 - 表格形式
        html += `
            <div class="list-view-header">
                <div class="game-checkbox">
                    <input type="checkbox" id="select-all" ${state.selectedGames.size === games.length && games.length > 0 ? 'checked' : ''}>
                </div>
                <div class="game-icon"></div>
                <div class="game-id-col">游戏ID</div>
                <div class="game-name">名称</div>
                <div class="game-description">描述</div>
                <div class="game-publish-date">发行时间</div>
                <div class="game-platform-info">平台</div>
                <div class="game-publisher-col">发行商</div>
                <div class="game-rating">评分</div>
            </div>
        `;
    }

    html += games.map(game => {
        const isSelected = state.selectedGames.has(game.id);

        if (state.viewMode === 'list') {
            // 列表视图 - 表格行
            return `
                <div class="game-card ${isSelected ? 'selected' : ''}" data-game-id="${game.id}">
                    <div class="game-checkbox">
                        <input type="checkbox" class="game-select-checkbox" data-game-id="${game.id}" ${isSelected ? 'checked' : ''}>
                    </div>
                    <div class="game-icon">
                        ${game.poster ?
                            `<img src="${game.poster}" alt="${game.name}">` :
                            `<div class="game-icon-placeholder">🎮</div>`
                        }
                    </div>
                    <div class="game-id-col">
                        ${game.gameId || ''}
                    </div>
                    <div class="game-name">
                        ${game.favorite ? '<span class="game-favorite">❤️</span>' : ''}
                        ${game.name}
                    </div>
                    <div class="game-description">${game.description ? (game.description.length > 30 ? game.description.substring(0, 30) + '...' : game.description) : '-'}</div>
                    <div class="game-publish-date">${game.publishDate || '-'}</div>
                    <div class="game-platform-info">${getPlatformName(game.platform)}</div>
                    <div class="game-publisher-col">${game.publisher || '-'}</div>
                    <div class="game-rating">${game.userRating ? '⭐'.repeat(game.userRating) : '-'}</div>
                </div>
            `;
        } else {
            // 网格视图
            return `
                <div class="game-card" data-game-id="${game.id}">
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
                            ${game.userRating ? `<span class="game-rating">${'⭐'.repeat(game.userRating)}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }
    }).join('');

    elements.gamesGrid.innerHTML = html;

    // 绑定游戏卡片点击事件（排除复选框）
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // 如果点击的是复选框，不打开详情
            if (e.target.type === 'checkbox') return;
            const gameId = card.dataset.gameId;
            openGameDetail(gameId);
        });
    });

    // 绑定复选框事件
    bindCheckboxEvents(games);
}

/**
 * 绑定复选框事件
 */
function bindCheckboxEvents(games) {
    // 全选复选框
    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                games.forEach(game => state.selectedGames.add(game.id));
            } else {
                state.selectedGames.clear();
            }
            renderGames(games);
        });
    }

    // 单个复选框
    document.querySelectorAll('.game-select-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const gameId = checkbox.dataset.gameId;
            if (checkbox.checked) {
                state.selectedGames.add(gameId);
            } else {
                state.selectedGames.delete(gameId);
            }

            // 更新卡片选中状态
            const card = checkbox.closest('.game-card');
            if (checkbox.checked) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }

            // 更新全选复选框状态
            const selectAll = document.getElementById('select-all');
            if (selectAll) {
                selectAll.checked = state.selectedGames.size === games.length && games.length > 0;
            }
        });
    });

    // 列表视图中的行点击可选中（点击复选框不触发）
    document.querySelectorAll('.games-grid.list-view .game-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // 如果点击的是复选框，不处理
            if (e.target.type === 'checkbox') return;

            const gameId = card.dataset.gameId;
            if (state.selectedGames.has(gameId)) {
                state.selectedGames.delete(gameId);
                card.classList.remove('selected');
            } else {
                state.selectedGames.add(gameId);
                card.classList.add('selected');
            }

            // 更新复选框状态
            const checkbox = card.querySelector('.game-select-checkbox');
            if (checkbox) {
                checkbox.checked = state.selectedGames.has(gameId);
            }

            // 更新全选复选框状态
            const selectAll = document.getElementById('select-all');
            if (selectAll) {
                selectAll.checked = state.selectedGames.size === games.length && games.length > 0;
            }
        });
    });
}

/**
 * 获取平台名称
 */
function getPlatformName(platformId) {
    const platform = state.platforms.find(p => p.id === platformId);
    return platform ? platform.shortName : platformId;
}

/**
 * 打开游戏详情
 */
async function openGameDetail(gameId) {
    try {
        const game = state.games.find(g => g.id === gameId);
        if (game) {
            await window.electronAPI.openGameDetail(game);
        }
    } catch (error) {
        console.error('Error opening game detail:', error);
    }
}

/**
 * 加载统计数据
 */
async function loadStats() {
    try {
        const stats = await window.electronAPI.getGameStats();

        if (stats.error) {
            console.error('Error loading stats:', stats.error);
            return;
        }

        elements.statsBar.total.textContent = `游戏总数：${stats.totalGames || 0}`;
        elements.statsBar.played.textContent = `收藏：${stats.favoriteCount || 0}`;
        elements.statsBar.playing.textContent = `评分：${stats.avgRating || 0}`;
        elements.statsBar.unplayed.textContent = '';
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

/**
 * 绑定事件
 */
function bindEvents() {
    // 平台筛选
    elements.platformFilter.addEventListener('change', (e) => {
        state.currentPlatform = e.target.value;
        loadGames();
    });

    // 排序
    elements.sortSelect.addEventListener('change', (e) => {
        state.currentSort = e.target.value;
        loadGames();
    });

    // 搜索
    elements.searchBtn.addEventListener('click', () => {
        state.searchKeyword = elements.searchInput.value.trim();
        loadGames();
        updateClearButtonVisibility();
    });

    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            state.searchKeyword = e.target.value.trim();
            loadGames();
            updateClearButtonVisibility();
        }
    });

    // 清除搜索
    elements.clearSearchBtn.addEventListener('click', () => {
        elements.searchInput.value = '';
        state.searchKeyword = '';
        loadGames();
        updateClearButtonVisibility();
    });

    // 更新清除按钮可见性
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

    // 设置按钮
    elements.settingsBtn.addEventListener('click', () => {
        elements.settingsModal.style.display = 'flex';
    });

    // 关闭设置
    elements.closeSettings.addEventListener('click', () => {
        elements.settingsModal.style.display = 'none';
    });

    elements.cancelSettings.addEventListener('click', () => {
        elements.settingsModal.style.display = 'none';
    });

    // 保存设置
    elements.saveSettings.addEventListener('click', saveSettingsHandler);

    // 选择目录
    elements.selectDirBtn.addEventListener('click', async () => {
        const result = await window.electronAPI.selectDirectory();
        if (!result.canceled && result.path) {
            elements.gamesDirInput.value = result.path;
        }
    });

    // 选择游戏盒子目录
    elements.selectGameboxDirBtn.addEventListener('click', async () => {
        const result = await window.electronAPI.selectDirectory();
        if (!result.canceled && result.path) {
            elements.gameboxDirInput.value = result.path;
        }
    });

    // 主题切换
    elements.themeSelect.addEventListener('change', (e) => {
        applyTheme(e.target.value);
    });

    // 监听刷新事件
    window.electronAPI.onRefreshLibrary(() => {
        loadPlatforms();
        loadGames();
        loadStats();
    });

    // 监听盒子更新事件
    window.addEventListener('box-updated', () => {
        loadBoxes();
    });

    // 监听设置事件
    window.electronAPI.onOpenSettings(() => {
        elements.settingsModal.style.display = 'flex';
    });

    // 点击模态框外部关闭
    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
            elements.settingsModal.style.display = 'none';
        }
    });

    // 创建盒子按钮
    elements.addBoxBtn.addEventListener('click', () => {
        elements.boxNameInput.value = '';
        elements.createBoxModal.style.display = 'flex';
        elements.boxNameInput.focus();
    });

    // 确认创建盒子
    elements.confirmCreateBox.addEventListener('click', async () => {
        const boxName = elements.boxNameInput.value.trim();

        if (!boxName) {
            alert('请输入盒子名称');
            return;
        }

        try {
            const result = await window.electronAPI.createBox(boxName);

            if (!result.error) {
                elements.createBoxModal.style.display = 'none';
                await loadBoxes();
            } else {
                alert('创建失败: ' + result.error);
            }
        } catch (error) {
            console.error('Error creating box:', error);
            alert('创建失败: ' + error.message);
        }
    });

    // 取消创建盒子
    elements.cancelCreateBox.addEventListener('click', () => {
        elements.createBoxModal.style.display = 'none';
    });

    // 关闭创建盒子模态框
    elements.closeCreateBox.addEventListener('click', () => {
        elements.createBoxModal.style.display = 'none';
    });

    // 点击模态框外部关闭
    elements.createBoxModal.addEventListener('click', (e) => {
        if (e.target === elements.createBoxModal) {
            elements.createBoxModal.style.display = 'none';
        }
    });
}

/**
 * 保存设置处理器
 */
async function saveSettingsHandler() {
    try {
        const oldGamesDir = state.settings.library.gamesDir;
        const newSettings = {
            ...state.settings,
            appearance: {
                ...state.settings.appearance,
                theme: elements.themeSelect.value
            },
            layout: {
                ...state.settings.layout,
                sidebarWidth: parseInt(elements.sidebarWidth.value),
                posterSize: elements.posterSize.value,
                viewMode: state.viewMode
            },
            library: {
                ...state.settings.library,
                gamesDir: elements.gamesDirInput.value
            },
            gamebox: {
                ...state.settings.gamebox,
                gameboxDir: elements.gameboxDirInput.value
            }
        };

        await window.electronAPI.saveSettings(newSettings);

        state.settings = newSettings;
        applyTheme(newSettings.appearance.theme);
        applyLayoutSettings(newSettings.layout);

        // 关闭模态框
        elements.settingsModal.style.display = 'none';

        // 重新加载所有游戏（无论是否更改了游戏目录）
        await loadPlatforms();
        await loadGames();
        await loadStats();
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', init);
