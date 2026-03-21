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
    refreshBtn: document.getElementById('refresh-btn'),
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
    igdbClientId: document.getElementById('igdb-client-id'),
    igdbClientSecret: document.getElementById('igdb-client-secret'),
    addBoxBtn: document.getElementById('add-box-btn'),
    boxList: document.getElementById('box-list'),
    createBoxModal: document.getElementById('create-box-modal'),
    boxNameInput: document.getElementById('box-name-input'),
    confirmCreateBox: document.getElementById('confirm-create-box'),
    cancelCreateBox: document.getElementById('cancel-create-box'),
    closeCreateBox: document.getElementById('close-create-box'),
    // 批量添加相关
    batchAddBtn: document.getElementById('batch-add-btn'),
    batchAddModal: document.getElementById('batch-add-modal'),
    batchAddInfo: document.getElementById('batch-add-info'),
    batchBoxSelect: document.getElementById('batch-box-select'),
    confirmBatchAdd: document.getElementById('confirm-batch-add'),
    cancelBatchAdd: document.getElementById('cancel-batch-add'),
    closeBatchAdd: document.getElementById('close-batch-add'),

    // 添加游戏相关
    addGameModal: document.getElementById('add-game-modal'),
    closeAddGame: document.getElementById('close-add-game'),
    gameNameInput: document.getElementById('game-name'),
    gamePlatformSelect: document.getElementById('game-platform'),
    gamePublishDate: document.getElementById('game-publish-date'),
    gamePublisher: document.getElementById('game-publisher'),
    gameDescription: document.getElementById('game-description'),
    gameTags: document.getElementById('game-tags'),
    selectCoverBtn: document.getElementById('select-cover-btn'),
    gameCoverInput: document.getElementById('game-cover-input'),
    coverName: document.getElementById('cover-name'),
    coverPreview: document.getElementById('cover-preview'),
    confirmAddGame: document.getElementById('confirm-add-game'),
    cancelAddGame: document.getElementById('cancel-add-game'),

    // 导入JSON相关
    importJsonModal: document.getElementById('import-json-modal'),
    closeImportJson: document.getElementById('close-import-json'),
    selectJsonBtn: document.getElementById('select-json-btn'),
    jsonFileInput: document.getElementById('json-file-input'),
    jsonFileName: document.getElementById('json-file-name'),
    jsonPreview: document.getElementById('json-preview'),
    jsonPreviewContent: document.getElementById('json-preview-content'),
    confirmImportJson: document.getElementById('confirm-import-json'),
    cancelImportJson: document.getElementById('cancel-import-json'),

    // 导入结果相关
    importResultModal: document.getElementById('import-result-modal'),
    closeImportResult: document.getElementById('close-import-result'),
    importResultText: document.getElementById('import-result-text'),
    importErrors: document.getElementById('import-errors'),
    importErrorList: document.getElementById('import-error-list'),
    closeImportResultBtn: document.getElementById('close-import-result-btn'),

    // IGDB 导入相关
    igdbImportModal: document.getElementById('igdb-import-modal'),
    closeIgdbImport: document.getElementById('close-igdb-import'),
    igdbSearchInput: document.getElementById('igdb-search-input'),
    igdbSearchBtn: document.getElementById('igdb-search-btn'),
    igdbSearchLoading: document.getElementById('igdb-search-loading'),
    igdbError: document.getElementById('igdb-error'),
    igdbResults: document.getElementById('igdb-results'),
    cancelIgdbImport: document.getElementById('cancel-igdb-import'),

    // IGDB 预览相关
    igdbPreviewModal: document.getElementById('igdb-preview-modal'),
    closeIgdbPreview: document.getElementById('close-igdb-preview'),
    igdbPreviewCover: document.getElementById('igdb-preview-cover'),
    igdbPreviewCoverPlaceholder: document.getElementById('igdb-preview-cover-placeholder'),
    igdbPreviewName: document.getElementById('igdb-preview-name'),
    igdbPreviewDate: document.getElementById('igdb-preview-date'),
    igdbPreviewPublisher: document.getElementById('igdb-preview-publisher'),
    igdbPreviewPlatforms: document.getElementById('igdb-preview-platforms'),
    igdbPreviewDescription: document.getElementById('igdb-preview-description'),
    igdbGamePlatform: document.getElementById('igdb-game-platform'),
    confirmIgdbAdd: document.getElementById('confirm-igdb-add'),
    cancelIgdbPreview: document.getElementById('cancel-igdb-preview')
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
        elements.igdbClientId.value = state.settings.igdb?.clientId || '';
        elements.igdbClientSecret.value = state.settings.igdb?.clientSecret || '';

        state.viewMode = state.settings.layout.viewMode;
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

