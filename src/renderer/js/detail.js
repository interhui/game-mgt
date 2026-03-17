/**
 * 游戏详情页逻辑
 */

let currentGame = null;
let isEditMode = false;
let editData = {};

// DOM 元素
const elements = {
    closeBtn: document.getElementById('close-btn'),
    gameTitle: document.getElementById('game-title'),
    gameTitleContainer: document.getElementById('game-title-container'),
    gamePoster: document.getElementById('game-poster'),
    posterPlaceholder: document.getElementById('poster-placeholder'),
    gameId: document.getElementById('game-id'),
    gamePlatform: document.getElementById('game-platform'),
    gamePublishDate: document.getElementById('game-publish-date'),
    gamePublishDateContainer: document.getElementById('game-publish-date-container'),
    gamePublisher: document.getElementById('game-publisher'),
    gamePublisherContainer: document.getElementById('game-publisher-container'),
    gameRating: document.getElementById('game-rating'),
    favoriteBtn: document.getElementById('favorite-btn'),
    gameTags: document.getElementById('game-tags'),
    gameDescription: document.getElementById('game-description'),
    gameDescriptionContainer: document.getElementById('game-description-container'),
    launchBtn: document.getElementById('launch-btn'),
    editBtn: document.getElementById('edit-btn'),
    deleteBtn: document.getElementById('delete-btn'),
    saveEditBtn: document.getElementById('save-edit-btn'),
    cancelEditBtn: document.getElementById('cancel-edit-btn'),
    editActions: document.getElementById('edit-actions'),
    actionButtons: document.querySelector('.action-buttons'),
    addToBoxBtn: document.getElementById('add-to-box-btn'),
    addToBoxModal: document.getElementById('add-to-box-modal'),
    boxSelect: document.getElementById('box-select'),
    confirmAddToBox: document.getElementById('confirm-add-to-box'),
    cancelAddToBox: document.getElementById('cancel-add-to-box')
};

/**
 * 初始化
 */
function init() {
    console.log('Detail page initialized');

    // 绑定事件
    bindEvents();

    // 监听游戏数据加载
    window.electronAPI.onLoadGameDetail((gameData) => {
        console.log('Loading game detail:', gameData);
        loadGameDetail(gameData);
    });
}

/**
 * 加载游戏详情
 */
function loadGameDetail(game) {
    currentGame = game;

    // 基本信息
    elements.gameTitle.textContent = game.name;
    document.title = `${game.name} - 游戏详情`;

    // 游戏ID
    elements.gameId.textContent = game.gameId || '';

    // 海报
    if (game.poster) {
        elements.gamePoster.src = game.poster;
        elements.gamePoster.style.display = 'block';
        elements.posterPlaceholder.style.display = 'none';
    } else {
        elements.gamePoster.style.display = 'none';
        elements.posterPlaceholder.style.display = 'flex';
    }

    // 平台
    elements.gamePlatform.textContent = getPlatformName(game.platform);

    // 发行日期
    elements.gamePublishDate.textContent = game.publishDate || '未知';

    // 发行商
    elements.gamePublisher.textContent = game.publisher || '未知';

    // 评分
    updateRating(game.userRating || 0);

    // 收藏
    updateFavorite(game.favorite);

    // 标签
    renderTags(game.tags || []);

    // 描述
    elements.gameDescription.textContent = game.description || '暂无描述';
}

/**
 * 渲染标签
 */
function renderTags(tags) {
    if (!tags || tags.length === 0) {
        elements.gameTags.innerHTML = '<span class="tag">无</span>';
        return;
    }

    const html = tags.map(tag =>
        `<span class="tag">${tag}</span>`
    ).join('');

    elements.gameTags.innerHTML = html;
}

/**
 * 更新评分显示
 */
