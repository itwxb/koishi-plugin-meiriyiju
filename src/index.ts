import { h, Schema } from "koishi";

import type { Context } from "koishi";

/**
 * 插件名称
 * @description 每日一句插件，用于获取并回复一言 API 的随机语句
 */
export const name = "meiriyiju";

/**
 * 插件配置接口
 * @description 定义插件的可配置选项
 */
interface ConfigOptions {
  /** 是否在回复时引用用户消息 */
  replyQuote: boolean;
  /** 请求超时时间（毫秒） */
  timeout: number;
  /** 匹配关键词，多个用逗号分隔 */
  keywords: string;
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
    .description("触发关键词（多个用逗号分隔）"),
});

/** API 地址 */
const API_URL = "https://api.xygeng.cn/one";

/**
 * 发送 HTTP GET 请求的封装
 * @param ctx - Koishi 上下文
 * @param timeout - 超时时间（毫秒）
 * @returns Promise<HitokotoData> 返回语句内容和出处
 */
interface HitokotoData {
  content: string;
  origin?: string;
}

async function fetchHitokoto(
  ctx: Context,
  timeout: number,
): Promise<HitokotoData> {
  const response = await ctx.http.get<{
    code: number;
    data: HitokotoData;
  }>(API_URL, {
    timeout,
  });

  if (response.code !== 200 || !response.data?.content) {
    throw new Error("Invalid API response");
  }

  return {
    content: response.data.content,
    origin: response.data.origin,
  };
}

/**
 * 检查是否匹配关键词
 * @param content - 用户消息内容
 * @param keywords - 关键词列表
 * @returns boolean 是否匹配
 */
function matchKeyword(content: string, keywords: string): boolean {
  const keywordList = keywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  return keywordList.some((keyword) => content.includes(keyword));
}

/**
 * 插件入口函数
 * @param ctx - Koishi 上下文实例
 * @param config - 插件配置
 * @description 注册中间件，处理每日一句请求
 */
export function apply(ctx: Context, config: ConfigOptions): void {
  const { replyQuote, timeout, keywords } = config;

  ctx.middleware(async (session, next) => {
    // 仅在群聊环境中生效
    if (!session.guildId) {
      return next();
    }

    // 仅支持 QQ 和 OneBot 平台
    if (!["qq", "onebot"].includes(session.platform)) {
      return next();
    }

    // 检查是否匹配关键词
    if (!matchKeyword(session.content || "", keywords)) {
      return next();
    }

    try {
      const { content, origin } = await fetchHitokoto(ctx, timeout);
      const quoteElement = replyQuote
        ? h("quote", { id: session.messageId })
        : "";
      const originText = origin ? `\n—— ${origin}` : "";

      return `${quoteElement}${content}${originText}`;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      ctx.logger("meiriyiju").warn(`Failed to fetch hitokoto: ${errorMessage}`);
      return next();
    }
  });
}