/**
 * 应用主题
 */
function applyTheme(theme) {
    // 找到所有 link 标签并找到主题 CSS
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    let themeLink = null;
    for (const link of links) {
        const href = link.getAttribute('href') || '';
        if (href.includes('themes/dark') || href.includes('themes/light')) {
            themeLink = link;
            break;
        }
    }
    if (themeLink) {
        // 替换 href 中的主题文件名
        const currentHref = themeLink.getAttribute('href');
        let newHref;
        if (theme === 'light') {
            newHref = currentHref.replace(/themes\/dark\.css$/, 'themes/light.css');
        } else {
            newHref = currentHref.replace(/themes\/light\.css$/, 'themes/dark.css');
        }
        themeLink.setAttribute('href', newHref);
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
            setCurrentPlatform(item.dataset.platform);
        });
    });
}

/**
 * 设置当前平台筛选
 * 统一处理左侧栏和下拉框的平台选择
 */
function setCurrentPlatform(platform) {
    state.currentPlatform = platform;
    state.currentBox = ''; // 清除当前盒子

    // 更新左侧栏平台选中状态
    document.querySelectorAll('.platform-item').forEach(item => {
        if (item.dataset.platform === platform) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // 清除左侧栏盒子选中状态
    document.querySelectorAll('.box-item').forEach(i => i.classList.remove('active'));

    // 更新下拉框
    elements.platformFilter.value = platform;

    // 加载游戏
    loadGames();
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

            // 打开盒子视图（新窗口）
            openBoxView(state.currentBox);
        });
    });
}

/**
 * 打开盒子视图（新窗口）
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
            updateBatchAddButtonVisibility();
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

            // 更新批量添加按钮可见性
            updateBatchAddButtonVisibility();
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

            // 更新批量添加按钮可见性
            updateBatchAddButtonVisibility();
        });
    });
}

/**
 * 更新批量添加按钮可见性
 */
