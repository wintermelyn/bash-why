// Codex hooks for bash-why.
//
// Codex's shell tool has no field for a command's purpose, and plugins cannot draw
// in its transcript. So the model starts each command with a `# why:` comment line,
// the PreToolUse hook removes that line before Codex checks, approves and shows the
// command, and the purpose is shown as the hook's message.
//
// The line is taken only from the start of the command: a first line that starts
// with `#` is always a whole-line comment, so removing it cannot change what the
// rest of the command does.

import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export const RULE = [
  '# Purpose line for shell commands',
  '',
  'Start every shell command with one comment line that says why it runs:',
  '',
  '# why: <purpose>',
  '',
  'Write the purpose in the current task as one sentence of up to 15 words, in the language the person writes in, with its standard spelling (accents included).',
  'Put nothing else on that line and write the command on the lines below it.',
  'The line is removed before the command runs and the purpose is shown to the person next to the command.',
  '',
  'Example:',
  '',
  '# why: Check which files are uncommitted before creating the branch',
  'git status --short',
].join('\n')

const WHY_LINE = /^[ \t]*#[ \t]*why:[ \t]*(.*?)[ \t]*\r?$/
// The purpose ends up in a terminal line, so control characters (escape codes included) are dropped.
const CONTROL = /[\u0000-\u001f\u007f-\u009f]/g
const DIM_ITALIC = text => `\u001b[2;3m${text}\u001b[22;23m`

export const splitPurpose = command => {
  if (typeof command !== 'string') return undefined
  const newline = command.indexOf('\n')
  if (newline === -1) return undefined

  const match = WHY_LINE.exec(command.slice(0, newline))
  if (match === null) return undefined

  const rest = command.slice(newline + 1)
  if (rest.trim() === '') return undefined

  const purpose = match[1].replace(CONTROL, '').trim()
  return { command: rest, purpose: purpose === '' ? undefined : purpose }
}

export const isHidden = env => (env.BASH_WHY ?? '').trim().toLowerCase() === 'off'

export const contextOutput = input => ({
  hookSpecificOutput: {
    hookEventName: input?.hook_event_name === 'SubagentStart' ? 'SubagentStart' : 'SessionStart',
    additionalContext: RULE,
  },
})

// Returns undefined when the command is left as the model wrote it.
export const preToolUseOutput = (input, env) => {
  if (input?.tool_name !== 'Bash') return undefined
  const split = splitPurpose(input.tool_input?.command)
  if (split === undefined) return undefined

  const output = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      // `allow` is how Codex accepts `updatedInput`; Codex still applies its sandbox
      // and approval rules to the rewritten command.
      permissionDecision: 'allow',
      updatedInput: { command: split.command },
    },
  }
  if (split.purpose !== undefined && !isHidden(env)) output.systemMessage = DIM_ITALIC(split.purpose)
  return output
}

const HANDLERS = { context: contextOutput, 'pre-tool-use': preToolUseOutput }

const main = () => {
  const handler = HANDLERS[process.argv[2]]
  if (handler === undefined) return

  let input
  try {
    input = JSON.parse(readFileSync(0, 'utf8'))
  } catch {
    // Never get in the way of a command because of a bad payload.
    return
  }
  const output = handler(input, process.env)
  if (output !== undefined) process.stdout.write(JSON.stringify(output))
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main()
