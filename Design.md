# 游戏管理程序 - 详细设计文档

## 1. 项目概述

### 1.1 项目背景
本项目是一个基于 Electron 框架开发的模拟器游戏管理程序，主要功能参考 Playnite，用于管理和展示多平台模拟器游戏。

### 1.2 技术栈
| 技术 | 说明 |
|------|------|
| 开发语言 | Node.js |
| 开发框架 | Electron |
| 界面技术 | HTML + CSS + JavaScript |
| 数据存储 | 本地 JSON 文件 |

### 1.3 核心功能

#### 基础功能
- 多平台模拟器游戏展示
- 游戏海报墙浏览
- 游戏详情查看
- 游戏搜索功能

#### 游戏管理功能
- **游戏状态追踪**：记录游戏状态（未开始/游玩中/已完成）、游戏次数、总游戏时长、最后游玩时间
- **游戏启动执行**：支持通过程序启动对应模拟器的游戏
- **收藏/置顶功能**：标记收藏游戏，在列表中优先显示
- **用户评分**：用户对游戏进行 1-5 星评分
- **标签系统**：支持为游戏添加自定义标签和分类

#### 筛选排序功能
- **多维度筛选**：支持按平台、游戏状态、标签进行筛选
- **自定义排序**：支持按名称、时长、评分等多种方式排序
- **视图切换**：支持网格/列表视图切换

#### 批量操作
- **批量导入**：支持批量导入游戏
- **批量编辑**：支持批量修改游戏属性
- **批量操作**：支持批量收藏、批量删除等操作

#### 配置系统
- **主题系统**：支持深色/浅色主题切换
- **布局设置**：可自定义侧边栏宽度、海报尺寸、列数
- **快捷键支持**：支持全局快捷键操作
- **游戏路径配置**：可配置游戏存储目录

---

## 2. 系统架构

### 2.1 整体架构图（增强版）

```
┌────────────────────────────────────────────────────────────────────┐
│                     Electron Main Process                          │
├────────────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │  文件系统操作 │  │  游戏启动器  │  │  进程管理    │  │  IPC 通信管理  │   │
│  │            │  │            │  │            │  │            │   │
│  │  (fs module)│  │ (Launcher) │  │ (app, Menu)│  │(ipcMain,IPC)│   │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘   │
│  ┌────────────┐  ┌────────────┐                                     │
│  │  数据库服务   │  │  配置管理器   │                                     │
│  │(SQLite)    │  │(Settings)   │                                     │
│  └────────────┘  └────────────┘                                     │
└────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────┐
│                   Electron Renderer Process                        │
├────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────┐│
│  │                     主窗口 (MainWindow)                         ││
│  │  ┌────────────────────────────────────────────────────────────┐││
│  │  │                     顶部工具栏区域                            │││
│  │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────────────┐  │││
│  │  │  │全部平台│ │全部状态│ │排序：名称│ │ [搜索框] 🔍          │  │││
│  │  │  └────────┘ └────────┘ └────────┘ └────────────────────┘  │││
│  │  └────────────────────────────────────────────────────────────┘││
│  │  ┌──────┬──────────────────────────────────────────────┐       ││
│  │  │      │              游戏海报墙                        │       ││
│  │  │ 模拟器│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │       ││
│  │  │  列表 │  │封面│ │封面│ │封面│ │封面│ │封面│ │封面│    │       ││
│  │  │      │  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘    │       ││
│  │  │      │  Superman  GTA5    MGS5    FIFA24   Mario   Zelda│      ││
│  │  │      │  [PS2]   [PS2]   [PS2]   [PS2]   [PS2]  [PS2]   │       ││
│  │  └──────┴──────────────────────────────────────────────┘       ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                    │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │                 游戏详情窗口 (GameDetailWindow)                 ││
│  ├────────────────────────────────────────────────────────────────┤│
│  │  ┌──────────┐  ┌──────────────────────────────────────────┐   ││
│  │  │          │  │  游戏名称：Superman                         │   ││
│  │  │  游戏封面  │  │  ⭐⭐⭐⭐⭐ (用户评分)                      │   ││
│  │  │          │  │                                          │   ││
│  │  │ (400x566)│  │  游戏描述：A Superman RPG Game...          │   ││
│  │  │          │  │                                          │   ││
│  │  │          │  │  发行时间：2021-10-12                      │   ││
│  │  │          │  │  平台：PlayStation 2 [PS2 图标]              │   ││
│  │  │          │  │  游戏状态：已完成 ◎                         │   ││
│  │  │          │  │  游戏时长：120 小时 ⏱️                        │   ││
│  │  │          │  │  最后游玩：2024-03-10                       │   ││
│  │  │          │  │  标签：action, rpg, adventure               │   ││
│  │  │          │  │                                          │   ││
│  │  │          │  │  [启动游戏] [编辑] [删除] [返回]             │   ││
│  │  └──────────┘  └──────────────────────────────────────────┘   ││
│  └────────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────┘
```

### 2.2 目录结构（增强版）

```
game-mgt/
├── main.js                          # Electron 主进程入口文件
├── preload.js                       # 预加载脚本，用于 IPC 通信安全
├── package.json                     # 项目配置和依赖
├── Design.md                        # 详细设计文档
├── config/                          # 配置文件目录
│   ├── default-settings.json       # 默认配置模板
│   └── platform-config.json        # 平台配置文件
├── database/                        # 数据库目录
│   └── games.db                    # SQLite 数据库文件
├── executors/                       # 游戏启动器脚本
│   ├── ps2-launcher.js             # PS2 游戏启动器
│   ├── ps1-launcher.js             # PS1 游戏启动器
│   ├── psp-launcher.js             # PSP 游戏启动器
│   └── common-launcher.js          # 通用启动器
├── locales/                         # 国际化文件
│   ├── zh-CN.json                  # 简体中文
│   └── en-US.json                  # 英文
├── assets/                          # 项目资源文件
├── image/                           # 程序图片目录
│   ├── icon.png                     # 应用图标
│   └── platform-icons/              # 平台小图标
│       ├── ps1.png
│       ├── ps2.png
│       ├── psp.png
│       └── xbox360.png
├── games/                           # 游戏存储目录
│   ├── ps2/
│   │   ├── superman/
│   │   │   ├── poster.jpg           # 游戏封面
│   │   │   └── game.json            # 游戏信息
│   │   ├── game02/
│   │   │   ├── poster.jpg
│   │   │   └── game.json
│   ├── ps1/
│   │   └── ...
│   └── xbox360/
│       └── ...
├── src/                             # 源代码目录
│   ├── main/                        # 主进程代码
│   │   ├── services/
│   │   │   ├── FileService.js      # 文件系统服务
│   │   │   ├── GameService.js      # 游戏管理服务
│   │   │   ├── DatabaseService.js  # 数据库服务
│   │   │   ├── SettingsService.js  # 配置服务
│   │   │   ├── LauncherService.js  # 游戏启动服务
│   │   │   └── TagService.js       # 标签服务
│   │   └── ipc-handlers.js         # IPC 处理器
│   ├── renderer/                    # 渲染进程代码
│   │   ├── index.html               # 主界面 HTML
│   │   ├── detail.html              # 详情窗口 HTML
│   │   ├── css/
│   │   │   ├── main.css             # 主界面样式
│   │   │   ├── detail.css           # 详情窗口样式
│   │   │   ├── filters.css          # 筛选器样式
│   │   │   └── themes/
│   │   │       ├── dark.css         # 深色主题
│   │   │       └── light.css        # 浅色主题
│   │   └── js/
│   │       ├── main.js              # 主界面逻辑
│   │       ├── detail.js            # 详情窗口逻辑
│   │       ├── filters.js           # 筛选排序逻辑
│   │       ├── stats.js             # 统计数据逻辑
│   │       ├── settings.js          # 设置管理逻辑
│   │       └── themes.js            # 主题切换逻辑
│   └── common/                      # 公共代码
│       ├── constants.js             # 常量定义
│       ├── utils.js                 # 工具函数
│       ├── validators.js            # 数据验证
│       └── enums.js                 # 枚举定义
└── styles/                          # CSS 样式目录
    └── shared.css                   # 公共样式
```

---

## 3. 模块设计

### 3.1 模块划分

```
                    ┌─────────────────┐
                    │   IPC Handler   │
                    │   (主进程)       │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌────────────┐   ┌────────────┐   ┌────────────┐
    │  FileService│   │ GameService│   │WindowManager│
    │  (文件系统) │   │  (游戏管理) │   │ (窗口管理)   │
    └─────┬──────┘   └─────┬──────┘   └─────┬──────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   WindowManager│
                    │  (渲染进程)   │
                    └──────────────┘
```

### 3.2 模块详细说明

#### 3.2.1 FileService（文件系统服务）

**职责**：负责所有文件系统的操作，包括读取目录结构、读写 JSON 文件等。

**主要方法**：

```javascript
// 文件服务接口定义
class FileService {
    /**
     * 获取指定目录下所有子文件夹名称
     * @param {string} baseDir - 基础目录路径
     * @returns {Promise<string[]>} 返回文件夹名称数组
     */
    async getSimulatorFolders(baseDir) {}

    /**
     * 获取指定模拟器目录下所有游戏文件夹
     * @param {string} platformDir - 平台目录路径
     * @returns {Promise<object>} 返回 {folderName: folderPath} 对象
     */
    async getGameFolders(platformDir) {}

    /**
     * 读取 game.json 文件内容
     * @param {string} gamePath - 游戏文件夹路径
     * @returns {Promise<object>} 返回游戏信息对象
     */
    async readGameJson(gamePath) {}

    /**
     * 写入 game.json 文件
     * @param {string} gamePath - 游戏文件夹路径
     * @param {object} gameData - 游戏数据对象
     */
    async writeGameJson(gamePath, gameData) {}

    /**
     * 检查文件是否存在
     * @param {string} filePath - 文件路径
     * @returns {Promise<boolean>} 是否存在
     */
    async fileExists(filePath) {}
}
```

