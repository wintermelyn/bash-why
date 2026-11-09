<div align="center">

# bash-why

**See why every shell command ran, long after it scrolled by.**

A small [Claude Code](https://claude.com/claude-code) plugin that writes the purpose of each Bash command right under it in the transcript.

![License: MIT](https://img.shields.io/badge/license-MIT-89b4fa)
![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-d97757)

<img src="assets/before-after.png" alt="The same Claude Code session twice: without bash-why each command is a bare line; with it, a dimmed line under each command says why it ran" width="820">

</div>

## Install

```
/plugin install bash-why --marketplace wintermelyn/bash-why
```

Run it at the Claude Code prompt, answer `y`, and pick the user scope so it loads in every project.

## Use

It works on its own. `/bash-why off` hides the lines and `/bash-why on` brings them back.

Descriptions follow the language you write in, and folded groups like "Ran 3 shell commands" get one line per command.

## Codex (prototype)

```
codex plugin marketplace add wintermelyn/bash-why
codex plugin add bash-why@bash-why
```

Then approve its hooks in `/hooks`. The purpose shows above each command as a hook line, and `BASH_WHY=off` hides it. [How it differs](docs/codex.md).

---

[How it works, cost and development](docs/how-it-works.md) · [Codex prototype](docs/codex.md) · [MIT License](LICENSE)
