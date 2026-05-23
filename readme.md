# 每日一句-插件

npm 包名：`koishi-plugin-meiriyiju`

一言，每日一句话的力量。


```yaml
plugins:
  meiriyiju:
    replyQuote: true      # 是否引用用户消息
    apiUrl: https://v1.hitokoto.cn  # API 地址
    timeout: 5000         # 超时时间（毫秒）
    keywords: 每日一句    # 触发关键词
```

### 指令

| 指令 | 说明 |
|------|------|
| 每日一句 | 获取一言每日一句 |
| 自定义关键词 | 可配置多个触发词（多个用逗号分隔） |

### 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| replyQuote | boolean | true | 回复时是否引用用户消息 |
| apiUrl | string | https://v1.hitokoto.cn | 一言 API 地址 |
| timeout | number | 5000 | 请求超时时间（毫秒） |
| keywords | string | 每日一句 | 触发关键词（多个用逗号分隔） |

## 发布

```bash
# 修改版本号
package.json 中的 version 字段

```json
{
  "version": "1.0.0"
}
# 发布到 npm
npm publish
```


```

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
# 类型检查
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
│   └── index.ts      # 插件源码
├── lib/
│   ├── index.js      # 构建输出
│   └── index.d.ts    # 类型声明
├── package.json
├── tsconfig.json
└── README.md
```

## API

一言 API：`https://v1.hitokoto.cn`

## 许可证

MIT
