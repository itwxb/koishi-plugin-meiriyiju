---
name: "koishi-publish"
description: "发布 Koishi 插件到 npm / Koishi 市场。当用户说「发布」「发版」「publish」「推一下」或类似指令时立即调用。"
---

# Koishi 插件发布（本项目专用）

针对 `koishi-plugin-meiriyiju` 的标准化发布流程。

## 何时调用

- 用户说「发布」「发版」「publish」「推一下」「推到 npm」「上 Koishi 市场」等
- 用户表达「我想把这个插件发出去」

## 前置检查

1. **当前目录必须是本项目**
   - 存在 `package.json` 且 `name === "koishi-plugin-meiriyiju"`
   - 存在 `src/index.ts` 和 `lib/index.js`

2. **git 工作区提醒**（不强制）：如果有未提交改动，提醒用户先 commit

## 发布流程

按顺序执行，每一步失败都停下来报告：

### Step 1: Lint

```bash
npm run lint
```

如果 lint 报错（exit code ≠ 0），停下来展示错误信息，让用户修复。

### Step 2: Build

```bash
npm run build
```

如果 build 失败，停下来展示 `tsc` 错误。

### Step 3: 预览包内容

```bash
npm pack --dry-run
```

把 `entryCount` 和所有文件路径列出来。然后用 `AskUserQuestion` 询问：

> 包内容如上，是否确认发布到 npm？

- 用户确认 → 继续 Step 4
- 用户取消 → 停止

### Step 4: 真正发布

```bash
npm publish
```

发布完成展示：
- 新版本号
- npm 链接：`https://www.npmjs.com/package/koishi-plugin-meiriyiju`
- Koishi 市场链接：`https://koishi.chat/market?keyword=koishi-plugin-meiriyiju`

## 本项目特别说明

- `CHANGELOG.md` 是用户自己看的，**不进包**，所以 `files` 字段不应包含它
- **不要**写 `koishi.changelog`（用户明确表示不需要）
- `files` 字段当前是 `["lib", "dist"]`，发布 4 个文件：
  - `lib/index.d.ts`（类型声明）
  - `lib/index.js`（编译产物）
  - `package.json`
  - `readme.md`
- `simulation.js` 已加进 `.eslintrc.js` 的 `ignorePatterns`
- `version` 升级按 semver：bug 修 → patch；新增功能 → minor；破坏性变更 → major

## 常见错误速查

| 错误信息 | 原因 | 解决 |
|---|---|---|
| `You cannot publish over the previously published versions: X.Y.Z` | `version` 没改 | 改 `package.json` 的 `version` 字段 |
| `npm ERR! code ENEEDAUTH` / `403 Forbidden` | 未登录 npm | 跑 `npm login` |
| 提示 OTP 验证码 | 账号开了 2FA | 读验证码输入；嫌烦可 `npm profile disable-2fa`（不推荐） |
| 发布到淘宝镜像去了 | `registry` 配错了 | `npm config set registry https://registry.npmjs.org/` |

## 撤销

| 时间窗口 | 命令 | 效果 |
|---|---|---|
| 72 小时内 | `npm unpublish koishi-plugin-meiriyiju@<version>` | 完全删除该版本 |
| 超过 72 小时 | `npm deprecate koishi-plugin-meiriyiju@<version> "原因"` | 标弃用，仍可下载但有警告 |

## 报告模板

发布完成后用以下格式报告：

```
✅ 发布成功
  包名: koishi-plugin-meiriyiju
  版本: <version>
  大小: <size>
  文件数: <entryCount>

  npm:   https://www.npmjs.com/package/koishi-plugin-meiriyiju
  Koishi: https://koishi.chat/market?keyword=koishi-plugin-meiriyiju
```
