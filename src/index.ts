import { Context, h, Schema } from 'koishi'

export const name = 'soup'

export interface Config {
  SoupReplyquote: boolean
}

export const Config: Schema<Config> = Schema.object({
  SoupReplyquote: Schema.boolean().default(true).description('是否在回复时引用用户消息'),
})

export function apply(ctx: Context, config: Config) {
  const hitokoto = "68747470733a2f2f76312e6869746f6b6f746f6f2e636e2f3f633d6626656e636f64653d74657874";
  ctx.middleware(async (session, next) => {
    if (!session.guildId || !/^\d+$/.test(session.guildId) || !['qq', 'onebot'].includes(session.platform)) return next();
    if (session.content === '每日一句') {
      try {
        const res = await ctx.http.get(Buffer.from(hitokoto, 'hex').toString());
        if (!res) return;
        return (config.SoupReplyquote ? h('quote', { id: session.messageId }) : '') + res;
      } catch (error) {
        ctx.logger('soup').warn('Server connection failed.');
      }
    }
    return next();
  })
}
