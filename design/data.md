# 游戏管理程序 - 数据文件格式

## 1. 概述

游戏管理程序使用 JSON 格式存储数据，主要涉及三个配置文件：
- `settings.json` - 应用设置
- `game.json` - 游戏信息
- `{boxName}.json` - 游戏盒子数据

## 2. settings.json

应用配置文件，位于 `config/settings.json`。

### 2.1 完整示例

```json
{
  "version": "1.0.0",
  "lastUpdate": 1773560220649,
  "appearance": {
    "theme": "dark",
    "language": "zh-CN",
    "showPlatformIcons": true,
    "showDescriptions": true,
    "enableAnimations": true
  },
  "layout": {
    "sidebarWidth": 200,
    "posterSize": "medium",
    "columns": 6,
    "viewMode": "grid",
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
    },
    "switch": {
      "name": "Ryujinx",
      "path": "C:\\Emulators\\Ryujinx\\ryujinx.exe",
      "arguments": "{gamePath}"
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
  },
  "gamebox": {
    "gameboxDir": "D:\\Develop\\Workspace\\game-mgt\\boxes"
  }
}
```

### 2.2 字段说明

| 字段路径 | 类型 | 说明 |
|---------|------|------|
| version | string | 配置版本号 |
| lastUpdate | number | 最后更新时间（时间戳） |
| appearance.theme | string | 主题：`dark` 或 `light` |
| appearance.language | string | 语言代码，如 `zh-CN` |
| appearance.showPlatformIcons | boolean | 是否显示平台图标 |
| appearance.showDescriptions | boolean | 是否显示游戏描述 |
| appearance.enableAnimations | boolean | 是否启用动画 |
| layout.sidebarWidth | number | 侧边栏宽度（像素） |
| layout.posterSize | string | 海报大小：`small`、`medium`、`large` |
| layout.columns | number | 网格视图列数 |
| layout.viewMode | string | 视图模式：`grid` 或 `list` |
| layout.sortBy | string | 排序字段，如 `name`、`rating` |
| layout.sortOrder | string | 排序方向：`asc` 或 `desc` |
| library.gamesDir | string | 游戏目录路径 |
| library.scanOnStartup | boolean | 启动时是否扫描游戏 |
| library.autoRefresh | boolean | 是否自动刷新 |
| library.showHiddenFiles | boolean | 是否显示隐藏文件 |
| library.includeSubfolders | boolean | 是否包含子文件夹 |
| emulators.{platform}.name | string | 模拟器名称 |
| emulators.{platform}.path | string | 模拟器可执行文件路径 |
| emulators.{platform}.arguments | string | 启动参数，`{gamePath}` 会被替换为游戏路径 |
| shortcuts.{action} | string | 快捷键配置 |
| notifications.enableStartup | boolean | 启动时是否显示通知 |
| notifications.enableLibraryUpdate | boolean | 库更新时是否通知 |
| notifications.showPlayReminders | boolean | 是否显示游玩提醒 |
| import.autoImport | boolean | 是否自动导入 |
| import.importPaths | array | 自动导入路径列表 |
| gamebox.gameboxDir | string | 游戏盒子存储目录 |

## 3. game.json

游戏信息文件，位于每个游戏文件夹中，如 `games/ps2/gta-san-andreas/game.json`。

### 3.1 完整示例

```json
{
    "id": "ps2-gta-san-andreas",
    "name": "GTA: San Andreas",
    "description": "一款开放世界的动作冒险游戏，玩家可以在游戏中自由探索圣安地列斯城，完成各种任务。",
    "publishDate": "2004-10-26",
    "platform": "ps2",
    "status": "completed",
    "playCount": 15,
    "totalPlayTime": 3600,
    "lastPlayed": "2024-02-15",
    "firstPlayed": "2024-01-01",
    "favorite": true,
    "userRating": 5,
    "userComment": "经典中的经典！",
    "tags": ["action", "adventure", "open-world"],
    "customTags": ["必玩", "神作"],
    "developer": "Rockstar Games",
    "publisher": "Rockstar Games",
    "genre": ["action", "adventure"]
}
```