#### 3.2.2 GameService（游戏服务）

**职责**：负责游戏数据的业务逻辑处理，封装对文件服务的调用。

**主要方法**：

```javascript
// 游戏服务接口定义
class GameService {
    /**
     * 获取所有平台及其游戏列表
     * @param {string} gamesDir - 游戏存储目录
     * @returns {Promise<object>} 返回平台游戏数据
     */
    async getAllPlatforms(gamesDir) {}

    /**
     * 根据平台获取游戏列表
     * @param {string} platform - 平台名称
     * @param {string} gamesDir - 游戏存储目录
     * @returns {Promise<Array>} 返回游戏列表
     */
    async getGamesByPlatform(platform, gamesDir) {}

    /**
     * 搜索游戏
     * @param {string} keyword - 搜索关键词
     * @param {string} gamesDir - 游戏存储目录
     * @returns {Promise<Array>} 返回匹配的游戏列表
     */
    async searchGames(keyword, gamesDir) {}

    /**
     * 获取单个游戏详情
     * @param {string} gamePath - 游戏路径
     * @returns {Promise<object>} 返回游戏详情
     */
    async getGameDetail(gamePath) {}

    /**
     * 验证游戏有效性
     * @param {string} gamePath - 游戏路径
     * @returns {Promise<boolean>} 是否有效
     */
    async isGameValid(gamePath) {}
}
```

#### 3.2.3 WindowManager（窗口管理服务）

**职责**：负责 Electron 窗口的创建、管理和生命周期控制。

**主要方法**：

```javascript
// 窗口管理服务类
class WindowManager {
    constructor() {
        this.mainWindow = null;
        this.detailWindow = null;
        this.statsWindow = null; // 新增：统计窗口
    }

    /**
     * 创建主窗口
     */
    createMainWindow() {}

    /**
     * 创建游戏详情窗口
     * @param {object} gameData - 游戏数据
     */
    createGameDetailWindow(gameData) {}

    /**
     * 销毁详情窗口
     */
    destroyDetailWindow() {}

    /**
     * 刷新主窗口游戏列表
     */
    refreshGameList() {}
}
```

#### 3.2.4 DatabaseService（数据库服务）

**职责**：负责 SQLite 数据库的初始化、数据读写和查询操作。

**主要方法**：

```javascript
// 数据库服务类
class DatabaseService {
    constructor(dbPath) {
        this.db = null;
        this.init(dbPath);
    }

    /**
     * 初始化数据库
     */
    init(dbPath) {}

    /**
     * 创建数据表
     */
    createTables() {}

    /**
     * 保存游戏状态
     * @param {string} gameId - 游戏 ID
     * @param {object} state - 游戏状态数据
     */
    saveGameState(gameId, state) {}

    /**
     * 获取游戏状态
     * @param {string} gameId - 游戏 ID
     * @returns {object} 游戏状态数据
     */
    getGameState(gameId) {}

    /**
     * 获取游戏统计数据
     * @param {string} platform - 平台筛选（可选）
     * @returns {object} 统计数据
     */
    getGameStats(platform) {}

    /**
     * 更新游戏时长
     * @param {string} gameId - 游戏 ID
     * @param {number} duration - 时长（分钟）
     */
    updatePlayTime(gameId, duration) {}

    /**
     * 保存用户评分
     * @param {string} gameId - 游戏 ID
     * @param {number} rating - 评分 (1-5)
     * @param {string} comment - 评论
     */
    saveUserRating(gameId, rating, comment) {}

    /**
     * 获取标签列表
     * @returns {Array} 标签列表
     */
    getTags() {}

    /**
     * 为游戏添加标签
     * @param {string} gameId - 游戏 ID
     * @param {Array} tags - 标签数组
     */
    addTagsToGame(gameId, tags) {}
}
```

#### 3.2.5 SettingsService（配置服务）

**职责**：负责应用配置的读取、保存和管理。

**主要方法**：

```javascript
// 配置服务类
class SettingsService {
    constructor(settingsPath) {
        this.settingsPath = settingsPath;
        this.settings = null;
    }

    /**
     * 加载配置
     */
    loadSettings() {}

    /**
     * 保存配置
     * @param {object} newSettings - 新配置
     */
    saveSettings(newSettings) {}

    /**
     * 获取主题设置
     * @returns {string} 主题名称（dark/light）
     */
    getTheme() {}

    /**
     * 设置主题
     * @param {string} theme - 主题名称
     */
    setTheme(theme) {}

    /**
     * 获取布局设置
     * @returns {object} 布局配置
     */
    getLayoutSettings() {}

    /**
     * 设置布局配置
     * @param {object} layout - 布局配置
     */
    setLayoutSettings(layout) {}

    /**
     * 获取快捷键配置
     * @returns {object} 快捷键配置
     */
    getShortcuts() {}

    /**
     * 设置快捷键配置
     * @param {object} shortcuts - 快捷键配置
     */
    setShortcuts(shortcuts) {}

    /**
     * 获取游戏目录配置
     * @returns {string} 游戏目录路径
     */
    getGamesDir() {}

    /**
     * 设置游戏目录
     * @param {string} dir - 游戏目录路径
     */
    setGamesDir(dir) {}
}
```

#### 3.2.6 LauncherService（游戏启动服务）

**职责**：负责调用模拟器启动游戏。

**主要方法**：

```javascript
// 游戏启动服务类
class LauncherService {
    constructor(emulatorsConfig) {
        this.emulators = emulatorsConfig;
    }

    /**
     * 获取可用模拟器列表
     * @returns {Array} 模拟器列表
     */
    getAvailableEmulators() {}

    /**
     * 启动游戏
     * @param {string} gamePath - 游戏路径
     * @param {string} platform - 平台标识
     * @param {string} emulatorPath - 模拟器可执行文件路径
     */
    launchGame(gamePath, platform, emulatorPath) {}

    /**
     * 验证模拟器路径
     * @param {string} emulatorPath - 模拟器路径
     * @returns {boolean} 是否有效
     */
    validateEmulatorPath(emulatorPath) {}

    /**
     * 获取模拟器配置
     * @param {string} platform - 平台标识
     * @returns {object} 模拟器配置
     */
    getEmulatorConfig(platform) {}

    /**
     * 设置模拟器配置
     * @param {string} platform - 平台标识
     * @param {object} config - 配置对象
     */
    setEmulatorConfig(platform, config) {}
}
```

#### 3.2.7 TagService（标签服务）

**职责**：负责标签的管理，包括标签的增删改查。

**主要方法**：

```javascript
// 标签服务类
class TagService {
    constructor(database) {
        this.db = database;
    }

    /**
     * 获取所有标签
     * @returns {Array} 标签列表
     */
    getAllTags() {}

    /**
     * 创建新标签
     * @param {string} name - 标签名称
     * @param {string} color - 标签颜色
     * @returns {object} 创建的标签
     */
    createTag(name, color) {}

    /**
     * 删除标签
     * @param {string} tagId - 标签 ID
     */
    deleteTag(tagId) {}

    /**
     * 为游戏添加标签
     * @param {string} gameId - 游戏 ID
     * @param {Array} tagIds - 标签 ID 数组
     */
    addTagsToGame(gameId, tagIds) {}

    /**
     * 从游戏移除标签
     * @param {string} gameId - 游戏 ID
     * @param {Array} tagIds - 标签 ID 数组
     */
    removeTagsFromGame(gameId, tagIds) {}

    /**
     * 根据标签获取游戏列表
     * @param {string} tagId - 标签 ID
     * @returns {Array} 游戏列表
     */
    getGamesByTag(tagId) {}

    /**
     * 更新标签信息
     * @param {string} tagId - 标签 ID
     * @param {object} data - 更新数据
     */
    updateTag(tagId, data) {}
}
```

---

## 4. 界面设计（增强版）

### 4.1 主界面设计（增强版）

#### 4.1.1 布局结构

```
┌─────────────────────────────────────────────────────────────────────┐
│  游戏管理程序          [搜索：🔍                ] [设置] [最小化][最大化][关闭] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌───────────┐  │  │
│  │  │全部平台│ │全部状态│ │排序：名称│ │标签筛选│ │ [🔍搜索] │  │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └───────────┘  │  │
│  │                                                            │  │
│  │  游戏总数：128 已玩：45 游玩中：3 未开始：80              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────┬────────────────────────────────────────────────────────┐ │
│  │       │  游戏海报墙                                            │ │
│  │       │  ┌──────────────────────────────────────────────────┐ │ │
│  │ 模拟  │  [搜索框：输入游戏名称...]                            │ │ │
│  │ 器  │  ──────────────────────────────────────────────────── │ │ │
│  │       │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐         │ │ │
│  │ 列表  │  │封面│ │封面│ │封面│ │封面│ │封面│ │封面│         │ │ │
│  │       │  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘         │ │ │
│  │       │  Superman GTA V   MGS V   FIFA 24   Mario   Zelda   │ │ │
│  │       │  [PS2]   [PS2]   [PS2]   [PS2]   [PS2]  [PS2]      │ │ │
│  │       │                                                            │ │
│  └──────┴────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 4.1.1 布局结构

```
┌─────────────────────────────────────────────────────────────────────┐
│  游戏管理程序                        [搜索：🔍              ] [最小化][最大化][关闭]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┬─────────────────────────────────────────────────┐ │
│  │             │                                                 │ │
│  │  模拟器列表  │          游戏海报墙                              │ │
│  │             │  ┌───────────────────────────────────────────┐ │ │
│  │  PlayStation2│          [搜索框：输入游戏名称...]            │ │ │
│  │  PS2         │  ├───────────────────────────────────────────┤ │ │
│  │  PlayStation1│          ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐│ │
│  │  PSP         │          │封面│ │封面│ │封面│ │封面│ │封面│ │封面││ │
│  │  Xbox360     │          └────┘ └────┘ └────┘ └────┘ └────┘ └────┘│ │
│  │  Switch      │          Superman GTA5 MGS5 FIFA24 Mario Zelda     │ │
│  │  Nintendo    │          ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐│ │
│  │             │          │封面│ │封面│ │封面│ │封面│ │封面│ │封面││ │
│  │             │          └────┘ └────┘ └────┘ └────┘ └────┘ └────┘│ │
│  │             │                                                 │ │
│  └─────────────┴─────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 4.1.2 海报墙布局（1920x1080 分辨率）

