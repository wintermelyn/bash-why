import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

import { RULE, contextOutput, preToolUseOutput, splitPurpose } from '../bash-why.mjs'

const SCRIPT = fileURLToPath(new URL('../bash-why.mjs', import.meta.url))
const DIM = text => `\u001b[2;3m${text}\u001b[22;23m`

const bash = command => ({
  session_id: 's1',
  transcript_path: null,
  cwd: '/repo',
  hook_event_name: 'PreToolUse',
  model: 'gpt-5.5-codex',
  permission_mode: 'default',
  turn_id: 't1',
  tool_name: 'Bash',
  tool_use_id: 'call_1',
  tool_input: { command },
})

const run = (mode, input, env = {}) =>
  spawnSync(process.execPath, [SCRIPT, mode], {
    input: typeof input === 'string' ? input : JSON.stringify(input),
    encoding: 'utf8',
    env: { PATH: process.env.PATH, ...env },
  })

test('the first # why: line is removed and shown dimmed', () => {
  const output = preToolUseOutput(bash('# why: Revisar qué archivos faltan por commitear\ngit status --short'), {})

  assert.deepEqual(output, {
    systemMessage: DIM('Revisar qué archivos faltan por commitear'),
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
      updatedInput: { command: 'git status --short' },
    },
  })
})

test('the rest of the command is kept byte for byte', () => {
  const rest = "cat <<'EOF' > notes.txt\n  # why: not the purpose, part of the file\nEOF\r\nwc -l notes.txt\n"

  assert.equal(splitPurpose(`# why: Write the notes file\r\n${rest}`).command, rest)
})

test('spacing variants of the marker are accepted', () => {
  for (const line of ['#why: x', '  # why:   x  ', '\t#  why:x']) {
    assert.deepEqual(splitPurpose(`${line}\nls`), { command: 'ls', purpose: 'x' })
  }
})

test('commands without a leading # why: line are left alone', () => {
  const commands = [
    'git status --short',
    'git status --short # why: trailing comments are not taken',
    'ls\n# why: a last line is not taken',
    '# list files\nls',
    '#!/bin/sh\nls',
    '# why: nothing to run',
    '# why: only blank lines\n  \n',
  ]

  for (const command of commands) assert.equal(preToolUseOutput(bash(command), {}), undefined, command)
})

test('an empty purpose still removes the line but shows nothing', () => {
  const output = preToolUseOutput(bash('# why:\nls'), {})

  assert.equal(output.systemMessage, undefined)
  assert.deepEqual(output.hookSpecificOutput.updatedInput, { command: 'ls' })
})

test('escape codes written by the model are dropped from the purpose', () => {
  assert.equal(splitPurpose('# why: \u001b[31mred\u001b[0m text\nls').purpose, '[31mred[0m text')
})

test('BASH_WHY=off hides the purpose but still removes the line', () => {
  const output = preToolUseOutput(bash('# why: List files\nls'), { BASH_WHY: 'OFF' })

  assert.equal(output.systemMessage, undefined)
  assert.deepEqual(output.hookSpecificOutput.updatedInput, { command: 'ls' })
})

test('other tools are ignored', () => {
  const input = { ...bash('# why: x\nls'), tool_name: 'apply_patch' }

  assert.equal(preToolUseOutput(input, {}), undefined)
})

test('session and subagent starts give the model the rule', () => {
  assert.deepEqual(contextOutput({ hook_event_name: 'SessionStart', source: 'startup' }), {
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: RULE },
  })
  assert.equal(contextOutput({ hook_event_name: 'SubagentStart' }).hookSpecificOutput.hookEventName, 'SubagentStart')
})

test('as a process, the hook prints Codex JSON and exits 0', () => {
  const result = run('pre-tool-use', bash('# why: Contar líneas\nwc -l README.md'))

  assert.equal(result.status, 0)
  assert.equal(result.stderr, '')
  assert.deepEqual(JSON.parse(result.stdout).hookSpecificOutput.updatedInput, { command: 'wc -l README.md' })
  assert.equal(JSON.parse(result.stdout).systemMessage, DIM('Contar líneas'))
})

test('as a process, nothing is printed when there is nothing to change', () => {
  for (const [mode, input] of [
    ['pre-tool-use', bash('ls')],
    ['pre-tool-use', 'not json'],
    ['unknown-mode', bash('# why: x\nls')],
  ]) {
    const result = run(mode, input)
    assert.equal(result.status, 0)
    assert.equal(result.stdout, '')
  }
})
