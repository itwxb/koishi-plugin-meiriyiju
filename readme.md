# 每日一句 / 每日古诗

> npm 包名：`koishi-plugin-meiriyiju`
>
> 群内发送「每日一句」或「每日古诗」即可随机获取一句话或一首古诗。梦想之都出品。

## 特性

- 📜 **每日一句**：调用 [xygeng 一言 API](https://api.xygeng.cn/one) 随机返回一句话
- 📖 **每日古诗**：调用 [palemoky 古诗词 API](https://poetry.palemoky.com) 随机返回一首古诗
- 🔑 关键词可自定义，多个用逗号分隔
- 💬 可选引用用户消息
- 🛟 API 失败时支持发送降级提示
- 🛡 仅在 QQ / OneBot 平台的群聊环境生效

## 快速开始

在 Koishi 配置文件中启用：

```yaml
plugins:
  meiriyiju:
    replyQuote: true         # 是否引用用户消息
    timeout: 5000            # 请求超时时间（毫秒）
    keywords: 每日一句        # 触发每日一句的关键词
    poemKeywords: 每日古诗    # 触发每日古诗的关键词
    fallbackMessage: true    # API 失败时是否发送降级提示
```

## 指令

| 关键词 | 说明 |
|--------|------|
| 每日一句 | 随机获取一句话 |
| 每日古诗 | 随机获取一首古诗 |
| 自定义关键词 | 两个指令的关键词均可自定义，多个用逗号分隔 |

## 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `replyQuote` | boolean | `true` | 回复时是否引用用户消息 |
| `timeout` | number | `5000` | 请求超时时间（毫秒），范围 `1000 ~ 30000` |
| `keywords` | string | `每日一句` | 触发每日一句的关键词（多个用逗号分隔） |
| `poemKeywords` | string | `每日古诗` | 触发每日古诗的关键词（多个用逗号分隔） |
| `fallbackMessage` | boolean | `true` | API 失败时是否向用户发送降级提示 |

## 效果示例

### 每日一句

```
> 每日一句
生活就像海洋，只有意志坚强的人，才能到达彼岸。
—— 马克思
```

### 每日古诗

```
> 每日古诗
《别徐永元秀才》—— 唐·孔绍安
金汤既失险，玉石乃同焚。
坠叶还相覆，落羽更为群。
岂谓三秋节，重伤千里分。
远离弦易转，幽咽水难闻。
欲识相思处，山川间白云。
```

## 发布

### 准备工作

1. 注册 [npm](https://www.npmjs.com/) 账号
2. 首次发布前登录：`npm login`
3. 确保 `package.json` 中 `version` 已按 [语义化版本](https://semver.org/lang/zh-CN/) 更新

### 版本号规则

- 修复 bug → 升级 patch（`1.0.7` → `1.0.8`）
- 新增向后兼容功能 → 升级 minor（`1.0.7` → `1.1.0`）
- 破坏性变更 → 升级 major（`1.0.7` → `2.0.0`）

### 发布步骤

```bash
# 1. 安装依赖（如未安装）
npm install

# 2. 跑 lint + build 确认无问题
npm run lint
npm run build

# 3. 预览要上传的文件（建议过一眼，避免漏文件或多带文件）
npm pack --dry-run

# 4. 发布到 npm
npm publish
```

> 📝 `package.json` 中 `files: ["lib", "dist"]` 限定了发布内容，所以 `src/` 里的 TS 源码不会进包，必须先 `build` 生成 `lib/`。
>
> ⚠️ 发版后请同步更新 [CHANGELOG.md](./CHANGELOG.md)。

### 踩坑提醒

#### 1. 版本号必须递增

npm 禁止重复发布同一版本。如果忘了改 `version`，会报：

```
npm ERR! 403 Forbidden - You cannot publish over the previously published versions: 1.0.7.
```

#### 2. 2FA 验证码

如果 npm 账号开启了二次验证（2FA），`npm publish` 时会要求输入一次性验证码（Google Authenticator / 邮箱）。嫌烦可以临时关（不推荐）：

```bash
npm profile disable-2fa
```

或用 legacy 登录跳过：

```bash
npm login --auth-type=legacy
```

#### 3. 镜像源

如果之前配过淘宝镜像，`publish` 会发到国内镜像去：

```bash
# 切回官方源再发布
npm config set registry https://registry.npmjs.org/
npm publish
```

#### 4. 撤销发布

| 时间窗口 | 命令 | 效果 |
|---|---|---|
| 72 小时内 | `npm unpublish koishi-plugin-meiriyiju@1.1.0` | 完全删除该版本 |
| 超过 72 小时 | `npm deprecate koishi-plugin-meiriyiju@1.1.0 "原因"` | 标弃用，仍可下载但会有警告 |

## 开发

### 环境要求

- Node.js >= 18
- npm >= 9

### 本地开发

```bash
# 克隆项目
git clone https://github.com/itwxb/koishi-plugin-meiriyiju.git
cd koishi-plugin-meiriyiju

# 安装依赖
npm install

# 构建
npm run build
```

### 代码规范

```bash
# 类型检查 + Lint
npm run lint

# 自动修复
npm run lint:fix

# 格式化代码
npm run format
```

### 项目结构

```
koishi-plugin-meiriyiju/
├── src/
│   └── index.ts          # 插件源码
├── lib/                  # 构建产物（git 忽略，发布前生成）
│   ├── index.js
│   └── index.d.ts
├── CHANGELOG.md          # 更新日志
├── package.json
├── tsconfig.json
└── README.md
```

## API 来源

- 一言：[https://api.xygeng.cn/one](https://api.xygeng.cn/one)
- 古诗词：[https://poetry.palemoky.com](https://poetry.palemoky.com)

## 许可证

MIT
