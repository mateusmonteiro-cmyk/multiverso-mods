import type { EngineInterface, Register, RenderElement } from 'claude-code'

const avisados = new Set<string>()

async function linhaDeUso($: EngineInterface): Promise<string> {
  const { rateLimits } = await $.session.usage()
  const sessao = rateLimits.find(r => r.kind === 'five_hour')
  if (!sessao) return 'Sessão atual - aguardando...'

  for (const limite of [80, 95]) {
    const chave = `${limite}:${sessao.resetsAt ?? ''}`
    if (sessao.percentUsed >= limite && !avisados.has(chave)) {
      avisados.add(chave)
      $.ui.toast(`Atenção: ${Math.round(sessao.percentUsed)}% da sessão atual já foi usado`)
    }
  }
  return `Sessão atual - ${Math.round(sessao.percentUsed)}% usados`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const r = await next(e)
    $.ui.status(await linhaDeUso($))
    return r
  })

  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    $.ui.status(await linhaDeUso($))
    $.ui.invalidate('ui.render')
    return r
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const linha = await linhaDeUso($)
    return h(Box, null, h(Text, { dimColor: true }, linha)) as RenderElement
  })
}
