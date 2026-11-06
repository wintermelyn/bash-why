import { expect, test } from 'claude-code/testing'

const BASH_ROW = {
  plugin: 'bash-why',
  component: 'ToolUse',
  requestId: 'toolu_1',
  props: {
    tool_use_id: 'toolu_1',
    tool: 'Bash',
    input: { command: 'git status --short', description: 'Check uncommitted changes' },
    isRunning: false,
    isErrored: false,
    isInterrupted: false,
  },
} as const

const call = (command: string, description?: string) => ({
  tool: 'Bash',
  input: description === undefined ? { command } : { command, description },
  isRunning: false,
  isErrored: false,
  isInterrupted: false,
})

const GROUP = {
  plugin: 'bash-why',
  component: 'ToolGroup',
  requestId: 'group_1',
  props: {
    calls: [
      call('git log --oneline -3', 'Show the latest commits'),
      call('ls packs/talent'),
      { tool: 'Read', input: { file_path: '/x' }, isRunning: false, isErrored: false, isInterrupted: false },
      call('wc -l AGENTS.md', 'Count the lines in AGENTS.md'),
    ],
    isActive: false,
    isExpanded: false,
  },
} as const

const runCommand = (args: string) => ({
  command: 'bash-why',
  args,
  origin: { kind: 'composer' },
  presentation: { isFullscreen: false, columns: 120 },
}) as const

const SURFACES = ['terminal', 'desktop', 'vscode', 'mobile'] as const

test('a Bash command shows its purpose under the row, on every surface', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BASH_ROW, surface })
    expect((await ui.find({ type: 'Text', text: /engine/ }))?.text).toBe('engine')
    expect((await ui.find({ type: 'Text', text: /#/ }))?.text).toBe('  # Check uncommitted changes')
    await ui.unmount()
  }
})

test('a command without description and other tools draw as the engine does', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })

  const noDescription = await $.ui.mount({
    ...BASH_ROW,
    surface: 'terminal',
    props: { ...BASH_ROW.props, input: { command: 'ls' } },
  })
  expect(await noDescription.findAll({ type: 'Text' })).toHaveLength(1)
  await noDescription.unmount()

  const read = await $.ui.mount({
    ...BASH_ROW,
    surface: 'terminal',
    props: { ...BASH_ROW.props, tool: 'Read', input: { description: 'not applicable' } },
  })
  expect(await read.findAll({ type: 'Text' })).toHaveLength(1)
  await read.unmount()
})

test('a group lists the purpose of each Bash command', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })

  const ui = await $.ui.mount({ ...GROUP, surface: 'terminal' })
  const lines = await ui.findAll({ type: 'Text', text: /#/ })
  expect(lines.map(line => line.text)).toEqual([
    '  # Show the latest commits',
    '  # Count the lines in AGENTS.md',
  ])
  await ui.unmount()
})

test('/bash-why off hides the purposes and on shows them again', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  const stored: unknown[] = []
  on('store.set', (_, e) => {
    stored.push(e.value)
    return { value: undefined }
  })

  const off = await $.command.run(runCommand('off'))
  expect(off.text).toContain('hidden')
  const hiddenRow = await $.ui.mount({ ...BASH_ROW, surface: 'terminal' })
  expect(await hiddenRow.find({ type: 'Text', text: /#/ })).toBeUndefined()
  await hiddenRow.unmount()

  expect(stored).toEqual([true])

  await $.command.run(runCommand('on'))
  expect(stored).toEqual([true, false])
  const shownRow = await $.ui.mount({ ...BASH_ROW, surface: 'terminal' })
  expect(await shownRow.find({ type: 'Text', text: /#/ })).toBeDefined()
  await shownRow.unmount()
})

test('the Bash tool description gains the description-field rule', async ($, on) => {
  on('tool.describe', () => ({ description: 'Executes a bash command.' }))

  const described = await $.tool.describe({
    tool: 'Bash',
    description: 'Executes a bash command.',
    provider: { plugin: 'engine', tier: 'core' },
  })
  expect(described.description.startsWith('Executes a bash command.')).toBe(true)
  expect(described.description).toContain('in the language the person writes in')
})

test('a new session keeps the purposes hidden when they were hidden before', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  on('store.get', () => ({ value: true }))
  on('command.register', () => ({ value: { command: 'bash-why' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ ...BASH_ROW, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /#/ })).toBeUndefined()
  await ui.unmount()
})