function updateRating(rating) {
    const stars = elements.gameRating.querySelectorAll('.star');
    stars.forEach(star => {
        const starRating = parseInt(star.dataset.rating);
        if (starRating <= rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

/**
 * 更新收藏状态
 */
function updateFavorite(isFavorite) {
    if (isFavorite) {
        elements.favoriteBtn.classList.add('active');
        elements.favoriteBtn.querySelector('.heart').textContent = '❤️';
        elements.favoriteBtn.querySelector('.text').textContent = '已收藏';
    } else {
        elements.favoriteBtn.classList.remove('active');
        elements.favoriteBtn.querySelector('.heart').textContent = '🤍';
        elements.favoriteBtn.querySelector('.text').textContent = '收藏';
    }
}

/**
 * 获取平台名称
 */
function getPlatformName(platformId) {
    const platformNames = {
        'ps2': 'PlayStation 2',
        'ps1': 'PlayStation',
        'psp': 'PlayStation Portable',
        'xbox360': 'Xbox 360',
        'switch': 'Nintendo Switch',
        'pc': 'PC Games',
        'wii': 'Nintendo Wii',
        'wiiu': 'Nintendo Wii U',
        '3ds': 'Nintendo 3DS',
        'n64': 'Nintendo 64'
    };
    return platformNames[platformId] || platformId;
}

/**
 * 进入编辑模式
 */
function enterEditMode() {
    isEditMode = true;

    // 调整窗口大小
    window.electronAPI.resizeWindow(800, 700);
    window.electronAPI.setMinSize(600, 600);

    // 保存原始数据
    editData = {
        name: currentGame.name,
        publishDate: currentGame.publishDate || '',
        publisher: currentGame.publisher || '',
        userRating: currentGame.userRating || 0,
        favorite: currentGame.favorite || false,
        tags: [...(currentGame.tags || [])],
        description: currentGame.description || '',
        userComment: currentGame.userComment || ''
    };

    // 名称 - 转换为输入框
    elements.gameTitleContainer.innerHTML = `<input type="text" id="edit-name" class="edit-input" value="${editData.name}">`;

    // 发行日期 - 转换为输入框
    elements.gamePublishDateContainer.innerHTML = `<input type="date" id="edit-publish-date" class="edit-input" value="${editData.publishDate}">`;

    // 发行商 - 转换为输入框
    elements.gamePublisherContainer.innerHTML = `<input type="text" id="edit-publisher" class="edit-input" value="${editData.publisher}" placeholder="发行商">`;

    // 评分 - 启用点击
    const stars = elements.gameRating.querySelectorAll('.star');
    stars.forEach(star => {
        star.style.cursor = 'pointer';
        star.dataset.editable = 'true';
    });

    // 收藏按钮 - 启用点击
    elements.favoriteBtn.disabled = false;

    // 标签 - 转换为输入框
    elements.gameTags.innerHTML = `
        <input type="text" id="edit-tags" class="edit-input" value="${editData.tags.join(', ')}" placeholder="用逗号分隔">
    `;

    // 描述 - 转换为文本域
    elements.gameDescriptionContainer.innerHTML = `<textarea id="edit-description" class="edit-textarea">${editData.description}</textarea>`;

    // 显示/隐藏按钮
    elements.actionButtons.style.display = 'none';
    elements.editActions.style.display = 'flex';

    // 绑定编辑模式的事件
    bindEditModeEvents();
}

/**
 * 退出编辑模式
 */
function exitEditMode() {
    isEditMode = false;

    // 恢复窗口大小
    window.electronAPI.resizeWindow(800, 600);
    window.electronAPI.setMinSize(600, 500);

    // 恢复名称显示
    elements.gameTitleContainer.innerHTML = `<span id="game-title">${currentGame.name}</span>`;
    elements.gameTitle = document.getElementById('game-title');

    // 恢复发行日期显示
    elements.gamePublishDateContainer.innerHTML = `<span id="game-publish-date">${currentGame.publishDate || '未知'}</span>`;
    elements.gamePublishDate = document.getElementById('game-publish-date');

    // 恢复发行商显示
    elements.gamePublisherContainer.innerHTML = `<span id="game-publisher" class="value">${currentGame.publisher || ''}</span>`;
    elements.gamePublisher = document.getElementById('game-publisher');

    // 评分恢复只读
    const stars = elements.gameRating.querySelectorAll('.star');
    stars.forEach(star => {
        star.style.cursor = 'default';
        star.dataset.editable = 'false';
    });

    // 禁用收藏按钮
    elements.favoriteBtn.disabled = true;

    // 恢复标签显示
    renderTags(currentGame.tags || []);

    // 恢复描述显示
    elements.gameDescriptionContainer.innerHTML = `<p id="game-description" class="description">${currentGame.description || '暂无描述'}</p>`;
    elements.gameDescription = document.getElementById('game-description');

    // 显示/隐藏按钮
    elements.actionButtons.style.display = 'flex';
    elements.editActions.style.display = 'none';
}

/**
 * 绑定编辑模式事件
 */
function bindEditModeEvents() {
    // 评分点击 - 编辑模式下直接更新
    const stars = elements.gameRating.querySelectorAll('.star[data-editable="true"]');
    stars.forEach(star => {
        star.onclick = () => {
            const rating = parseInt(star.dataset.rating);
            editData.userRating = rating;
            updateRating(rating);
        };
    });

    // 收藏按钮 - 编辑模式下切换
    elements.favoriteBtn.onclick = () => {
        editData.favorite = !editData.favorite;
        updateFavorite(editData.favorite);
    };
}

/**
 * 保存编辑
 */
async function saveEdit() {
    // 收集编辑数据
    const nameInput = document.getElementById('edit-name');
    const publishDateInput = document.getElementById('edit-publish-date');
    const publisherInput = document.getElementById('edit-publisher');
    const tagsInput = document.getElementById('edit-tags');
    const descriptionInput = document.getElementById('edit-description');

    const updatedData = {
        ...currentGame,
        name: nameInput ? nameInput.value : editData.name,
        publishDate: publishDateInput ? publishDateInput.value : editData.publishDate,
        publisher: publisherInput ? publisherInput.value : editData.publisher,
        userRating: editData.userRating,
        favorite: editData.favorite,
        tags: tagsInput ? tagsInput.value.split(',').map(t => t.trim()).filter(t => t) : editData.tags,
        description: descriptionInput ? descriptionInput.value : editData.description,
        userComment: currentGame.userComment || ''
    };

    try {
        const result = await window.electronAPI.saveGameEdit(updatedData);
        if (!result.error) {
            // 更新当前游戏数据
            currentGame = updatedData;
            exitEditMode();
            loadGameDetail(currentGame);
        } else {
            alert('保存失败: ' + result.error);
        }
    } catch (error) {
        console.error('Error saving edit:', error);
        alert('保存失败: ' + error.message);
    }
}

/**
 * 取消编辑
 */
function cancelEdit() {
    // 恢复原始评分显示
    updateRating(currentGame.userRating || 0);
    updateFavorite(currentGame.favorite);
    exitEditMode();
}

/**
 * 绑定事件
 */
function bindEvents() {
    // 关闭按钮
    elements.closeBtn.addEventListener('click', async () => {
        window.close();
    });

    // 评分点击
    elements.gameRating.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', async () => {
            if (isEditMode) return; // 编辑模式下由bindEditModeEvents处理

            const rating = parseInt(star.dataset.rating);
            await window.electronAPI.saveGameRating({
                gameId: currentGame.id,
                rating: rating,
                comment: currentGame.userComment || ''
            });
            updateRating(rating);
        });

        star.addEventListener('mouseenter', () => {
            if (!isEditMode) {
                const rating = parseInt(star.dataset.rating);
                updateRating(rating);
            }
        });
    });

    elements.gameRating.addEventListener('mouseleave', () => {
        if (!isEditMode) {
            updateRating(currentGame.userRating || 0);
        }
    });

    // 收藏按钮
    elements.favoriteBtn.addEventListener('click', async () => {
        if (isEditMode) return; // 编辑模式下由bindEditModeEvents处理

        const result = await window.electronAPI.toggleFavorite(currentGame.id);
        if (!result.error) {
            currentGame.favorite = result.favorite;
            updateFavorite(result.favorite);
        }
    });

    // 启动游戏
    elements.launchBtn.addEventListener('click', async () => {
        try {
            await window.electronAPI.launchGame(currentGame.path, currentGame.platform);
        } catch (error) {
            console.error('Error launching game:', error);
            alert('启动游戏失败: ' + error.message);
        }
    });

    // 编辑按钮
    elements.editBtn.addEventListener('click', () => {
        enterEditMode();
    });

    // 保存编辑按钮
    elements.saveEditBtn.addEventListener('click', () => {
        saveEdit();
    });

    // 取消编辑按钮
    elements.cancelEditBtn.addEventListener('click', () => {
        cancelEdit();
    });

    // 删除按钮
    elements.deleteBtn.addEventListener('click', async () => {
        const gameName = currentGame.name;
        const confirmed = confirm(`游戏删除\n\n是否确认删除：${gameName}`);

        if (confirmed) {
            try {
                const result = await window.electronAPI.deleteGame({
                    platform: currentGame.platform,
                    folderName: currentGame.folderName
                });

                if (!result.error) {
                    // 通知主窗口刷新
                    window.electronAPI.onRefreshLibrary(() => {});
                    window.close();
                } else {
                    alert('删除失败: ' + result.error);
                }
            } catch (error) {
                console.error('Error deleting game:', error);
                alert('删除失败: ' + error.message);
            }
        }
    });

    // 添加到盒子按钮
    elements.addToBoxBtn.addEventListener('click', async () => {
        try {
            // 获取所有盒子
            const boxes = await window.electronAPI.getAllBoxes();

            if (!boxes || boxes.length === 0) {
                alert('请先创建游戏盒子');
                return;
            }

            // 填充盒子选择下拉框
            elements.boxSelect.innerHTML = '<option value="">选择游戏盒子</option>';
            boxes.forEach(box => {
                const option = document.createElement('option');
                option.value = box.name;
                option.textContent = `${box.name} (${box.gameCount}个游戏)`;
                elements.boxSelect.appendChild(option);
            });

            // 显示模态框
            elements.addToBoxModal.style.display = 'flex';
        } catch (error) {
            console.error('Error loading boxes:', error);
            alert('加载盒子失败: ' + error.message);
        }
    });

    // 确认添加到盒子
    elements.confirmAddToBox.addEventListener('click', async () => {
        const boxName = elements.boxSelect.value;

        if (!boxName) {
            alert('请选择游戏盒子');
            return;
        }

        try {
            // 获取游戏详情
            const gameDetail = await window.electronAPI.getGameDetail(currentGame.id);

            // 添加到盒子
            const result = await window.electronAPI.addGameToBox({
                boxName: boxName,
                platform: currentGame.platform,
                gameInfo: {
                    id: currentGame.gameId,
                    status: 'unplayed',
                    firstPlayed: '',
                    lastPlayed: '',
                    totalPlayTime: 0,
                    playCount: 0
                }
            });

            if (!result.error) {
                alert('添加成功');
                elements.addToBoxModal.style.display = 'none';
                // 通知主窗口刷新盒子列表
                window.dispatchEvent(new CustomEvent('box-updated'));
            } else {
                alert('添加失败: ' + result.error);
            }
        } catch (error) {
            console.error('Error adding to box:', error);
            alert('添加失败: ' + error.message);
        }
    });

    // 取消添加到盒子
    elements.cancelAddToBox.addEventListener('click', () => {
        elements.addToBoxModal.style.display = 'none';
    });

    // 点击模态框外部关闭
    elements.addToBoxModal.addEventListener('click', (e) => {
        if (e.target === elements.addToBoxModal) {
            elements.addToBoxModal.style.display = 'none';
        }
    });
}

// 初始化
document.addEventListener('DOMContentLoaded', init);