```
每行 6 个海报，海报尺寸设计：
- 海报图片：180px × 254px (16:9 比例)
- 海报区域总宽度：180px × 6 + 10px × 5 = 1130px
- 海报下方文字区域：300px 宽度，文字 2 行显示
- 行间距：10px
- 左右边距：(1920 - 1130) / 2 = 395px
```

详细尺寸：
```
┌─────────────────────────────────────────────────────────────┐
│                   游戏海报墙区域                              │
│                                                             │
│  [  搜索框                  ]  🔍                           │
│  高度：40px                                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │ │
│  │  │180x254│ │180x254│ │180x254│ │180x254│ │180x254│ │180x254│  │ │
│  │  │封面图  │ │封面图  │ │封面图  │ │封面图  │ │封面图  │ │封面图  │  │ │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘  │ │
│  │   Superman     GTA V      MGS V      FIFA 24      Mario   │ │
│  │  [PS2 图标]  [PS2 图标]  [PS2 图标]  [PS2 图标]  [PS2 图标]  [PS2 图标]│ │
│  │  游戏名称            游戏名称            游戏名称           │ │
│  │  (120px)    (120px)    (120px)    (120px)    (120px)    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 游戏详情窗口设计

#### 4.2.1 布局结构

```
┌─────────────────────────────────────────────────────────────────────┐
│  Superman - 游戏详情                                             [关闭] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────────────────────────────┐ │
│  │                 │  │  Superman                                 │ │
│  │                 │  │  (平台：PS2 [PS2 图标])                   │ │
│  │                 │  │                                          │ │
│  │   游戏封面      │  │  游戏描述：                                │ │
│  │                 │  │  A Superman RPG Game. This game features│ │
│  │   (400x566)     │  │  amazing graphics and an epic storyline.│ │
│  │                 │  │                                          │ │
│  │                 │  │  发行时间：2021-10-12                     │ │
│  │   poster.jpg    │  │                                          │ │
│  │                 │  │  平台：PlayStation 2                      │ │
│  │                 │  │                                          │ │
│  │                 │  │  [返回]                                    │ │
│  │                 │  │                                          │ │
│  └─────────────────┘  └─────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 4.2.2 尺寸规格

- 窗口大小：800px × 600px
- 左侧封面区域：400px × 566px（保持 16:9 比例）
- 右侧信息区域：380px 宽度
- 左右内边距：40px
- 上下间距：20px

### 4.3 CSS 样式设计

#### 4.3.1 主界面样式变量

```css
/* 颜色变量 */
:root {
    --primary-color: #0078d4;
    --primary-hover: #106ebe;
    --bg-color: #1a1a1a;
    --sidebar-bg: #252525;
    --card-bg: #333333;
    --text-color: #ffffff;
    --text-secondary: #cccccc;
    --border-color: #444444;
}

/* 尺寸变量 */
:root {
    --poster-width: 180px;
    --poster-height: 254px;
    --poster-gap: 10px;
    --sidebar-width: 200px;
    --search-box-height: 40px;
}
```

#### 4.3.2 海报卡片样式

```css
.game-card {
    width: 180px;
    flex-shrink: 0;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

.game-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
}

.game-poster {
    width: 180px;
    height: 254px;
    object-fit: cover;
    border-radius: 4px;
}

.game-info {
    margin-top: 8px;
}

.game-name {
    font-size: 14px;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.game-platform {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
    font-size: 12px;
    color: var(--text-secondary);
}

.platform-icon {
    width: 16px;
    height: 16px;
}
```

---

## 5. 数据存储设计

### 5.1 game.json 数据结构（增强版）

```json
{
    "name": "Superman",
    "description": "A Superman RPG Game. Experience the adventure of the iconic superhero.",
    "publishDate": "2021-10-12",
    "platform": "ps2",

    // === 游戏状态追踪字段 ===
    "status": "played",            // 'unplayed' | 'playing' | 'completed' | 'abandoned'
    "playCount": 5,                // 游戏次数
    "totalPlayTime": 120,          // 总游戏时长（分钟）
    "lastPlayed": "2024-03-10",    // 最后游玩时间（YYYY-MM-DD）
    "firstPlayed": "2024-01-01",   // 首次游玩时间

    // === 用户评分 ===
    "favorite": true,              // 是否收藏
    "userRating": 4,               // 用户评分 (1-5)
    "userComment": "Amazing game with great story!",

    // === 标签系统 ===
    "tags": ["action", "rpg", "adventure"],
    "customTags": ["推荐", "经典", "剧情向"],

    // === 扩展字段 ===
    "developer": "Developer Name",
    "publisher": "Publisher Name",
    "genre": ["action", "rpg"],
    "esrbRating": "T",             // 游戏评级
    "notes": "个人笔记内容..."       // 备注

    // === 唯一标识 ===
    "id": "ps2-superman-001",      // 游戏唯一 ID
    "hash": "abc123def456"         // 文件哈希，用于检测游戏变更
}
```

**字段说明**：

| 字段 | 类型 | 说明 | 必填 |
|------|------|------|------|
| name | string | 游戏名称 | 是 |
| description | string | 游戏描述 | 否 |
| publishDate | string | 发行日期（YYYY-MM-DD 格式） | 否 |
| platform | string | 平台标识 | 是 |
| status | string | 游戏状态 | 否 |
| playCount | number | 游戏次数 | 否 |
| totalPlayTime | number | 总游戏时长（分钟） | 否 |
| lastPlayed | string | 最后游玩时间 | 否 |
| firstPlayed | string | 首次游玩时间 | 否 |
| favorite | boolean | 是否收藏 | 否 |
| userRating | number | 用户评分 (1-5) | 否 |
| userComment | string | 用户评论 | 否 |
| tags | array | 预定义标签数组 | 否 |
| customTags | array | 自定义标签数组 | 否 |
| developer | string | 开发商 | 否 |
| publisher | string | 发行商 | 否 |
| genre | array | 游戏类型 | 否 |
| esrbRating | string | 游戏评级 | 否 |
| notes | string | 备注 | 否 |
| id | string | 唯一标识 | 系统生成 |
| hash | string | 文件哈希 | 系统生成 |

### 5.2 SQLite 数据库设计

#### 5.2.1 数据表结构

```sql
-- 游戏主表
CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,              -- 游戏 ID
    name TEXT NOT NULL,               -- 游戏名称
    path TEXT UNIQUE NOT NULL,        -- 游戏路径
    platform TEXT,                    -- 平台标识
    description TEXT,                 -- 游戏描述
    publishDate TEXT,                 -- 发行日期
    developer TEXT,                   -- 开发商
    publisher TEXT,                   -- 发行商
    esrbRating TEXT,                  -- 游戏评级

    -- 状态字段
    status TEXT DEFAULT 'unplayed',   -- 游戏状态
    playCount INTEGER DEFAULT 0,      -- 游戏次数
    totalPlayTime INTEGER DEFAULT 0,  -- 总时长（分钟）
    lastPlayed TEXT,                  -- 最后游玩时间
    firstPlayed TEXT,                 -- 首次游玩时间

    -- 用户数据
    favorite INTEGER DEFAULT 0,       -- 是否收藏
    userRating INTEGER,               -- 用户评分
    userComment TEXT,                 -- 用户评论
    notes TEXT,                       -- 备注

    -- 元数据
    posterPath TEXT,                  -- 封面路径
    hash TEXT,                        -- 文件哈希
    updated_at INTEGER,               -- 更新时间戳
    created_at INTEGER                -- 创建时间戳
);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,              -- 标签 ID
    name TEXT UNIQUE NOT NULL,        -- 标签名称
    color TEXT DEFAULT '#0078d4',     -- 标签颜色
    created_at INTEGER                -- 创建时间戳
);

-- 游戏 - 标签关联表（多对多）
CREATE TABLE IF NOT EXISTS game_tags (
    game_id TEXT NOT NULL,            -- 游戏 ID
    tag_id TEXT NOT NULL,             -- 标签 ID
    PRIMARY KEY (game_id, tag_id),
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 游戏统计索引
CREATE INDEX IF NOT EXISTS idx_games_platform ON games(platform);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_favorite ON games(favorite);
CREATE INDEX IF NOT EXISTS idx_games_rating ON games(userRating);
```

#### 5.2.2 数据库操作示例