function updateBatchAddButtonVisibility() {
    if (state.selectedGames.size > 0) {
        elements.batchAddBtn.style.display = 'block';
        elements.batchAddBtn.textContent = `批量添加 (${state.selectedGames.size})`;
    } else {
        elements.batchAddBtn.style.display = 'none';
    }
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
        setCurrentPlatform(e.target.value);
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

    // 刷新游戏库按钮
    elements.refreshBtn.addEventListener('click', () => {
        loadPlatforms();
        loadGames();
        loadStats();
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

    // 监听刷新事件
    window.electronAPI.onRefreshLibrary(() => {
        loadPlatforms();
        loadGames();
        loadStats();
    });

    // 监听盒子更新事件
    window.electronAPI.onBoxUpdated(() => {
        loadBoxes();
    });

    // 监听设置事件
    window.electronAPI.onOpenSettings(() => {
        elements.settingsModal.style.display = 'flex';
    });

    // 监听添加游戏事件
    window.electronAPI.onOpenAddGame(() => {
        resetAddGameForm();
        populatePlatformSelect();
        populateTagsSelect();
        elements.addGameModal.style.display = 'flex';
        elements.gameNameInput.focus();
    });

    // 监听JSON导入事件
    window.electronAPI.onOpenJsonImport(() => {
        resetImportJsonForm();
        elements.importJsonModal.style.display = 'flex';
    });

    // 监听主题变化
    window.electronAPI.onThemeChanged((theme) => {
        applyTheme(theme);
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

    // ==================== 批量添加相关事件 ====================

    // 批量添加按钮
    elements.batchAddBtn.addEventListener('click', async () => {
        if (state.selectedGames.size === 0) {
            alert('请先选择要添加的游戏');
            return;
        }

        // 获取所有盒子
        const boxes = await window.electronAPI.getAllBoxes();

        if (!boxes || boxes.length === 0) {
            alert('请先创建游戏盒子');
            return;
        }

        // 填充盒子选择下拉框
        elements.batchBoxSelect.innerHTML = '<option value="">选择游戏盒子...</option>';
        boxes.forEach(box => {
            const option = document.createElement('option');
            option.value = box.name;
            option.textContent = `${box.name} (${box.gameCount}个游戏)`;
            elements.batchBoxSelect.appendChild(option);
        });

        // 显示已选游戏数量
        elements.batchAddInfo.textContent = `已选择 ${state.selectedGames.size} 个游戏`;

        // 显示模态框
        elements.batchAddModal.style.display = 'flex';
    });

    // 确认批量添加
    elements.confirmBatchAdd.addEventListener('click', async () => {
        const boxName = elements.batchBoxSelect.value;

        if (!boxName) {
            alert('请选择游戏盒子');
            return;
        }

        try {
            let addedCount = 0;
            const selectedGameIds = Array.from(state.selectedGames);

            for (const gameId of selectedGameIds) {
                const game = state.games.find(g => g.id === gameId);
                if (game) {
                    const result = await window.electronAPI.addGameToBox({
                        boxName: boxName,
                        platform: game.platform,
                        gameInfo: {
                            id: game.gameId,
                            status: 'unplayed',
                            firstPlayed: '',
                            lastPlayed: '',
                            totalPlayTime: 0,
                            playCount: 0
                        }
                    });

                    if (!result.error) {
                        addedCount++;
                    }
                }
            }

            alert(`已经添加${addedCount}个到${boxName}`);

            // 关闭模态框
            elements.batchAddModal.style.display = 'none';

            // 清空选择
            state.selectedGames.clear();
            await loadGames();
        } catch (error) {
            console.error('Error batch adding to box:', error);
            alert('添加失败: ' + error.message);
        }
    });

    // 取消批量添加
    elements.cancelBatchAdd.addEventListener('click', () => {
        elements.batchAddModal.style.display = 'none';
    });

    // 关闭批量添加模态框
    elements.closeBatchAdd.addEventListener('click', () => {
        elements.batchAddModal.style.display = 'none';
    });

    // 点击模态框外部关闭
    elements.batchAddModal.addEventListener('click', (e) => {
        if (e.target === elements.batchAddModal) {
            elements.batchAddModal.style.display = 'none';
        }
    });

    // ==================== 添加游戏相关事件 ====================

    // 关闭添加游戏模态框
    elements.closeAddGame.addEventListener('click', () => {
        elements.addGameModal.style.display = 'none';
    });

    elements.cancelAddGame.addEventListener('click', () => {
        elements.addGameModal.style.display = 'none';
    });

    // 点击模态框外部关闭
    elements.addGameModal.addEventListener('click', (e) => {
        if (e.target === elements.addGameModal) {
            elements.addGameModal.style.display = 'none';
        }
    });

    // 选择封面图片
    elements.selectCoverBtn.addEventListener('click', () => {
        elements.gameCoverInput.click();
    });

    // 封面图片选择变化
    elements.gameCoverInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            elements.coverName.textContent = file.name;

            // 预览图片
            const reader = new FileReader();
            reader.onload = (event) => {
                elements.coverPreview.innerHTML = `<img src="${event.target.result}" alt="Cover Preview">`;
            };
            reader.readAsDataURL(file);
        }
    });

    // 确认添加游戏
    elements.confirmAddGame.addEventListener('click', async () => {
        const name = elements.gameNameInput.value.trim();
        const platform = elements.gamePlatformSelect.value;

        if (!name) {
            alert('请输入游戏名称');
            return;
        }

        if (!platform) {
            alert('请选择平台');
            return;
        }

        // 获取表单数据
        const gameData = {
            name: name,
            platform: platform,
            description: elements.gameDescription.value.trim(),
            publishDate: elements.gamePublishDate.value,
            publisher: elements.gamePublisher.value.trim(),
            tags: getSelectedTags()
        };

        // 处理封面图片
        const coverFile = elements.gameCoverInput.files[0];
        if (coverFile) {
            gameData.coverImage = await fileToBase64(coverFile);
        }

        try {
            const result = await window.electronAPI.addGame(gameData);

            if (result.error) {
                alert('添加失败: ' + result.error);
            } else {
                alert('游戏添加成功！');
                elements.addGameModal.style.display = 'none';
                await loadGames();
                await loadPlatforms();
                await loadStats();
            }
        } catch (error) {
            console.error('Error adding game:', error);
            alert('添加失败: ' + error.message);
        }
    });

    // ==================== 导入JSON相关事件 ====================

    // 关闭导入JSON模态框
    elements.closeImportJson.addEventListener('click', () => {
        elements.importJsonModal.style.display = 'none';
    });

    elements.cancelImportJson.addEventListener('click', () => {
        elements.importJsonModal.style.display = 'none';
    });

    // 点击模态框外部关闭
    elements.importJsonModal.addEventListener('click', (e) => {
        if (e.target === elements.importJsonModal) {
            elements.importJsonModal.style.display = 'none';
        }
    });

    // 选择JSON文件
    elements.selectJsonBtn.addEventListener('click', () => {
        elements.jsonFileInput.click();
    });

    // JSON文件选择变化
    elements.jsonFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            elements.jsonFileName.textContent = file.name;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    const games = Array.isArray(data) ? data : data.games;

                    if (!Array.isArray(games)) {
                        alert('JSON 格式错误：需要包含 games 数组');
                        elements.confirmImportJson.disabled = true;
                        elements.jsonPreview.style.display = 'none';
                        return;
                    }

                    // 显示预览
                    showJsonPreview(games);
                    elements.confirmImportJson.disabled = false;
                    elements.jsonFileInput.dataset.content = event.target.result;
                } catch (err) {
                    alert('JSON 解析失败: ' + err.message);
                    elements.confirmImportJson.disabled = true;
                    elements.jsonPreview.style.display = 'none';
                }
            };
            reader.readAsText(file);
        }
    });

    // 确认导入JSON
    elements.confirmImportJson.addEventListener('click', async () => {
        const content = elements.jsonFileInput.dataset.content;
        if (!content) {
            alert('请先选择 JSON 文件');
            return;
        }

        try {
            const data = JSON.parse(content);
            const games = Array.isArray(data) ? data : data.games;

            const result = await window.electronAPI.batchImportGames(games);

            elements.importJsonModal.style.display = 'none';

            // 显示结果
            showImportResult(result);

            // 刷新
            await loadGames();
            await loadPlatforms();
            await loadStats();
        } catch (error) {
            console.error('Error importing games:', error);
            alert('导入失败: ' + error.message);
        }
    });

    // 关闭导入结果模态框
    elements.closeImportResult.addEventListener('click', () => {
        elements.importResultModal.style.display = 'none';
    });

    elements.closeImportResultBtn.addEventListener('click', () => {
        elements.importResultModal.style.display = 'none';
    });

    elements.importResultModal.addEventListener('click', (e) => {
        if (e.target === elements.importResultModal) {
            elements.importResultModal.style.display = 'none';
        }
    });

    // ==================== IGDB 导入相关事件 ====================

    // 监听打开 IGDB 导入
    window.electronAPI.onOpenIgdbImport(() => {
        resetIgdbImportForm();
        populateIgdbPlatformSelect();
        elements.igdbImportModal.style.display = 'flex';
        elements.igdbSearchInput.focus();
    });

    // 关闭 IGDB 导入模态框
    elements.closeIgdbImport.addEventListener('click', () => {
        elements.igdbImportModal.style.display = 'none';
    });

    elements.cancelIgdbImport.addEventListener('click', () => {
        elements.igdbImportModal.style.display = 'none';
    });

    elements.igdbImportModal.addEventListener('click', (e) => {
        if (e.target === elements.igdbImportModal) {
            elements.igdbImportModal.style.display = 'none';
        }
    });

    // IGDB 搜索
    elements.igdbSearchBtn.addEventListener('click', async () => {
        await searchIgdbGames();
    });

    elements.igdbSearchInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            await searchIgdbGames();
        }
    });

    // 关闭 IGDB 预览模态框
    elements.closeIgdbPreview.addEventListener('click', () => {
        elements.igdbPreviewModal.style.display = 'none';
    });

    elements.cancelIgdbPreview.addEventListener('click', () => {
        elements.igdbPreviewModal.style.display = 'none';
    });

    elements.igdbPreviewModal.addEventListener('click', (e) => {
        if (e.target === elements.igdbPreviewModal) {
            elements.igdbPreviewModal.style.display = 'none';
        }
    });

    // 确认添加 IGDB 游戏
    elements.confirmIgdbAdd.addEventListener('click', async () => {
        await confirmIgdbGameAdd();
    });
}

