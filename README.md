<div align="center">

# bash-why

**See why every shell command ran, long after it scrolled by.**

A small plugin for [Claude Code](https://claude.com/claude-code) and [Codex](https://github.com/openai/codex) that writes the purpose of each shell command next to it in the transcript.

![License: MIT](https://img.shields.io/badge/license-MIT-89b4fa)
![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-d97757)
![Codex plugin](https://img.shields.io/badge/Codex-plugin-74aa9c)

<img src="assets/before-after.png" alt="The same Claude Code session twice: without bash-why each command is a bare line; with it, a dimmed line under each command says why it ran" width="820">

</div>

## Install

### Claude Code

```
/plugin install bash-why --marketplace wintermelyn/bash-why
```

Run it at the Claude Code prompt, answer `y`, and pick the user scope so it loads in every project.

### Codex

```
codex plugin marketplace add wintermelyn/bash-why
codex plugin add bash-why@bash-why
```

Then open Codex, run `/hooks` and approve the three bash-why hooks. Codex runs no plugin hook until you approve it. The hooks need Node.js.

## Use

It works on its own, and purposes follow the language you write in.

In Claude Code the purpose sits under each command, as in the image above, and folded groups like "Ran 3 shell commands" get one line per command. `/bash-why off` hides the lines and `/bash-why on` brings them back.

In Codex the purpose sits above each command, on a line Codex marks as coming from a hook:

```
↳ Hook · Check which files are uncommitted before creating the branch
• Ran git status --short
```

Start Codex with `BASH_WHY=off` to hide the lines.

---

[How it works, cost and development](docs/how-it-works.md) · [MIT License](LICENSE)