```javascript
/**
 * 更新游戏时长
 */
async function updatePlayTime(gameId, duration) {
    const stmt = db.prepare(`
        UPDATE games
        SET
            totalPlayTime = totalPlayTime + ?,
            playCount = playCount + 1,
            lastPlayed = date('now'),
            updated_at = ?
        WHERE id = ?
    `);
    stmt.run(duration, Date.now(), gameId);
}

/**
 * 获取游戏统计数据
 */
function getStats(platform = null) {
    const query = platform ? `
        SELECT
            COUNT(*) as totalGames,
            SUM(CASE WHEN status = 'played' THEN 1 ELSE 0 END) as playedGames,
            SUM(CASE WHEN status = 'playing' THEN 1 ELSE 0 END) as playingGames,
            SUM(CASE WHEN status = 'unplayed' THEN 1 ELSE 0 END) as unplayedGames,
            SUM(totalPlayTime) / 60 as totalHours,
            AVG(userRating) as avgRating
        FROM games
        WHERE platform = ?
    ` : `
        SELECT
            COUNT(*) as totalGames,
            SUM(CASE WHEN status = 'played' THEN 1 ELSE 0 END) as playedGames,
            SUM(CASE WHEN status = 'playing' THEN 1 ELSE 0 END) as playingGames,
            SUM(CASE WHEN status = 'unplayed' THEN 1 ELSE 0 END) as unplayedGames,
            SUM(totalPlayTime) / 60 as totalHours,
            AVG(userRating) as avgRating
        FROM games
    `;
    return db.prepare(query).get(platform);
}

/**
 * 搜索游戏
 */
function searchGames(keyword, filters = {}) {
    let query = `
        SELECT * FROM games WHERE 1=1
    `;
    const params = [];

    // 关键字搜索
    if (keyword) {
        query += ` AND (name LIKE ? OR description LIKE ?)`;
        params.push(`%${keyword}%`, `%${keyword}%`);
    }

    // 平台筛选
    if (filters.platform) {
        query += ` AND platform = ?`;
        params.push(filters.platform);
    }

    // 状态筛选
    if (filters.status) {
        query += ` AND status = ?`;
        params.push(filters.status);
    }

    // 收藏筛选
    if (filters.favorite) {
        query += ` AND favorite = 1`;
    }

    // 标签筛选
    if (filters.tagId) {
        query += ` AND id IN (SELECT game_id FROM game_tags WHERE tag_id = ?)`;
        params.push(filters.tagId);
    }

    // 排序
    if (filters.sort) {
        const sortMapping = {
            'name-asc': 'name ASC',
            'name-desc': 'name DESC',
            'playtime-desc': 'totalPlayTime DESC',
            'playtime-asc': 'totalPlayTime ASC',
            'rating-desc': 'userRating DESC',
            'rating-asc': 'userRating ASC',
            'last-played-desc': 'lastPlayed DESC',
            'created-desc': 'created_at DESC'
        };
        query += ` ORDER BY ${sortMapping[filters.sort] || 'name ASC'}`;
    }

    return db.prepare(query).all(...params);
}
```

### 5.3 配置文件设计

#### 5.3.1 应用配置文件（config/settings.json）

```json
{
    "version": "1.0.0",
    "lastUpdate": 1710000000000,

    "appearance": {
        "theme": "dark",                  // dark | light
        "language": "zh-CN",
        "showPlatformIcons": true,
        "showDescriptions": true,
        "enableAnimations": true
    },

    "layout": {
        "sidebarWidth": 200,
        "posterSize": "medium",           // small | medium | large
        "columns": 6,
        "viewMode": "grid",               // grid | list
        "sortBy": "name-asc",
        "sortOrder": "asc"
    },

    "library": {
        "gamesDir": "D:\\Develop\\Workspace\\game-mgt\\games",
        "scanOnStartup": true,
        "autoRefresh": false,
        "showHiddenFiles": false,
        "includeSubfolders": true
    },

    "emulators": {
        "ps2": {
            "name": "PCSX2",
            "path": "C:\\Emulators\\PCSX2\\pcsx2.exe",
            "arguments": "-boot {gamePath}"
        },
        "ps1": {
            "name": "DuckStation",
            "path": "C:\\Emulators\\DuckStation\\duckstation.exe",
            "arguments": "-batchmode -cdrom {gamePath}"
        },
        "psp": {
            "name": "PPSSPP",
            "path": "C:\\Emulators\\PPSSPP\\PPSSPPSDL.exe",
            "arguments": "-boot {gamePath}"
        },
        "xbox360": {
            "name": "Xenia",
            "path": "C:\\Emulators\\Xenia\\xenia.exe",
            "arguments": "--game {gamePath}"
        }
    },

    "shortcuts": {
        "openSearch": "Ctrl+F",
        "focusSearch": "Ctrl+K",
        "launchGame": "Enter",
        "gameDetails": "Ctrl+D",
        "editGame": "Ctrl+E",
        "deleteGame": "Delete",
        "toggleFavorite": "F",
        "refreshLibrary": "R",
        "openSettings": "Ctrl+Comma"
    },

    "notifications": {
        "enableStartup": true,
        "enableLibraryUpdate": true,
        "showPlayReminders": true
    },

    "import": {
        "autoImport": false,
        "importPaths": []
    }
}
```

#### 5.3.2 平台配置文件（config/platforms.json）

```json
{
    "platforms": [
        {
            "id": "ps2",
            "name": "PlayStation 2",
            "shortName": "PS2",
            "icon": "image/platform-icons/ps2.png",
            "color": "#003791",
            "emulatorId": "ps2",
            "order": 1
        },
        {
            "id": "ps1",
            "name": "PlayStation",
            "shortName": "PS1",
            "icon": "image/platform-icons/ps1.png",
            "color": "#003791",
            "emulatorId": "ps1",
            "order": 2
        },
        {
            "id": "psp",
            "name": "PlayStation Portable",
            "shortName": "PSP",
            "icon": "image/platform-icons/psp.png",
            " color": "#003791",
            "emulatorId": "psp",
            "order": 3
        },
        {
            "id": "xbox360",
            "name": "Xbox 360",
            "shortName": "X360",
            "icon": "image/platform-icons/xbox360.png",
            "color": "#107C10",
            "emulatorId": "xbox360",
            "order": 4
        },
        {
            "id": "switch",
            "name": "Nintendo Switch",
            "shortName": "Switch",
            "icon": "image/platform-icons/switch.png",
            "color": "#E60012",
            "emulatorId": "ryujinx",
            "order": 5
        },
        {
            "id": "pc",
            "name": "PC Games",
            "shortName": "PC",
            "icon": "image/platform-icons/pc.png",
            "color": "#888888",
            "emulatorId": null,
            "order": 6
        }
    ],
    "predefinedTags": [
        { "id": "action", "name": "动作", "color": "#E60012" },
        { "id": "adventure", "name": "冒险", "color": "#00B7C1" },
        { "id": "rpg", "name": "角色扮演", "color": "#9B51E0" },
        { "id": "strategy", "name": "策略", "color": "#F2C94C" },
        { "id": "simulation", "name": "模拟", "color": "#51CF66" },
        { "id": "sports", "name": "体育", "color": "#FF6B6B" },
        { "id": "racing", "name": "竞速", "color": "#FF922B" },
        { "id": "puzzle", "name": "解谜", "color": "#A78BFA" },
        { "id": "horror", "name": "恐怖", "color": "#1F2937" },
        { "id": "multiplayer", "name": "多人", "color": "#FB7185" }
    ],
    "customTags": []
}
```

---

## 6. IPC 通信设计

### 6.1 主进程 IPC 处理器（增强版）