/**
 * 重置添加游戏表单
 */
function resetAddGameForm() {
    elements.gameNameInput.value = '';
    elements.gamePlatformSelect.value = '';
    elements.gamePublishDate.value = '';
    elements.gamePublisher.value = '';
    elements.gameDescription.value = '';
    elements.gameCoverInput.value = '';
    elements.coverName.textContent = '';
    elements.coverPreview.innerHTML = '<div class="cover-placeholder">选择封面图片</div>';

    // 清空标签选择
    const tagCheckboxes = elements.gameTags.querySelectorAll('input[type="checkbox"]');
    tagCheckboxes.forEach(cb => cb.checked = false);
}

/**
 * 填充平台选择下拉框
 */
function populatePlatformSelect() {
    elements.gamePlatformSelect.innerHTML = '<option value="">选择平台...</option>';
    state.platforms.forEach(platform => {
        const option = document.createElement('option');
        option.value = platform.id;
        option.textContent = platform.name;
        elements.gamePlatformSelect.appendChild(option);
    });
}

/**
 * 填充标签选择
 */
function populateTagsSelect() {
    // 从预定义标签中获取
    const predefinedTags = [
        { id: 'action', name: '动作' },
        { id: 'adventure', name: '冒险' },
        { id: 'rpg', name: '角色扮演' },
        { id: 'strategy', name: '策略' },
        { id: 'simulation', name: '模拟' },
        { id: 'sports', name: '体育' },
        { id: 'racing', name: '竞速' },
        { id: 'puzzle', name: '解谜' },
        { id: 'horror', name: '恐怖' },
        { id: 'multiplayer', name: '多人' }
    ];

    let html = '';
    predefinedTags.forEach(tag => {
        html += `
            <label class="tag-checkbox">
                <input type="checkbox" value="${tag.id}">
                <span>${tag.name}</span>
            </label>
        `;
    });

    elements.gameTags.innerHTML = html;
}

