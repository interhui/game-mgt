# Game MGT

一款用于管理多平台模拟器游戏的桌面游戏管理器。

## 功能特性

### 游戏库管理
- **多平台支持**：管理来自不同模拟器平台的游戏（PS2、PSP、Nintendo 等）
- **海报墙视图**：以可视化网格展示游戏收藏
- **游戏详情弹窗**：在独立窗口中查看游戏信息
- **游戏盒子收藏**：按收藏集组织和浏览游戏

### 游戏信息
- 游戏状态追踪（未玩 / 游玩中 / 已完成）
- 个人评分系统（1-5 星）
- 收藏标记
- 标签分类
- 游戏时长记录
- 最后游玩时间

### 搜索与筛选
- 按名称搜索游戏
- 按平台、状态、标签、收藏筛选

### 模拟器集成
- 为每个平台配置模拟器
- 直接从应用程序启动游戏

### 主题支持
- 深色和浅色主题选项
- 主题切换应用到所有窗口

## 目录结构

```
games/
└── {platform}/          # 平台文件夹（如 ps2、psp）
    └── {game-folder}/   # 单个游戏文件夹
        └── game.json    # 游戏元数据文件
```

`game.json` 示例：
```json
{
  "id": "unique-id",
  "name": "Game Name",
  "platform": "ps2",
  "folderName": "game-folder",
  "status": "unplayed",
  "userRating": 0,
  "favorite": false,
  "tags": [],
  "description": "",
  "publishDate": "",
  "playTime": 0,
  "lastPlayed": null
}
```

## 快速开始

### 环境要求
- Node.js 18+
- npm

### 安装

```bash
npm install
```

### 命令

| 命令 | 说明 |
|------|------|
| `npm start` | 以生产模式运行应用 |
| `npm run dev` | 以开发模式运行（带日志） |
| `npm run build` | 构建 Windows 可执行文件 |
| `npm test` | 运行 Jest 测试 |

### 配置

1. 首次运行时会创建包含默认设置的 `config/settings.json`
2. 在设置中配置游戏库目录
3. 在 `config/platforms.json` 中添加平台定义

## 架构

- **主进程**：Electron 主进程，处理 IPC、文件操作和游戏管理
- **渲染进程**：HTML + 原生 JavaScript 构建 UI
- **服务层**：
  - `FileService`：文件系统操作
  - `GameService`：游戏增删改查操作
  - `DatabaseService`：用户数据存储
  - `SettingsService`：应用配置
  - `LauncherService`：模拟器游戏启动
  - `TagService`：标签管理
  - `BoxService`：游戏收藏集管理

## 开源协议

Apache License 2.0