```javascript
// ipcMain 事件监听器
const ipcMain = require('electron').ipcMain;
const FileService = require('./services/FileService');
const GameService = require('./services/GameService');
const DatabaseService = require('./services/DatabaseService');
const SettingsService = require('./services/SettingsService');
const LauncherService = require('./services/LauncherService');
const TagService = require('./services/TagService');

// == 初始化服务实例 ==
const fileService = new FileService();
const gameService = new GameService();
const dbService = new DatabaseService('database/games.db');
const settingsService = new SettingsService('config/settings.json');
const launcherService = new LauncherService();
const tagService = new TagService(dbService.getDatabase());

// ==================== 游戏查询接口 ====================

// 获取所有平台（带游戏数量统计）
ipcMain.handle('get-platforms', async () => {
    try {
        const platforms = await fileService.getSimulatorFolders(gamesDir);
        const stats = await gameService.getPlatformStats(platforms);
        return stats;
    } catch (error) {
        return { error: error.message };
    }
});

// 获取指定平台的游戏列表（支持筛选和排序）
ipcMain.handle('get-games-by-platform', async (event, filters) => {
    try {
        const { platform, status, sortBy, sortOrder } = filters;
        const games = await gameService.getGamesByPlatform(platform, gamesDir, { status, sortBy, sortOrder });
        return games;
    } catch (error) {
        return { error: error.message };
    }
});

// 搜索游戏（全局搜索）
ipcMain.handle('search-games', async (event, params) => {
    try {
        const { keyword, filters = {} } = params;
        const games = await gameService.searchGames(keyword, gamesDir, filters);
        return games;
    } catch (error) {
        return { error: error.message };
    }
});

// 获取所有游戏（用于加载全部列表）
ipcMain.handle('get-all-games', async (event, filters) => {
    try {
        const games = await gameService.getAllGames(gamesDir, filters);
        return games;
    } catch (error) {
        return { error: error.message };
    }
});

// 获取游戏详情
ipcMain.handle('get-game-detail', async (event, gameId) => {
    try {
        const detail = await gameService.getGameDetail(gameId, gamesDir);
        return detail;
    } catch (error) {
        return { error: error.message };
    }
});

// ==================== 游戏状态管理 ====================

// 更新游戏状态
ipcMain.handle('update-game-status', async (event, data) => {
    try {
        const { gameId, status, playTime } = data;
        const result = await gameService.updateGameState(gameId, status, playTime);
        await dbService.saveGameState(gameId, { status, playTime });
        return result;
    } catch (error) {
        return { error: error.message };
    }
});

// 更新游戏时长
ipcMain.handle('update-game-playtime', async (event, data) => {
    try {
        const { gameId, duration } = data;
        const result = await gameService.updatePlayTime(gameId, duration);
        await dbService.updatePlayTime(gameId, duration);
        return result;
    } catch (error) {
        return { error: error.message };
    }
});

// 标记/取消收藏
ipcMain.handle('toggle-favorite', async (event, gameId) => {
    try {
        const isFavorite = await gameService.toggleFavorite(gameId, gamesDir);
        await dbService.setFavorite(gameId, isFavorite);
        return { favorite: isFavorite };
    } catch (error) {
        return { error: error.message };
    }
});

// 保存用户评分
ipcMain.handle('save-game-rating', async (event, data) => {
    try {
        const { gameId, rating, comment } = data;
        await gameService.saveRating(gameId, rating, comment, gamesDir);
        await dbService.saveUserRating(gameId, rating, comment);
        return { success: true };
    } catch (error) {
        return { error: error.message };
    }
});

// ==================== 标签管理 ====================

// 获取所有标签
ipcMain.handle('get-tags', async () => {
    try {
        const tags = await tagService.getAllTags();
        return tags;
    } catch (error) {
        return { error: error.message };
    }
});

// 创建新标签
ipcMain.handle('create-tag', async (event, tagData) => {
    try {
        const tag = await tagService.createTag(tagData.name, tagData.color);
        return tag;
    } catch (error) {
        return { error: error.message };
    }
});

// 删除标签
ipcMain.handle('delete-tag', async (event, tagId) => {
    try {
        await tagService.deleteTag(tagId);
        return { success: true };
    } catch (error) {
        return { error: error.message };
    }
});

// 为游戏添加/移除标签
ipcMain.handle('manage-game-tags', async (event, data) => {
    try {
        const { gameId, tags, action } = data;
        const result = await tagService.manageTags(gameId, tags, action);
        return result;
    } catch (error) {
        return { error: error.message };
    }
});

// ==================== 游戏启动 ====================

// 启动游戏
ipcMain.handle('launch-game', async (event, gamePath, platform) => {
    try {
        const emulatorPath = settingsService.getEmulatorPath(platform);
        const result = await launcherService.launchGame(gamePath, platform, emulatorPath);
        return result;
    } catch (error) {
        return { error: error.message };
    }
});

// 获取可用模拟器列表
ipcMain.handle('get-emulators', async () => {
    try {
        const emulators = launcherService.getAvailableEmulators();
        return emulators;
    } catch (error) {
        return { error: error.message };
    }
});

// ==================== 统计数据 ====================

// 获取游戏统计数据
ipcMain.handle('get-game-stats', async (event, platform) => {
    try {
        const stats = await gameService.getStats(platform, gamesDir);
        return stats;
    } catch (error) {
        return { error: error.message };
    }
});

// ==================== 配置管理 ====================

// 获取应用配置
ipcMain.handle('get-settings', async () => {
    try {
        const settings = settingsService.loadSettings();
        return settings;
    } catch (error) {
        return { error: error.message };
    }
});

// 保存应用配置
ipcMain.handle('save-settings', async (event, newSettings) => {
    try {
        settingsService.saveSettings(newSettings);
        return { success: true };
    } catch (error) {
        return { error: error.message };
    }
});

// 更新游戏目录配置
ipcMain.handle('update-games-dir', async (event, dirPath) => {
    try {
        settingsService.setGamesDir(dirPath);
        return { success: true, dirPath };
    } catch (error) {
        return { error: error.message };
    }
});

// 获取游戏目录配置
ipcMain.handle('get-games-dir', async () => {
    try {
        const dir = settingsService.getGamesDir();
        return { dirPath: dir };
    } catch (error) {
        return { error: error.message };
    }
});

// 切换主题
ipcMain.handle('set-theme', async (event, theme) => {
    try {
        settingsService.setTheme(theme);
        return { success: true, theme };
    } catch (error) {
        return { error: error.message };
    }
});

// 获取平台配置
ipcMain.handle('get-platform-config', async () => {
    try {
        const config = await fileService.getPlatformConfig();
        return config;
    } catch (error) {
        return { error: error.message };
    }
});

// ==================== 批量操作 ====================

// 批量更新游戏状态
ipcMain.handle('batch-update-status', async (event, { gameIds, status }) => {
    try {
        const result = await gameService.batchUpdateStatus(gameIds, status, gamesDir);
        return result;
    } catch (error) {
        return { error: error.message };
    }
});

// 批量收藏/取消收藏
ipcMain.handle('batch-toggle-favorite', async (event, { gameIds }) => {
    try {
        const result = await gameService.batchToggleFavorite(gameIds, gamesDir);
        return result;
    } catch (error) {
        return { error: error.message };
    }
});

// 批量删除游戏
ipcMain.handle('batch-delete-games', async (event, { gameIds, deleteFiles }) => {
    try {
        const result = await gameService.batchDeleteGames(gameIds, deleteFiles, gamesDir);
        return result;
    } catch (error) {
        return { error: error.message };
    }
});

// 扫描游戏库
ipcMain.handle('scan-library', async (event, options) => {
    try {
        const result = await gameService.scanLibrary(gamesDir, options);
        return result;
    } catch (error) {
        return { error: error.message };
    }
});

// 刷新游戏列表
ipcMain.handle('refresh-library', async () => {
    try {
        const result = await gameService.refreshLibrary(gamesDir);
        return result;
    } catch (error) {
        return { error: error.message };
    }
});

// ==================== 游戏编辑 ====================

// 编辑游戏信息
ipcMain.handle('edit-game', async (event, gameData) => {
    try {
        const result = await gameService.editGame(gameData, gamesDir);
        return result;
    } catch (error) {
        return { error: error.message };
    }
});

// 更新封面图片
ipcMain.handle('update-poster', async (event, { gameId, posterPath }) => {
    try {
        const result = await gameService.updatePoster(gameId, posterPath, gamesDir);
        return result;
    } catch (error) {
        return { error: error.message };
    }
});
```

### 6.2 渲染进程 IPC 调用（增强版）

```javascript
// preload.js 中暴露 API
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // === 游戏查询 ===
    getPlatforms: () => ipcRenderer.invoke('get-platforms'),
    getGamesByPlatform: (filters) => ipcRenderer.invoke('get-games-by-platform', filters),
    searchGames: (params) => ipcRenderer.invoke('search-games', params),
    getAllGames: (filters) => ipcRenderer.invoke('get-all-games', filters),
    getGameDetail: (gameId) => ipcRenderer.invoke('get-game-detail', gameId),

    // === 游戏状态管理 ===
    updateGameState: (data) => ipcRenderer.invoke('update-game-status', data),
    updatePlayTime: (data) => ipcRenderer.invoke('update-game-playtime', data),
    toggleFavorite: (gameId) => ipcRenderer.invoke('toggle-favorite', gameId),
    saveRating: (data) => ipcRenderer.invoke('save-game-rating', data),

    // === 标签管理 ===
    getTags: () => ipcRenderer.invoke('get-tags'),
    createTag: (tagData) => ipcRenderer.invoke('create-tag', tagData),
    deleteTag: (tagId) => ipcRenderer.invoke('delete-tag', tagId),
    manageTags: (data) => ipcRenderer.invoke('manage-game-tags', data),

    // === 游戏启动 ===
    launchGame: (gamePath, platform) => ipcRenderer.invoke('launch-game', gamePath, platform),
    getEmulators: () => ipcRenderer.invoke('get-emulators'),

    // === 统计数据 ===
    getStats: (platform) => ipcRenderer.invoke('get-game-stats', platform),

    // === 配置管理 ===
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    updateGamesDir: (dirPath) => ipcRenderer.invoke('update-games-dir', dirPath),
    getGamesDir: () => ipcRenderer.invoke('get-games-dir'),
    setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
    getPlatformConfig: () => ipcRenderer.invoke('get-platform-config'),

    // === 批量操作 ===
    batchUpdateStatus: (data) => ipcRenderer.invoke('batch-update-status', data),
    batchToggleFavorite: (data) => ipcRenderer.invoke('batch-toggle-favorite', data),
    batchDeleteGames: (data) => ipcRenderer.invoke('batch-delete-games', data),
    scanLibrary: (options) => ipcRenderer.invoke('scan-library', options),
    refreshLibrary: () => ipcRenderer.invoke('refresh-library'),

    // === 游戏编辑 ===
    editGame: (gameData) => ipcRenderer.invoke('edit-game', gameData),
    updatePoster: (data) => ipcRenderer.invoke('update-poster', data)
});
```

### 6.3 IPC 通信流程图

```
┌─────────────────┐      IPC Invoke       ┌─────────────────┐
│                 │  ───────────────────> │                 │
│  Renderer       │                       │  Main           │
│  Process        │  <────────────────────│  Process        │
│                 │         IPC Response  │                 │
└─────────────────┘                       └────────┬────────┘
                                                   │
                                           ┌───────┴───────┐
                                           │               │
                                           ▼               ▼
                                    ┌─────────────┐ ┌─────────────┐
                                    │ FileService │ │ GameService │
                                    │             │ │             │
                                    └─────────────┘ └─────────────┘
```

