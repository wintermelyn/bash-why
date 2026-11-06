import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { IsHidden } from '../types'

const COMMAND = 'bash-why'
const STORE_KEY = 'isHidden'

const isHidden = atom({ plugin: 'bash-why', key: 'isHidden' } as const, false as IsHidden)

const DESCRIPTION_RULE = [
  '',
  '# The `description` field',
  '',
  'The person reads `description` under the command when rereading the transcript, as its explanation.',
  'Write the command\'s purpose in the current task as one sentence of up to 15 words, in the language the person writes in, with its standard spelling (accents included).',
  'This overrides the parameter\'s own length guidance.',
  '',
  'Example for `git status --short`: "Check which files are uncommitted before creating the branch".',
].join('\n')

const field = (input: unknown, name: 'description'): string | undefined => {
  if (typeof input !== 'object' || input === null) return undefined
  const value = (input as Record<string, unknown>)[name]
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const stored = (await $.store.get(STORE_KEY)) === true
    await update($, isHidden, () => stored)
    await $.command.register({
      name: COMMAND,
      description: 'Show or hide the purpose line under each Bash command',
      argumentHint: '[on|off]',
    })

    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    const current = await read($, isHidden)
    const hidden = arg === 'off' ? true : arg === 'on' ? false : !current
    await update($, isHidden, () => hidden)
    await $.store.set(STORE_KEY, hidden)

    return {
      text: hidden
        ? 'Command purposes hidden. /bash-why on shows them again.'
        : 'Command purposes shown.',
    }
  }).catch(() => ({ text: 'bash-why: could not change visibility.' }))

  on('tool.describe', { tool: 'Bash' }, async ($, e, next) => {
    const described = await next(e)

    return { ...described, description: `${described.description}\n${DESCRIPTION_RULE}` }
  })

  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    const description = e.props.tool === 'Bash' ? field(e.props.input, 'description') : undefined
    if (description === undefined || (await read($, isHidden))) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const row = await next(e)

    return (
      <Box flexDirection="column">
        {row}
        <Text dimColor italic>{`  # ${description}`}</Text>
      </Box>
    )
  })

  on('ui.render', { component: 'ToolGroup' }, async ($, e, next) => {
    if (e.props.isExpanded) return next(e)

    const descriptions = e.props.calls
      .filter(call => call.tool === 'Bash')
      .map(call => field(call.input, 'description'))
      .filter((description): description is string => description !== undefined)
    if (descriptions.length === 0 || (await read($, isHidden))) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const row = await next(e)

    return (
      <Box flexDirection="column">
        {row}
        {descriptions.map(description => (
          <Text dimColor italic>{`  # ${description}`}</Text>
        ))}
      </Box>
    )
  })
}
