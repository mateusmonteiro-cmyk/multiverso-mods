import type { EngineInterface, Register } from 'claude-code'

const NOMES: Record<string, string> = {
  five_hour: 'da sessão atual',
  seven_day: 'Semana',
  spend_limit: 'Limite',
}

const avisados = new Set<string>()

function nome(kind: string): string {
  return NOMES[kind] ?? kind
}

async function atualizar($: EngineInterface): Promise<void> {
  const { rateLimits: todos } = await $.session.usage()
  const rateLimits = todos.filter(r => r.kind === 'five_hour')
  if (rateLimits.length === 0) {
    $.ui.status('Sessão atual - aguardando...')
    return
  }
  $.ui.status(`Sessão atual - ${Math.round(rateLimits[0].percentUsed)}% usados`)

  for (const r of rateLimits) {
    for (const limite of [80, 95]) {
      const chave = `${r.kind}:${limite}:${r.resetsAt ?? ''}`
      if (r.percentUsed >= limite && !avisados.has(chave)) {
        avisados.add(chave)
        $.ui.toast(`Atenção: ${r.percentUsed}% do limite ${nome(r.kind)} já foi usado`)
      }
    }
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const r = await next(e)
    await atualizar($)
    return r
  })

  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    await atualizar($)
    return r
  })
}