/**
 * 获取选中的标签
 */
function getSelectedTags() {
    const selectedTags = [];
    const checkboxes = elements.gameTags.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(cb => {
        selectedTags.push(cb.value);
    });
    return selectedTags;
}

/**
 * 将文件转换为 base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * 显示JSON预览
 */
function showJsonPreview(games) {
    const previewHtml = games.slice(0, 5).map((game, index) => `
        <div class="json-preview-item">
            <strong>${index + 1}. ${game.name || '未命名'}</strong>
            <span>平台: ${game.platform || '未指定'}</span>
            <span>发行日期: ${game.publishDate || '-'}</span>
        </div>
    `).join('');

    const moreText = games.length > 5 ? `<p style="color: var(--text-secondary);">还有 ${games.length - 5} 个游戏...</p>` : '';

    elements.jsonPreviewContent.innerHTML = previewHtml + moreText;
    elements.jsonPreview.style.display = 'block';
}

/**
 * 重置导入JSON表单
 */
function resetImportJsonForm() {
    elements.jsonFileInput.value = '';
    elements.jsonFileInput.dataset.content = '';
    elements.jsonFileName.textContent = '';
    elements.jsonPreview.style.display = 'none';
    elements.confirmImportJson.disabled = true;
}

/**
 * 显示导入结果
 */
function showImportResult(result) {
    let text = `导入完成！成功: ${result.success} 个，失败: ${result.failed} 个`;

    if (result.errors && result.errors.length > 0) {
        elements.importErrors.style.display = 'block';
        elements.importErrorList.innerHTML = result.errors.map(err => `<li>${err}</li>`).join('');
    } else {
        elements.importErrors.style.display = 'none';
    }

    elements.importResultText.textContent = text;
    elements.importResultModal.style.display = 'flex';
}

/**
 * 保存设置处理器
 */
async function saveSettingsHandler() {
    try {
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
            },
            igdb: {
                ...state.settings.igdb,
                clientId: elements.igdbClientId.value,
                clientSecret: elements.igdbClientSecret.value
            }
        };

        await window.electronAPI.saveSettings(newSettings);

        state.settings = newSettings;
        // 调用 setTheme 广播主题变化到所有窗口
        await window.electronAPI.setTheme(newSettings.appearance.theme);
        applyLayoutSettings(newSettings.layout);

        // 关闭模态框
        elements.settingsModal.style.display = 'none';

        // 重新加载所有游戏
        await loadPlatforms();
        await loadGames();
        await loadStats();
        // 重新加载盒子列表
        await loadBoxes();
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

/**
 * 重置 IGDB 导入表单
 */
function resetIgdbImportForm() {
    elements.igdbSearchInput.value = '';
    elements.igdbSearchLoading.style.display = 'none';
    elements.igdbError.style.display = 'none';
    elements.igdbError.textContent = '';
    elements.igdbResults.innerHTML = '';
}

/**
 * 填充 IGDB 平台选择下拉框
 */
function populateIgdbPlatformSelect() {
    elements.igdbGamePlatform.innerHTML = '<option value="">选择平台...</option>';
    state.platforms.forEach(platform => {
        const option = document.createElement('option');
        option.value = platform.id;
        option.textContent = platform.name;
        elements.igdbGamePlatform.appendChild(option);
    });
}

