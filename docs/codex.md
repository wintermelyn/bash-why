# bash-why on Codex (prototype)

The same repository installs as a Codex plugin. Codex reads `.codex-plugin/plugin.json` before `.claude-plugin/plugin.json`, so each tool loads its own manifest, and Codex also reads the existing `.claude-plugin/marketplace.json`.

## Why it works differently

Codex gives a plugin less to work with than Claude Code:

- Its shell tool has no field for a command's purpose and rejects extra fields. `justification` exists, but only as the question shown when a command asks to leave the sandbox.
- A plugin cannot change the shell tool's description.
- A plugin cannot draw in the transcript. Hooks can only add a message that Codex shows as its own `↳ Hook · …` line.

So the purpose travels inside the command as a comment line, and a hook moves it out before Codex looks at the command.

## The hooks

All of them run [`codex/bash-why.mjs`](../codex/bash-why.mjs) and are declared in [`codex/hooks.json`](../codex/hooks.json).

- `SessionStart` and `SubagentStart` give the model a rule: start every shell command with a line `# why: <purpose>`, in up to 15 words, in the language the person writes in.
- `PreToolUse` on shell commands removes that first line, hands Codex the rest of the command unchanged, and shows the purpose dimmed and in italics.

Codex checks, approves and displays the command without the line. This matters because a `#` comment anywhere in a command makes Codex treat it as unknown. It would then stop approving safe commands on its own and stop folding reads into "Explored" blocks. Returning the rewritten command does not skip approval: Codex applies its sandbox and approval rules to it as usual.

Only a first line is taken. A first line that starts with `#` is always a whole-line comment, so removing it cannot change what the rest of the command does. Trailing comments and last lines are left alone, because they can sit inside a quoted string or a heredoc.

In the transcript it reads:

```
↳ Hook · Check which files are uncommitted before creating the branch
• Ran git status --short
```

## Differences from the Claude Code version

- The purpose sits above the command, not under it, and Codex adds the `↳ Hook ·` prefix.
- There is no `/bash-why` command, because Codex plugins cannot register one. Start Codex with `BASH_WHY=off` to hide the lines. The `# why:` line is still removed, so commands behave the same.
- Codex asks you to review the hooks with `/hooks` after installing and after each update. Until then none of them run: the model gets no rule, and if it writes a `# why:` line anyway, the command runs with it as a comment.
- Hooks need Node.js on `PATH` and start one Node.js process per shell command. In local tests the script took about 40 ms, before the cost of the login shell Codex runs it in.
- Windows is not covered yet. The hooks have no `commandWindows` entry.

## Cost

- About 150 tokens of context per session and per subagent.
- About 15 output tokens per shell command, for the `# why:` line.

## Install

```
codex plugin marketplace add wintermelyn/bash-why
codex plugin add bash-why@bash-why
```

Then open Codex and approve the bash-why hooks in `/hooks`.

## Development

```
node --test codex/test/*.test.mjs
```

## Prototype status

Checked:

- The hook logic and its output format, with tests that run the script the way Codex does.
- Codex 0.167.0 lists and installs the plugin from this repository, and picks up `.codex-plugin/plugin.json`.
- With the hooks not yet approved, Codex runs a command that starts with a `# why:` line and gets the right output.

Inferred from the Codex source and not yet seen in a real session:

- That an approved `PreToolUse` hook strips the line before Codex shows and approves the command.
- How the `↳ Hook ·` line renders, and whether it splits "Explored" blocks: the source suggests each hook message closes the block in progress.
- That `BASH_WHY` reaches the hooks through the session environment.

Open:

- How reliably Codex models write the `# why:` line.
- Windows support.
