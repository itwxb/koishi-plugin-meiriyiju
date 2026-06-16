"use strict";

const util = require("util");
const { name, apply } = require("./lib/index.js");

const SEPARATOR = "─".repeat(70);

// ========== Mock Koishi Context ==========
const loggers = {};
const ctx = {
  middleware: (fn) => middlewares.push(fn),
  http: {
    get: async (url) => {
      // 模拟不同 URL 返回不同结果
      if (url.includes("xygeng.cn/one")) return mockHitokoto();
      if (url.includes("poetry.palemoky.com")) return mockPoem();
      throw new Error("Unexpected URL: " + url);
    },
  },
  logger: (feature) => {
    if (!loggers[feature]) {
      loggers[feature] = {
        warn: (msg) => console.log(`  ⚠ [logger:${feature}] ${msg}`),
        info: (msg) => console.log(`  ℹ [logger:${feature}] ${msg}`),
      };
    }
    return loggers[feature];
  },
};

// ========== Mock APIs ==========
let mockHitokotoError = null;
function mockHitokoto() {
  if (mockHitokotoError) throw mockHitokotoError;
  return {
    code: 200,
    data: {
      content: "生活就像海洋，只有意志坚强的人，才能到达彼岸。",
      origin: "马克思",
    },
  };
}

let mockPoemError = null;
function mockPoem() {
  if (mockPoemError) throw mockPoemError;
  return {
    data: {
      id: 266906,
      title: "别徐永元秀才",
      content: [
        "金汤既失险，玉石乃同焚。",
        "坠叶还相覆，落羽更为群。",
        "岂谓三秋节，重伤千里分。",
        "远离弦易转，幽咽水难闻。",
        "欲识相思处，山川间白云。",
      ],
      author: { id: 8538, name: "孔绍安" },
      dynasty: { id: 6, name: "唐" },
      type: { id: 99, name: "其他" },
    },
    lang: "zh-Hans",
  };
}

// ========== Mock Session ==========
const createSession = (
  { platform = "qq", guildId = "group-001", content = "", messageId = "msg-001" } = {},
) => {
  const session = { platform, content, messageId };
  // null 表示私聊（不设 guildId 字段）
  if (guildId !== null) session.guildId = guildId;
  return session;
};

// ========== 中间件注册 ==========
const middlewares = [];

function applyWith(config) {
  middlewares.length = 0;
  apply(ctx, config);
}

async function invoke(mw, session) {
  let nextCalled = false;
  const next = async () => {
    nextCalled = true;
    return undefined;
  };
  const result = await mw(session, next);
  return { result, nextCalled };
}

function showResult(label, { result, nextCalled }) {
  console.log(`  → next() 被调用: ${nextCalled}`);
  console.log(`  → 返回内容: ${util.inspect(result, { breakLength: 80 })}`);
}

function section(title) {
  console.log(`\n${SEPARATOR}`);
  console.log(`  ${title}`);
  console.log(SEPARATOR);
}

// ========== 测试套件 ==========
async function run() {
  console.log(`\n插件: ${name}`);
  console.log(`注册中间件数: ${middlewares.length}（每日一句 + 每日古诗）\n`);

  // 默认配置
  applyWith({
    replyQuote: true,
    timeout: 5000,
    keywords: "每日一句",
    poemKeywords: "每日古诗",
    fallbackMessage: true,
  });

  // ========== 场景 1：每日一句 - 正常触发 ==========
  section("场景 1：群聊发送「每日一句」");
  showResult("trigger", await invoke(middlewares[0], createSession({ content: "每日一句" })));

  // ========== 场景 2：每日古诗 - 正常触发 ==========
  section("场景 2：群聊发送「每日古诗」");
  showResult("trigger", await invoke(middlewares[1], createSession({ content: "每日古诗" })));

  // ========== 场景 3：私聊（无 guildId）不生效 ==========
  section("场景 3：私聊发送「每日一句」（不应生效）");
  showResult("trigger", await invoke(middlewares[0], createSession({ content: "每日一句", guildId: null })));

  // ========== 场景 4：非 QQ/OneBot 平台不生效 ==========
  section("场景 4：Telegram 平台发送「每日一句」（不应生效）");
  showResult("trigger", await invoke(middlewares[0], createSession({ content: "每日一句", platform: "telegram" })));

  // ========== 场景 5：不匹配关键词 ==========
  section("场景 5：发送「你好」（不匹配关键词，不应生效）");
  showResult("trigger", await invoke(middlewares[0], createSession({ content: "你好" })));
  showResult("trigger", await invoke(middlewares[1], createSession({ content: "你好" })));

  // ========== 场景 6：自定义多关键词 ==========
  section("场景 6：自定义关键词「一言,毒鸡汤」「古诗,来首诗」");
  applyWith({
    replyQuote: false,
    timeout: 5000,
    keywords: "一言,毒鸡汤",
    poemKeywords: "古诗,来首诗",
    fallbackMessage: true,
  });
  showResult("hitokoto with '一言'", await invoke(middlewares[0], createSession({ content: "来一句一言" })));
  showResult("hitokoto with '毒鸡汤'", await invoke(middlewares[0], createSession({ content: "毒鸡汤来一碗" })));
  showResult("poem with '古诗'", await invoke(middlewares[1], createSession({ content: "古诗来一首" })));
  showResult("poem with '来首诗'", await invoke(middlewares[1], createSession({ content: "给我来首诗" })));

  // ========== 场景 7：replyQuote = false ==========
  section("场景 7：replyQuote = false（不应有 quote 元素）");
  showResult("trigger", await invoke(middlewares[0], createSession({ content: "毒鸡汤" })));

  // ========== 场景 8：API 失败 + fallbackMessage = true ==========
  section("场景 8：一言 API 失败 + fallbackMessage = true（应发降级提示）");
  mockHitokotoError = new Error("connect ETIMEDOUT");
  showResult("trigger", await invoke(middlewares[0], createSession({ content: "毒鸡汤" })));
  mockHitokotoError = null;

  // ========== 场景 9：API 失败 + fallbackMessage = false ==========
  section("场景 9：古诗 API 失败 + fallbackMessage = false（应静默）");
  applyWith({
    replyQuote: true,
    timeout: 5000,
    keywords: "一言,毒鸡汤",
    poemKeywords: "古诗,来首诗",
    fallbackMessage: false,
  });
  mockPoemError = new Error("500 Internal Server Error");
  showResult("trigger", await invoke(middlewares[1], createSession({ content: "来首诗" })));
  mockPoemError = null;

  // ========== 场景 10：API 返回异常结构（防御性校验） ==========
  section("场景 10：API 返回无效响应（应被识别为失败）");
  const originalMock = ctx.http.get;
  ctx.http.get = async (url) => {
    if (url.includes("xygeng")) return { code: 200, data: { content: "" } };
    return mockPoem();
  };
  showResult("hitokoto empty content", await invoke(middlewares[0], createSession({ content: "毒鸡汤" })));
  ctx.http.get = originalMock;

  console.log(`\n${SEPARATOR}`);
  console.log("  全部场景模拟完成");
  console.log(`${SEPARATOR}\n`);
}

run().catch((e) => {
  console.error("测试出错:", e);
  process.exit(1);
});
