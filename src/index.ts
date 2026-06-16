import { h, Schema } from "koishi";

import type { Context, Fragment, Next, Session } from "koishi";

/**
 * 插件名称
 * @description 每日一句 / 每日古诗插件
 */
export const name = "meiriyiju";

/** 支持的平台白名单 */
const SUPPORTED_PLATFORMS = ["qq", "onebot"];

/**
 * 插件配置接口
 * @description 定义插件的可配置选项
 */
interface ConfigOptions {
  /** 是否在回复时引用用户消息 */
  replyQuote: boolean;
  /** 请求超时时间（毫秒） */
  timeout: number;
  /** 每日一句匹配关键词（多个用逗号分隔） */
  keywords: string;
  /** 每日古诗匹配关键词（多个用逗号分隔） */
  poemKeywords: string;
  /** API 失败时是否向用户发送降级提示 */
  fallbackMessage: boolean;
}

/**
 * 插件配置 Schema
 * @description 用于在管理界面生成配置表单
 */
export const Config: Schema<ConfigOptions> = Schema.object({
  replyQuote: Schema.boolean()
    .default(true)
    .description("是否在回复时引用用户消息"),
  timeout: Schema.number()
    .default(5000)
    .min(1000)
    .max(30000)
    .description("请求超时时间（毫秒）"),
  keywords: Schema.string()
    .default("每日一句")
    .description("触发每日一句的关键词（多个用逗号分隔）"),
  poemKeywords: Schema.string()
    .default("每日古诗")
    .description("触发每日古诗的关键词（多个用逗号分隔）"),
  fallbackMessage: Schema.boolean()
    .default(true)
    .description("API 失败时是否向用户发送降级提示"),
});

/** 每日一句 API 地址 */
const HITOKOTO_API_URL = "https://api.xygeng.cn/one";

/** 古诗词 API 地址 */
const POEM_API_URL =
  "https://poetry.palemoky.com/api/poems/random?lang=zh-Hans";

/** 每日一句数据结构 */
interface HitokotoData {
  content: string;
  origin?: string;
}

/** 每日一句原始响应 */
interface HitokotoResponse {
  code: number;
  data: HitokotoData;
}

/** 古诗词数据结构 */
interface PoemData {
  id: number;
  title: string;
  content: string[];
  author: { id: number; name: string };
  dynasty: { id: number; name: string };
  type: { id: number; name: string };
}

/** 古诗词原始响应 */
interface PoemResponse {
  code?: number;
  data: PoemData;
  lang?: string;
}

/**
 * 获取每日一句
 * @param ctx - Koishi 上下文
 * @param timeout - 超时时间（毫秒）
 */
async function fetchHitokoto(
  ctx: Context,
  timeout: number,
): Promise<HitokotoData> {
  const response = await ctx.http.get<HitokotoResponse>(HITOKOTO_API_URL, {
    timeout,
  });

  if (response.code !== 200 || !response.data?.content) {
    throw new Error("Invalid hitokoto response");
  }

  return {
    content: response.data.content,
    origin: response.data.origin,
  };
}

/**
 * 获取随机古诗
 * @param ctx - Koishi 上下文
 * @param timeout - 超时时间（毫秒）
 */
async function fetchPoem(ctx: Context, timeout: number): Promise<PoemData> {
  const response = await ctx.http.get<PoemResponse>(POEM_API_URL, {
    timeout,
    headers: { accept: "application/json" },
  });

  if (response?.code !== undefined && response.code !== 200) {
    throw new Error("Poem API returned non-200 code");
  }
  if (!response?.data?.content?.length) {
    throw new Error("Invalid poem response");
  }

  return response.data;
}

/**
 * 将古诗格式化为可发送的文本
 * @param poem - 古诗数据
 */
function formatPoem(poem: PoemData): string {
  const body = poem.content.join("\n");
  return `《${poem.title}》—— ${poem.dynasty.name}·${poem.author.name}\n${body}`;
}

/**
 * 检查消息内容是否匹配关键词列表
 * @param content - 用户消息内容
 * @param keywords - 关键词配置（多个用逗号分隔）
 */
function matchKeyword(content: string, keywords: string): boolean {
  return keywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
    .some((keyword) => content.includes(keyword));
}

/**
 * 命令描述符：把一个数据获取 + 格式化流程抽象成中间件
 */
interface CommandDescriptor<T> {
  /** 关键词配置（多个用逗号分隔） */
  keywords: string;
  /** 日志命名空间 */
  feature: string;
  /** API 失败时的降级提示 */
  fallback: string;
  /** 数据获取 */
  fetch: (ctx: Context, timeout: number) => Promise<T>;
  /** 数据格式化 */
  format: (data: T) => string;
}

/**
 * 创建 Koishi 中间件：复用平台 / 群聊 / 关键词 / 引用 / 错误处理等公共逻辑
 */
function createCommandMiddleware<T>(
  ctx: Context,
  config: ConfigOptions,
  descriptor: CommandDescriptor<T>,
) {
  return async (session: Session, next: Next): Promise<void | Fragment> => {
    // 仅在群聊环境生效
    if (!session.guildId) return next();
    // 仅在白名单平台生效
    if (!SUPPORTED_PLATFORMS.includes(session.platform)) return next();
    // 必须命中关键词
    if (!matchKeyword(session.content || "", descriptor.keywords)) {
      return next();
    }

    const quote = config.replyQuote
      ? h("quote", { id: session.messageId })
      : "";

    try {
      const data = await descriptor.fetch(ctx, config.timeout);
      return `${quote}${descriptor.format(data)}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.logger(descriptor.feature).warn(`Fetch failed: ${message}`);
      if (config.fallbackMessage) {
        return `${quote}${descriptor.fallback}`;
      }
      return next();
    }
  };
}

/**
 * 插件入口函数
 * @param ctx - Koishi 上下文实例
 * @param config - 插件配置
 */
export function apply(ctx: Context, config: ConfigOptions): void {
  // 每日一句
  ctx.middleware(
    createCommandMiddleware<HitokotoData>(ctx, config, {
      keywords: config.keywords,
      feature: "hitokoto",
      fallback: "今日一言暂不可用，请稍后再试 ~",
      fetch: fetchHitokoto,
      format: (data) => {
        const origin = data.origin ? `\n—— ${data.origin}` : "";
        return `${data.content}${origin}`;
      },
    }),
  );

  // 每日古诗
  ctx.middleware(
    createCommandMiddleware<PoemData>(ctx, config, {
      keywords: config.poemKeywords,
      feature: "poem",
      fallback: "今日古诗暂不可用，请稍后再试 ~",
      fetch: fetchPoem,
      format: formatPoem,
    }),
  );
}