---

## 7. 核心算法设计

## 7. 核心算法设计（增强版）

### 7.1 筛选排序算法

```javascript
/**
 * 筛选和排序游戏列表
 * @param {Array} games - 原始游戏列表
 * @param {object} filters - 筛选条件
 * @param {string} filters.platform - 平台筛选
 * @param {string} filters.status - 状态筛选
 * @param {Array} filters.tags - 标签筛选
 * @param {string} filters.sortBy - 排序字段
 * @param {string} filters.sortOrder - 排序方向
 * @returns {Array} 筛选排序后的游戏列表
 */
function applyFiltersAndSort(games, filters) {
    let result = [...games];

    // 平台筛选
    if (filters.platform && filters.platform !== 'all') {
        result = result.filter(game => game.platform === filters.platform);
    }

    // 状态筛选
    if (filters.status && filters.status !== 'all') {
        result = result.filter(game => game.status === filters.status);
    }

    // 标签筛选
    if (filters.tags && filters.tags.length > 0) {
        result = result.filter(game => {
            const gameTags = game.tags || [];
            return filters.tags.every(tag => gameTags.includes(tag));
        });
    }

    // 收藏筛选
    if (filters.favoriteOnly) {
        result = result.filter(game => game.favorite);
    }

    // 排序
    const sortBy = filters.sortBy || 'name';
    const sortOrder = filters.sortOrder || 'asc';

    result.sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'playtime':
                comparison = a.totalPlayTime - b.totalPlayTime;
                break;
            case 'rating':
                comparison = (a.userRating || 0) - (b.userRating || 0);
                break;
            case 'lastPlayed':
                comparison = new Date(b.lastPlayed || 0) - new Date(a.lastPlayed || 0);
                break;
            case 'firstPlayed':
                comparison = new Date(a.firstPlayed || 0) - new Date(b.firstPlayed || 0);
                break;
        }

        return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
}
```

### 7.2 游戏搜索算法

```javascript
/**
 * 游戏搜索功能实现
 * 支持模糊匹配游戏名称和描述
 */
async searchGames(keyword, gamesDir) {
    const games = [];

    // 获取所有平台
    const platforms = await this.fileService.getSimulatorFolders(gamesDir);

    for (const platform of platforms) {
        const platformGames = await this.getGamesByPlatform(platform, gamesDir);

        for (const game of platformGames) {
            const matchName = game.name.toLowerCase().includes(keyword.toLowerCase());
            const matchDesc = game.description?.toLowerCase().includes(keyword.toLowerCase());

            if (matchName || matchDesc) {
                games.push(game);
            }
        }
    }

    return games;
}

```javascript
/**
 * 游戏搜索功能实现
 * 支持模糊匹配游戏名称和描述
 */
async searchGames(keyword, gamesDir) {
    const games = [];

    // 获取所有平台
    const platforms = await this.fileService.getSimulatorFolders(gamesDir);

    for (const platform of platforms) {
        const platformGames = await this.getGamesByPlatform(platform, gamesDir);

        for (const game of platformGames) {
            const matchName = game.name.toLowerCase().includes(keyword.toLowerCase());
            const matchDesc = game.description?.toLowerCase().includes(keyword.toLowerCase());

            if (matchName || matchDesc) {
                games.push(game);
            }
        }
    }

    return games;
}
```

### 7.2 游戏状态更新算法

```javascript
/**
 * 游戏状态更新逻辑
 * @param {string} gamePath - 游戏路径
 * @param {string} action - 操作类型：start_play | pause | continue | complete | abandon
 * @param {number} duration - 本次游玩时长（分钟）
 */
async function updateGameState(gamePath, action, duration = 0) {
    const gameData = await readGameJson(gamePath);

    switch (action) {
        case 'start_play':
            gameData.status = 'playing';
            if (!gameData.firstPlayed) {
                gameData.firstPlayed = formatDate(new Date());
            }
            break;

        case 'pause':
            // 记录暂停时间，稍后恢复
            pauseStartTime = Date.now();
            break;

        case 'continue':
            // 恢复游玩状态
            gameData.status = 'playing';
            break;

        case 'complete':
            gameData.status = 'completed';
            if (duration > 0) {
                gameData.totalPlayTime = (gameData.totalPlayTime || 0) + duration;
                gameData.playCount = (gameData.playCount || 0) + 1;
            }
            gameData.lastPlayed = formatDate(new Date());
            break;

        case 'abandon':
            gameData.status = 'abandoned';
            gameData.lastPlayed = formatDate(new Date());
            break;

        default:
            // 仅记录游玩时长
            if (duration > 0) {
                gameData.totalPlayTime = (gameData.totalPlayTime || 0) + duration;
                gameData.playCount = (gameData.playCount || 0) + 1;
                gameData.lastPlayed = formatDate(new Date());
            }
    }

    await writeGameJson(gamePath, gameData);
    return gameData;
}
```

### 7.3 海报墙渲染算法

```javascript
/**
 * 渲染海报墙
 * @param {Array} games - 游戏列表
 */
function renderPosterWall(games) {
    const wall = document.getElementById('poster-wall');

    // 清空现有内容
    wall.innerHTML = '';

    // 遍历游戏列表，创建卡片
    for (const game of games) {
        const card = createGameCard(game);
        wall.appendChild(card);
    }

    // 更新统计卡片
    updateStatsCards(games);
}

/**
 * 创建游戏卡片
 */
function createGameCard(game) {
    const card = document.createElement('div');
    card.className = `game-card game-card--${game.status}`;
    card.dataset.gameId = game.id;
    card.dataset.gamePath = game.path;

    // 根据状态显示不同的视觉标记
    const statusBadge = getStatusBadge(game.status);

    card.innerHTML = `
        <div class="game-card__poster-wrapper">
            <img src="${game.posterPath}" alt="${game.name}" class="game-poster" loading="lazy">
            <div class="game-card__overlay">
                ${game.favorite ? '<span class="badge badge--favorite">❤️</span>' : ''}
                ${game.userRating ? `<span class="badge badge--rating">⭐${game.userRating}</span>` : ''}
            </div>
            ${statusBadge}
        </div>
        <div class="game-card__info">
            <div class="game-name" title="${game.name}">${game.name}</div>
            <div class="game-platform">
                <img src="${game.platformIcon}" alt="${game.platformName}" class="platform-icon">
                <span>${game.platformName}</span>
            </div>
            ${game.status === 'playing' ? `<div class="game-playtime">已玩：${game.totalPlayTime}小时</div>` : ''}
            ${game.tags && game.tags.length > 0 ? `
                <div class="game-tags">
                    ${game.tags.slice(0, 3).map(tag => `<span class="tag tag--${tag}">${tag}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `;

    // 绑定事件
    card.addEventListener('click', (e) => {
        if (e.target.closest('.game-card__overlay')) return;
        openGameDetail(game.id);
    });

    card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        openGameContextMenu(game.id, e.clientX, e.clientY);
    });

    return card;
}

/**
 * 更新统计卡片
 */
function updateStatsCards(games) {
    const stats = {
        total: games.length,
        played: 0,
        playing: 0,
        unplayed: 0,
        totalHours: 0,
        avgRating: 0,
        favorites: 0
    };

    let ratingSum = 0;
    let ratedCount = 0;

    for (const game of games) {
        if (game.status === 'played') stats.played++;
        else if (game.status === 'playing') stats.playing++;
        else stats.unplayed++;

        if (game.totalPlayTime) stats.totalHours += game.totalPlayTime / 60;

        if (game.userRating) {
            ratingSum += game.userRating;
            ratedCount++;
        }

        if (game.favorite) stats.favorites++;
    }

    if (ratedCount > 0) {
        stats.avgRating = (ratingSum / ratedCount).toFixed(1);
    }

    // 更新 DOM
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-played').textContent = stats.played;
    document.getElementById('stat-playing').textContent = stats.playing;
    document.getElementById('stat-unplayed').textContent = stats.unplayed;
    document.getElementById('stat-totalhours').textContent = stats.totalHours.toFixed(1) + '小时';
    document.getElementById('stat-avg-rating').textContent = stats.avgRating;
    document.getElementById('stat-favorites').textContent = stats.favorites;
}
```

```javascript
/**
 * 渲染海报墙
 * @param {Array} games - 游戏列表
 */
function renderPosterWall(games) {
    const wall = document.getElementById('poster-wall');

    // 清空现有内容
    wall.innerHTML = '';

    // 遍历游戏列表，创建卡片
    for (const game of games) {
        const card = createGameCard(game);
        wall.appendChild(card);
    }
}

/**
 * 创建游戏卡片
 */
function createGameCard(game) {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.dataset.gamePath = game.path;

    card.innerHTML = `
        <img src="${game.posterPath}" alt="${game.name}" class="game-poster">
        <div class="game-info">
            <div class="game-name" title="${game.name}">${game.name}</div>
            <div class="game-platform">
                <img src="${game.platformIcon}" alt="${game.platformName}" class="platform-icon">
                <span>${game.platformName}</span>
            </div>
        </div>
    `;

    // 绑定点击事件
    card.addEventListener('click', () => {
        window.api.getGameDetail(game.path).then(detail => {
            window.createDetailWindow(detail);
        });
    });

    return card;
}
```

### 7.3 平台筛选算法

```javascript
/**
 * 筛选海报墙显示的游戏
 * @param {string} platform - 选中的平台标识
 */
