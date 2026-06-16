# 更新日志

## [1.1.0]

### 新增

- **每日古诗**：新增 `poemKeywords` 配置项（默认 `每日古诗`），触发后从 [palemoky 古诗词 API](https://poetry.palemoky.com) 随机获取一首古诗并回复，格式为 `《标题》—— 朝代·作者 + 正文`。
- **降级提示**：新增 `fallbackMessage` 配置项（默认开启），API 失败时向用户发送降级提示。

### 重构

- 抽离 `createCommandMiddleware` 工厂函数，统一「每日一句」和「每日古诗」的中间件逻辑。
- 将 `["qq", "onebot"]` 平台白名单提为 `SUPPORTED_PLATFORMS` 常量。
- 拆分别名命名空间：日志 `meiriyiju` 改为 `hitokoto` / `poem`。
- 收紧 `fetchPoem` 的响应校验，与 `fetchHitokoto` 保持一致。

## [1.0.7]

- 初始发布：每日一句功能，调用 [xygeng 一言 API](https://api.xygeng.cn/one)。
