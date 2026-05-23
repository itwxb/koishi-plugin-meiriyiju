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
  /** 自定义 API 地址，默认为一言 API */
  apiUrl: string;
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
  apiUrl: Schema.string()
    .default("https://v1.hitokoto.cn")
    .description("一言 API 地址"),
  timeout: Schema.number()
    .default(5000)
    .min(1000)
    .max(30000)
    .description("请求超时时间（毫秒）"),
  keywords: Schema.string()
    .default("每日一句")
    .description("触发关键词（多个用逗号分隔）"),
});

/**
 * Hitokoto API 响应结构
 * @description 一言 API 返回的数据结构
 */
interface HitokotoResponse {
  /** 随机返回的语句 */
  hitokoto: string;
  /** 语句来源 */
  from: string;
  /** 来源作品 */
  from_who: string | null;
}

/**
 * 发送 HTTP GET 请求的封装
 * @param ctx - Koishi 上下文
 * @param url - 请求 URL
 * @param timeout - 超时时间（毫秒）
 * @returns Promise<string> 返回语句内容
 */
async function fetchHitokoto(
  ctx: Context,
  url: string,
  timeout: number,
): Promise<string> {
  const response = await ctx.http.get<HitokotoResponse>(url, {
    timeout,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response?.hitokoto) {
    throw new Error("Invalid API response: missing hitokoto field");
  }

  return response.hitokoto;
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
  const { replyQuote, apiUrl, timeout, keywords } = config;

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
    if (!matchKeyword(session.content, keywords)) {
      return next();
    }

    try {
      const hitokoto = await fetchHitokoto(ctx, apiUrl, timeout);
      const quoteElement = replyQuote
        ? h("quote", { id: session.messageId })
        : "";

      return `${quoteElement}${hitokoto}`;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      ctx.logger("meiriyiju").warn(`Failed to fetch hitokoto: ${errorMessage}`);
      return next();
    }
  });
}
