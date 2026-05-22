import { Context, h, Schema } from 'koishi'

export const name = 'daily-quote'

export interface Config {
  replyQuote: boolean
}

export const Config: Schema<Config> = Schema.object({
  replyQuote: Schema.boolean().default(true).description('是否在回复时引用用户消息'),
})

export function apply(ctx: Context, config: Config) {
  ctx.command('每日一句', '获取一言每日一句')
    .action(async ({ session }) => {
      try {
        const res = await ctx.http.get<string>('https://v1.hitokoto.cn/?c=f&encode=text')
        if (!res) return '获取失败，请稍后重试'
        const quote = (config.replyQuote ? h('quote', { id: session.messageId }) : '') + res
        return quote
      } catch (error) {
        ctx.logger('soup').warn('Failed to fetch quote:', error)
        return '获取失败，请稍后重试'
      }
    })
}