function filterByPlatform(platform) {
    if (platform === 'all') {
        // 显示所有游戏
        const allGames = [];
        for (const [platformId, games] of gameDataCache) {
            allGames.push(...games);
        }
        renderPosterWall(allGames);
    } else {
        // 只显示指定平台的游戏
        const games = gameDataCache.get(platform) || [];
        renderPosterWall(games);
    }
}
```

---

## 8. 错误处理设计

### 8.1 错误类型定义

```javascript
// 错误类型枚举
const ErrorType = {
    FILE_NOT_FOUND: 'FILE_NOT_FOUND',
    INVALID_JSON: 'INVALID_JSON',
    INVALID_GAME: 'INVALID_GAME',
    PLATFORM_NOT_FOUND: 'PLATFORM_NOT_FOUND',
    PERMISSION_DENIED: 'PERMISSION_DENIED'
};

/**
 * 自定义错误类
 */
class GameManagementError extends Error {
    constructor(type, message) {
        super(message);
        this.type = type;
        this.timestamp = new Date();
    }
}
```

### 8.2 错误处理策略

```javascript
// 错误处理中间件
function withErrorHandling(fn) {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            if (error instanceof GameManagementError) {
                throw error;
            }
            throw new GameManagementError(
                ErrorType.UNKNOWN_ERROR,
                `未知错误：${error.message}`
            );
        }
    };
}

// 使用示例
ipcMain.handle('get-games-by-platform', withErrorHandling(async (event, platform) => {
    const gameService = new GameService();
    return await gameService.getGamesByPlatform(platform, gamesDir);
}));
```

---

## 9. 安全设计

### 9.1 IPC 通信安全

```javascript
// preload.js - 安全地暴露 API
const { contextBridge, ipcRenderer } = require('electron');

// 只暴露必要的方法，避免直接暴露 ipcRenderer
contextBridge.exposeInMainWorld('api', {
    // 封装 IPC 调用
    getPlatforms: () => ipcRenderer.invoke('get-platforms'),
    getGamesByPlatform: (platform) => ipcRenderer.invoke('get-games-by-platform', platform),
    searchGames: (keyword) => ipcRenderer.invoke('search-games', keyword),
    getGameDetail: (gamePath) => ipcRenderer.invoke('get-game-detail', gamePath),
    getPlatformConfig: () => ipcRenderer.invoke('get-platform-config')
});

// 主进程验证输入参数
ipcMain.handle('get-games-by-platform', (event, platform) => {
    // 验证 platform 参数
    if (typeof platform !== 'string' || !platform.trim()) {
        throw new Error('Invalid platform parameter');
    }
    // 防止路径遍历攻击
    const sanitizedPlatform = platform.replace(/[^a-zA-Z0-9_-]/g, '');
    // ...
});
```

### 9.2 文件路径验证

```javascript
// 防止路径遍历攻击
function sanitizePath(baseDir, relativePath) {
    const fullPath = path.resolve(baseDir, relativePath);
    if (!fullPath.startsWith(path.resolve(baseDir))) {
        throw new GameManagementError(
            ErrorType.PERMISSION_DENIED,
            '非法的文件路径访问'
        );
    }
    return fullPath;
}
```

---

## 10. 配置文件设计

### 10.1 package.json

```json
{
  "name": "game-mgt",
  "version": "1.0.0",
  "description": "模拟器游戏管理程序",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "dev": "electron . --dev",
    "build": "electron-builder"
  },
  "keywords": ["game", "manager", "emulator", "electron"],
  "author": "",
  "license": "MIT",
  "devDependencies": {
    "electron": "^25.0.0",
    "electron-builder": "^24.0.0"
  },
  "build": {
    "appId": "com.game-mgt.app",
    "productName": "游戏管理程序",
    "directories": {
      "output": "dist"
    },
    "win": {
      "target": "nsis",
      "icon": "assets/icon.png"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    }
  }
}
```

---

## 11. 项目实现步骤

### 11.1 阶段一：项目初始化

1. 初始化项目目录结构
2. 配置 package.json
3. 创建 Electron 主进程入口 main.js
4. 创建 preload.js

### 11.2 阶段二：核心服务开发

1. 实现 FileService 类
2. 实现 GameService 类
3. 实现 IPC 通信处理器

### 11.3 阶段三：界面开发

1. 创建主界面 HTML 和 CSS
2. 实现海报墙渲染逻辑
3. 实现平台筛选功能
4. 实现搜索功能

### 11.4 阶段四：详情窗口开发

1. 创建详情窗口 HTML 和 CSS
2. 实现详情窗口逻辑
3. 实现窗口间数据传递

### 11.5 阶段五：测试与优化

1. 功能测试
2. 性能优化
3. 打包发布

---

## 12. 性能优化

### 12.1 海报懒加载

```javascript
/**
 * 使用 Intersection Observer 实现海报懒加载
 */
class LazyLoader {
    constructor() {
        this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
            rootMargin: '50px'
        });
    }

    handleIntersection(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                this.observer.unobserve(img);
            }
        });
    }

    load(images) {
        images.forEach(img => {
            this.observer.observe(img);
        });
    }
}
```

### 12.2 数据缓存

```javascript
/**
 * 游戏数据缓存
 */
class DataCache {
    constructor() {
        this.gameDataCache = new Map();
        this.platformCache = new Map();
    }

    setGames(platform, games) {
        this.gameDataCache.set(platform, games);
    }

    getGames(platform) {
        return this.gameDataCache.get(platform);
    }

    hasGames(platform) {
        return this.gameDataCache.has(platform);
    }
}
```

---

## 13. 游戏启动器脚本设计

### 13.1 通用启动器实现

```javascript
// executors/common-launcher.js
const { spawn } = require('child_process');
const path = require('path');

class GameLauncher {
    constructor(options = {}) {
        this.onGameStarted = options.onGameStarted;
        this.onGameExited = options.onGameExited;
        this.onError = options.onError;
    }

    /**
     * 启动游戏
     * @param {string} emulatorPath - 模拟器可执行文件路径
     * @param {string} gamePath - 游戏文件路径
     * @param {string[]} args - 额外参数
     * @returns {Promise<object>} 启动结果
     */
    async launch(emulatorPath, gamePath, args = []) {
        return new Promise((resolve, reject) => {
            try {
                // 验证文件是否存在
                if (!this.fileExists(emulatorPath)) {
                    throw new Error(`模拟器未找到：${emulatorPath}`);
                }
                if (!this.fileExists(gamePath)) {
                    throw new Error(`游戏文件未找到：${gamePath}`);
                }

                // 构建命令参数
                const cmdArgs = this.buildArgs(gamePath, args);

                console.log(`启动模拟器：${emulatorPath}`, cmdArgs);

                // 启动进程
                const process = spawn(emulatorPath, cmdArgs, {
                    detached: false,
                    stdio: 'ignore',
                    windowsHide: true
                });

                const pid = process.pid;

                // 监听进程退出
                process.on('close', (code) => {
                    console.log(`游戏进程已退出，PID: ${pid}, 退出码：${code}`);
                    if (this.onGameExited) {
                        this.onGameExited({ pid, code });
                    }
                });

                // 监听错误
                process.on('error', (err) => {
                    console.error(`启动失败：${err.message}`);
                    if (this.onError) {
                        this.onError(err);
                    }
                    reject(err);
                });

                // 启动成功
                if (this.onGameStarted) {
                    this.onGameStarted({ pid, emulatorPath, gamePath });
                }

                resolve({
                    success: true,
                    pid,
                    emulatorPath,
                    gamePath
                });

            } catch (error) {
                if (this.onError) {
                    this.onError(error);
                }
                reject(error);
            }
        });
    }

    /**
     * 构建参数列表
     * @param {string} gamePath - 游戏路径
     * @param {string[]} args - 额外参数
     * @returns {string[]} 参数数组
     */
    buildArgs(gamePath, args = []) {
        // 支持占位符替换
        const processedArgs = args.map(arg =>
            arg.replace('{gamePath}', gamePath)
               .replace('{gameName}', path.basename(gamePath))
        );
        return processedArgs;
    }