/**
 * 搜索 IGDB 游戏
 */
async function searchIgdbGames() {
    const gameName = elements.igdbSearchInput.value.trim();

    if (!gameName) {
        elements.igdbError.textContent = '请输入游戏名称';
        elements.igdbError.style.display = 'block';
        return;
    }

    // 显示加载状态
    elements.igdbSearchLoading.style.display = 'block';
    elements.igdbError.style.display = 'none';
    elements.igdbResults.innerHTML = '';

    try {
        const result = await window.electronAPI.igdbSearchGames(gameName);

        elements.igdbSearchLoading.style.display = 'none';

        if (result.error) {
            elements.igdbError.textContent = result.error;
            elements.igdbError.style.display = 'block';
            return;
        }

        if (!result || result.length === 0) {
            elements.igdbError.textContent = '未找到相关游戏';
            elements.igdbError.style.display = 'block';
            return;
        }

        // 显示搜索结果
        displayIgdbResults(result);
    } catch (error) {
        elements.igdbSearchLoading.style.display = 'none';
        elements.igdbError.textContent = '搜索失败: ' + error.message;
        elements.igdbError.style.display = 'block';
    }
}

/**
 * 显示 IGDB 搜索结果
 */
function displayIgdbResults(games) {
    const html = games.map((game, index) => `
        <div class="igdb-result-item" data-index="${index}">
            <div class="igdb-result-cover">
                ${game.coverUrl ?
            `<img src="${game.coverUrl}" alt="${game.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                     <div class="igdb-result-cover-placeholder" style="display: none;">🎮</div>` :
            `<div class="igdb-result-cover-placeholder">🎮</div>`
        }
            </div>
            <div class="igdb-result-info">
                <div class="igdb-result-name">${game.name}</div>
                <div class="igdb-result-date">${game.publishDate || '-'}</div>
                <div class="igdb-result-publisher">${game.publisher || '-'}</div>
            </div>
        </div>
    `).join('');

    elements.igdbResults.innerHTML = html;

    // 绑定点击事件
    document.querySelectorAll('.igdb-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            showIgdbGamePreview(games[index]);
        });
    });
}

/**
 * 显示 IGDB 游戏预览
 */
function showIgdbGamePreview(game) {
    if (game.coverUrl) {
        elements.igdbPreviewCover.src = game.coverUrl;
        elements.igdbPreviewCover.style.display = 'block';
        elements.igdbPreviewCoverPlaceholder.style.display = 'none';
    } else {
        elements.igdbPreviewCover.src = '';
        elements.igdbPreviewCover.style.display = 'none';
        elements.igdbPreviewCoverPlaceholder.style.display = 'flex';
    }
    elements.igdbPreviewName.textContent = game.name;
    elements.igdbPreviewDate.textContent = game.publishDate || '-';
    elements.igdbPreviewPublisher.textContent = game.publisher || '-';
    elements.igdbPreviewPlatforms.textContent = game.platforms ? game.platforms.join(', ') : '-';
    elements.igdbPreviewDescription.textContent = game.description || '暂无描述';

    // 保存当前预览的游戏数据
    elements.igdbPreviewModal.dataset.gameData = JSON.stringify(game);

    // 重置平台选择
    elements.igdbGamePlatform.value = '';

    elements.igdbPreviewModal.style.display = 'flex';
}

/**
 * 确认添加 IGDB 游戏
 */
async function confirmIgdbGameAdd() {
    const platform = elements.igdbGamePlatform.value;

    if (!platform) {
        alert('请选择游戏平台');
        return;
    }

    const gameDataStr = elements.igdbPreviewModal.dataset.gameData;
    if (!gameDataStr) {
        alert('游戏数据无效');
        return;
    }

    const gameData = JSON.parse(gameDataStr);

    const addGameData = {
        name: gameData.name,
        description: gameData.description,
        platform: platform,
        publishDate: gameData.publishDate,
        publisher: gameData.publisher,
        coverImage: gameData.coverUrl
    };

    try {
        const result = await window.electronAPI.addGame(addGameData);

        if (result.error) {
            alert('添加失败: ' + result.error);
        } else {
            alert('游戏添加成功！');
            elements.igdbPreviewModal.style.display = 'none';
            elements.igdbImportModal.style.display = 'none';
            await loadGames();
            await loadPlatforms();
            await loadStats();
        }
    } catch (error) {
        console.error('Error adding IGDB game:', error);
        alert('添加失败: ' + error.message);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', init);
