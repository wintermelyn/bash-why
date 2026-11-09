# How bash-why works

On both platforms bash-why does two things: it asks the model to write each shell command's purpose in the current task, in up to 15 words and in the language you write in, and it shows that purpose in the transcript. Each platform gives plugins different tools for that, so the two versions share the rule and differ in how they carry and show it.

| | Claude Code | Codex |
|---|---|---|
| Where the purpose comes from | The Bash tool's `description` field | A `# why:` first line in the command, removed before it runs |
| Where it shows | Under the command | Above the command, after `↳ Hook ·` |
| Hide the lines | `/bash-why off`, kept across sessions | Start Codex with `BASH_WHY=off` |
| Code | [`hooks/register.tsx`](../hooks/register.tsx) | [`codex/bash-why.mjs`](../codex/bash-why.mjs), [`codex/hooks.json`](../codex/hooks.json) |

One repository serves both. Claude Code reads `.claude-plugin/plugin.json`. Codex reads `.codex-plugin/plugin.json` first, so it never loads the Claude Code hooks, and it also reads the shared `.claude-plugin/marketplace.json`.

## Claude Code

### The two hooks

Both live in [`hooks/register.tsx`](../hooks/register.tsx).

- `tool.describe` appends a short rule to the Bash tool's description: write `description` as the command's purpose in the current task, in up to 15 words, in the language the person writes in.
- `ui.render` on `ToolUse` and `ToolGroup` keeps Claude Code's own row and adds a dimmed `# description` line under it. Commands without a description, and every other tool, are left as they are.

`/bash-why off` only hides the lines. The rule stays, so descriptions are written the same way. The setting is kept across sessions.

### Cost

- **About 150 tokens** added to the Bash tool description. It sits in the prompt cache, so it is billed at the cached rate.
- **About 15 output tokens** more per Bash call, since descriptions grow from about 5 words to about 15.
- **Nothing for the lines themselves.** They are drawn locally and the model never sees them.

## Codex

### Why it works differently

Codex gives a plugin less to work with:

- Its shell tool has no field for a command's purpose and rejects extra fields. `justification` exists, but only as the question shown when a command asks to leave the sandbox.
- A plugin cannot change the shell tool's description.
- A plugin cannot draw in the transcript. A hook can only return a message, which Codex shows on its own `↳ Hook ·` line.

So the purpose travels inside the command as a comment line, and a hook moves it out before Codex looks at the command.

### The hooks

All of them run [`codex/bash-why.mjs`](../codex/bash-why.mjs) and are declared in [`codex/hooks.json`](../codex/hooks.json).

- `SessionStart` and `SubagentStart` give the main agent and each subagent the rule: start every shell command with a line `# why: <purpose>`.
- `PreToolUse` on shell commands removes that first line, hands Codex the rest of the command unchanged, and returns the purpose, dimmed and in italics, as the hook's message.

Codex checks, approves and shows the command without the line. This matters because a `#` comment anywhere in a command makes Codex treat it as unknown: it would stop approving safe commands on its own and stop summarizing reads as "Read" or "List". Returning the rewritten command does not skip approval, since Codex applies its sandbox and approval rules to it as usual.

Only a first line is taken. A first line that starts with `#` is always a whole-line comment, so removing it cannot change what the rest of the command does. Trailing comments and last lines are left alone, because they can sit inside a quoted string or a heredoc.

### What you see

```
↳ Hook · Leer el README para entender el proyecto
• Explored
  └ Read README.md
↳ Hook · Listar los archivos del proyecto
• Explored
  └ List ls
```

Each hook line closes the "Explored" block in progress, so consecutive reads that Codex would fold into one block get a block each, under their own purpose. With `BASH_WHY=off` the hook returns no message and the reads fold together again.

### Limits

- There is no `/bash-why` command, because Codex plugins cannot register one. `BASH_WHY=off` applies to the Codex session it was started with.
- Codex asks you to approve the hooks in `/hooks` after installing and after each update that changes them. Until then none of them run: the model gets no rule, and a `# why:` line it writes anyway stays in the command as a comment.
- The hooks need Node.js on `PATH` and start one Node.js process per shell command. The script itself took about 40 ms in local tests.
- Windows is not supported yet: the hooks have no `commandWindows` entry.

### Cost

- **About 150 tokens** of context per session and per subagent.
- **About 15 output tokens** per shell command, for the `# why:` line.

## Development

```
claude plugin validate .
claude plugin test .
node --test codex/test/*.test.mjs
```

The Codex tests run [`codex/bash-why.mjs`](../codex/bash-why.mjs) as a process with the JSON Codex sends on stdin.

To record the README image again, install [VHS](https://github.com/charmbracelet/vhs) and [ImageMagick](https://imagemagick.org) (`brew install vhs imagemagick`) and run `demo/render.sh`. It builds a small project in `~/bash-why-demo`, records one Claude Code session there with the installed mod, captures it with the lines shown and hidden, and frames both into `assets/before-after.png`. If the layout of Claude Code changes, adjust the crop regions at the top of `demo/compose.sh`.

## Related

[description-hook](https://github.com/david-zvi/description-hook) makes Claude describe every command and shows that description in the permission prompt, before you approve it. bash-why is about reading the transcript afterwards. The two work well together.