### 3.2 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 游戏唯一标识，格式为 `平台-游戏名称`（小写） |
| name | string | 游戏显示名称 |
| description | string | 游戏描述文字 |
| publishDate | string | 发行日期，格式 `YYYY-MM-DD` |
| platform | string | 游戏平台标识，如 `ps2`、`ps1`、`switch` |
| status | string | 游戏状态：`unplayed`（未玩）、`playing`（游戏中）、`played`（已玩）、`completed`（已完成） |
| playCount | number | 游玩次数 |
| totalPlayTime | number | 总游戏时长（分钟） |
| lastPlayed | string | 最后游玩日期，格式 `YYYY-MM-DD` |
| firstPlayed | string | 首次游玩日期，格式 `YYYY-MM-DD` |
| favorite | boolean | 是否收藏 |
| userRating | number | 用户评分，范围 1-5 |
| userComment | string | 用户评论文字 |
| tags | array | 标签ID数组，如 `["action", "adventure"]` |
| customTags | array | 自定义标签数组，如 `["必玩", "神作"]` |
| developer | string | 游戏开发商 |
| publisher | string | 游戏发行商 |
| genre | array | 游戏类型数组 |

### 3.3 平台标识

| 标识 | 平台名称 |
|------|----------|
| ps2 | PlayStation 2 |
| ps1 | PlayStation |
| psp | PlayStation Portable |
| xbox360 | Xbox 360 |
| switch | Nintendo Switch |
| pc | PC Games |
| wii | Nintendo Wii |
| wiiu | Nintendo Wii U |
| 3ds | Nintendo 3DS |
| n64 | Nintendo 64 |

## 4. {boxName}.json

游戏盒子文件，位于 `boxes/` 目录下，每个盒子一个 JSON 文件。

### 4.1 完整示例

```json
{
  "ps1": [
    {
      "id": "ps1-final-fantasy-vii",
      "status": "played",
      "firstPlayed": "",
      "lastPlayed": "",
      "totalPlayTime": 0,
      "playCount": 0
    },
    {
      "id": "ps1-metal-gear-solid",
      "status": "unplayed",
      "firstPlayed": "",
      "lastPlayed": "",
      "totalPlayTime": 0,
      "playCount": 0
    }
  ],
  "ps2": [
    {
      "id": "ps2-gta-san-andreas",
      "status": "unplayed",
      "firstPlayed": "",
      "lastPlayed": "",
      "totalPlayTime": 0,
      "playCount": 0
    }
  ]
}
```

### 4.2 字段说明

文件结构为键值对，键是平台标识，值是该平台下游戏数组。

**游戏对象字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 游戏ID，对应 game.json 中的 id |
| status | string | 盒子中的游戏状态：`unplayed`（未玩）、`playing`（游戏中）、`played`（已玩）、`completed`（已完成） |
| firstPlayed | string | 首次游玩日期（盒子内），格式 `YYYY-MM-DD` |
| lastPlayed | string | 最后游玩日期（盒子内），格式 `YYYY-MM-DD` |
| totalPlayTime | number | 累计游戏时长（分钟） |
| playCount | number | 游玩次数 |

## 5. platforms.json

平台配置文件，位于 `config/platforms.json`。

### 5.1 完整示例

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
        }
    ],
    "predefinedTags": [
        { "id": "action", "name": "动作", "color": "#E60012" },
        { "id": "adventure", "name": "冒险", "color": "#00B7C1" }
    ],
    "customTags": []
}
```

### 5.2 字段说明

**平台对象：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 平台唯一标识 |
| name | string | 平台显示名称 |
| shortName | string | 平台短名称 |
| icon | string | 图标路径 |
| color | string | 主题颜色（十六进制） |
| emulatorId | string | 对应的模拟器ID |
| order | number | 显示顺序 |

**预定义标签对象：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 标签唯一标识 |
| name | string | 标签显示名称 |
| color | string | 标签颜色（十六进制） |

## 6. 数据存储位置

| 数据类型 | 存储位置 |
|---------|----------|
| 应用设置 | `config/settings.json` |
| 平台配置 | `config/platforms.json` |
| 游戏信息 | `games/{platform}/{gameFolder}/game.json` |
| 游戏盒子 | `boxes/{boxName}.json` |
| 应用日志 | `{userData}/logs/main.log` |