    /**
     * 验证文件是否存在
     */
    fileExists(filePath) {
        try {
            const fs = require('fs');
            fs.accessSync(filePath);
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = GameLauncher;
```

### 13.2 各平台启动脚本

```javascript
// executors/ps2-launcher.js
const GameLauncher = require('./common-launcher');

class PS2Launcher extends GameLauncher {
    constructor() {
        super();
        this.defaultEmulatorPath = 'C:\\Emulators\\PCSX2\\pcsx2.exe';
        this.defaultArgs = ['-boot', '{gamePath}'];
    }

    /**
     * 获取模拟器配置
     */
    getEmulatorConfig() {
        return {
            id: 'ps2',
            name: 'PCSX2',
            executable: this.defaultEmulatorPath,
            args: this.defaultArgs,
            fileExtensions: ['.iso', '.bin', '.img'],
            recommended: true
        };
    }

    /**
     * 验证游戏文件
     */
    validateGameFile(gamePath) {
        const ext = path.extname(gamePath).toLowerCase();
        return ['.iso', '.bin', '.img', '.img'].includes(ext);
    }
}

module.exports = PS2Launcher;
```

```javascript
// executors/ps1-launcher.js
const GameLauncher = require('./common-launcher');

class PS1Launcher extends GameLauncher {
    constructor() {
        super();
        this.defaultEmulatorPath = 'C:\\Emulators\\DuckStation\\duckstation.exe';
        this.defaultArgs = ['-batchmode', '-cdrom', '{gamePath}'];
    }

    getEmulatorConfig() {
        return {
            id: 'ps1',
            name: 'DuckStation',
            executable: this.defaultEmulatorPath,
            args: this.defaultArgs,
            fileExtensions: ['.iso', '.cue', '.bin'],
            recommended: true
        };
    }

    validateGameFile(gamePath) {
        const ext = path.extname(gamePath).toLowerCase();
        return ['.iso', '.cue', '.bin'].includes(ext);
    }
}

module.exports = PS1Launcher;
```

```javascript
// executors/psp-launcher.js
const GameLauncher = require('./common-launcher');

class PSPLauncher extends GameLauncher {
    constructor() {
        super();
        this.defaultEmulatorPath = 'C:\\Emulators\\PPSSPP\\PPSSPPSDL.exe';
        this.defaultArgs = ['-boot', '{gamePath}'];
    }

    getEmulatorConfig() {
        return {
            id: 'psp',
            name: 'PPSSPP',
            executable: this.defaultEmulatorPath,
            args: this.defaultArgs,
            fileExtensions: ['.iso', '.cso'],
            recommended: true
        };
    }

    validateGameFile(gamePath) {
        const ext = path.extname(gamePath).toLowerCase();
        return ['.iso', '.cso'].includes(ext);
    }
}

module.exports = PSPLauncher;
```

## 14. 快捷键系统设计

### 14.1 快捷键配置结构

```javascript
// 快捷键配置对象
const defaultShortcuts = {
    // 导航
    'focus-search': {
        combo: 'Ctrl+K',
        description: '聚焦搜索框'
    },
    'open-search': {
        combo: 'Ctrl+F',
        description: '打开搜索框'
    },

    // 游戏操作
    'launch-game': {
        combo: 'Enter',
        description: '启动选中的游戏'
    },
    'game-details': {
        combo: 'Ctrl+D',
        description: '打开游戏详情'
    },
    'edit-game': {
        combo: 'Ctrl+E',
        description: '编辑游戏信息'
    },
    'toggle-favorite': {
        combo: 'F',
        description: '切换收藏状态'
    },
    'delete-game': {
        combo: 'Delete',
        description: '删除游戏'
    },

    // 库操作
    'refresh-library': {
        combo: 'R',
        description: '刷新游戏库'
    },
    'scan-library': {
        combo: 'Ctrl+R',
        description: '扫描游戏库'
    },

    // 视图操作
    'toggle-theme': {
        combo: 'Ctrl+T',
        description: '切换主题'
    },
    'next-page': {
        combo: 'PageDown',
        description: '下一页'
    },
    'prev-page': {
        combo: 'PageUp',
        description: '上一页'
    },

    // 设置
    'open-settings': {
        combo: 'Ctrl+,',
        description: '打开设置'
    },
    'close-settings': {
        combo: 'Escape',
        description: '关闭设置'
    }
};
```

### 14.2 快捷键管理器

```javascript
// services/ShortcutManager.js
const { globalShortcut, app } = require('electron');

class ShortcutManager {
    constructor(window) {
        this.window = window;
        this.shortcuts = new Map();
        this.registered = new Map();
    }

    /**
     * 注册所有快捷键
     */
    registerAll(shortcuts) {
        Object.entries(shortcuts).forEach(([key, config]) => {
            this.register(key, config.combo, config.action);
        });
    }

    /**
     * 注册单个快捷键
     */
    register(key, combo, action) {
        if (this.registered.has(key)) {
            this.unregister(key);
        }

        const accelerator = this.parseAccelerator(combo);
        const success = globalShortcut.register(accelerator, action);

        if (success) {
            this.registered.set(key, accelerator);
        }

        return success;
    }

    /**
     * 解析快捷键组合
     */
    parseAccelerator(combo) {
        const parts = combo.split('+');
        const modifiers = [];
        let key = '';

        parts.forEach(part => {
            const lower = part.toLowerCase().trim();
            switch (lower) {
                case 'ctrl':
                    modifiers.push('Control');
                    break;
                case 'alt':
                    modifiers.push('Alt');
                    break;
                case 'shift':
                    modifiers.push('Shift');
                    break;
                case 'meta':
                case 'win':
                    modifiers.push('Command');
                    break;
                default:
                    key = part.toUpperCase();
            }
        });

        return [...modifiers, key].filter(Boolean).join('+');
    }

    /**
     * 注销单个快捷键
     */
    unregister(key) {
        const accelerator = this.registered.get(key);
        if (accelerator) {
            globalShortcut.unregister(accelerator);
            this.registered.delete(key);
        }
    }

    /**
     * 注销所有快捷键
     */
    unregisterAll() {
        this.registered.forEach((_, key) => {
            this.unregister(key);
        });
    }

    /**
     * 获取快捷键状态
     */
    getShortcutStatus(key) {
        return this.registered.has(key);
    }

    /**
     * 更新快捷键
     */
    updateShortcut(key, newCombo, newAction) {
        this.unregister(key);
        this.register(key, newCombo, newAction);
    }
}

module.exports = ShortcutManager;
```

## 15. 批量操作设计

### 15.1 批量操作服务

```javascript
// services/BatchOperationService.js
const { EventEmitter } = require('events');

class BatchOperationService extends EventEmitter {
    constructor(gameService) {
        super();
        this.gameService = gameService;
        this.isRunning = false;
        this.cancelled = false;
    }

    /**
     * 批量更新游戏状态
     */
    async updateStatus(gameIds, status) {
        return this.executeBatch(gameIds, (id) =>
            this.gameService.updateGameState(id, { status })
        );
    }

    /**
     * 批量切换收藏状态
     */
    async toggleFavorite(gameIds) {
        return this.executeBatch(gameIds, (id) =>
            this.gameService.toggleFavorite(id)
        );
    }

    /**
     * 批量删除游戏
     */
    async deleteGames(gameIds, deleteFiles = false) {
        const results = await this.executeBatch(gameIds, (id) =>
            this.gameService.deleteGame(id, deleteFiles)
        );

        // 触发数据库更新事件
        this.emit('gamesDeleted', results);

        return results;
    }

    /**
     * 执行批量操作
     */
    async executeBatch(gameIds, operation) {
        if (this.isRunning) {
            throw new Error('批量操作正在执行中');
        }

        this.isRunning = true;
        this.cancelled = false;
        const results = [];
        const total = gameIds.length;

        try {
            for (let i = 0; i < gameIds.length; i++) {
                if (this.cancelled) {
                    break;
                }

                const gameId = gameIds[i];
                const progress = ((i + 1) / total) * 100;

                this.emit('progress', {
                    current: i + 1,
                    total,
                    progress,
                    operation: 'batch'
                });

                const result = await operation(gameId);
                results.push({ gameId, result, success: true });

                this.emit('itemComplete', {
                    gameId,
                    result,
                    index: i,
                    total
                });
            }
        } finally {
            this.isRunning = false;
            this.emit('complete', { results, total, cancelled: this.cancelled });
        }

        return results;
    }

    /**
     * 取消批量操作
     */
    cancel() {
        this.cancelled = true;
        this.emit('cancelled');
    }
}

module.exports = BatchOperationService;
```

---

## 13. 总结（更新版）

本文档详细描述了模拟器游戏管理程序的增强设计方案，包括：

### 核心功能概览

1. **系统架构**：Electron 双进程架构，主进程负责文件系统操作和游戏启动，渲染进程负责 UI 展示

2. **数据持久化**：
   - 游戏元数据存储在 `game.json` 文件中
   - 游戏状态和统计数据存储在 SQLite 数据库中
   - 应用配置存储在 `settings.json` 文件中

3. **游戏状态追踪**：
   - 支持未开始、游玩中、已完成、已放弃四种状态
   - 记录游戏次数、总游戏时长、最后游玩时间
   - 支持用户评分和评论

4. **标签系统**：
   - 预定义标签（动作、冒险、RPG 等）
   - 支持自定义标签
   - 支持多标签筛选

5. **筛选排序**：
   - 支持按平台、状态、标签多维度筛选
   - 支持按名称、时长、评分等多种排序方式

6. **游戏启动**：
   - 支持各平台模拟器启动脚本
   - 支持配置模拟器路径和启动参数
   - 进程管理和错误处理

7. **批量操作**：
   - 批量更新状态
   - 批量收藏/取消收藏
   - 批量删除游戏
   - 进度显示和取消功能

8. **配置系统**：
   - 主题切换（深色/浅色）
   - 布局自定义
   - 快捷键配置
   - 游戏目录配置

9. **界面设计**：
   - 左右结构侧边栏 + 海报墙
   - 顶部筛选工具栏
   - 游戏统计卡片
   - 游戏详情窗口
   - 支持网格/列表视图切换

10. **安全设计**：
    - IPC 通信安全
    - 文件路径验证防止路径遍历攻击
    - 输入参数验证

该设计方案具有良好的可扩展性和可维护性，可以满足游戏管理的全部需求，并为后续功能扩展预留了接口。

本文档详细描述了模拟器游戏管理程序的设计方案，包括：

1. **系统架构**：Electron 双进程架构，主进程负责文件系统操作，渲染进程负责 UI 展示
2. **模块设计**：文件服务、游戏服务、窗口管理三个核心模块
3. **界面设计**：左右结构的模拟器列表和海报墙，响应式设计支持搜索和筛选
4. **数据存储**：基于 JSON 的文件存储方案
5. **安全设计**：IPCs 通信安全和文件路径验证
6. **性能优化**：海报懒加载和数据缓存

该设计方案具有良好的可扩展性和可维护性，可以满足游戏管理的基本需求，并为后续功能扩展预留了接口。
