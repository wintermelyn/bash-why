# How bash-why works

## The two hooks

Both live in [`hooks/register.tsx`](../hooks/register.tsx).

- `tool.describe` appends a short rule to the Bash tool's description: write `description` as the command's purpose in the current task, in up to 15 words, in the language the person writes in.
- `ui.render` on `ToolUse` and `ToolGroup` keeps Claude Code's own row and adds a dimmed `# description` line under it. Commands without a description, and every other tool, are left as they are.

`/bash-why off` only hides the lines. The rule stays, so descriptions are written the same way. The setting is kept across sessions.

## Cost

- **About 150 tokens** added to the Bash tool description. It sits in the prompt cache, so it is billed at the cached rate.
- **About 15 output tokens** more per Bash call, since descriptions grow from about 5 words to about 15.
- **Nothing for the lines themselves.** They are drawn locally and the model never sees them.

## Development

```
claude plugin validate .
claude plugin test .
```

To record the README image again, install [VHS](https://github.com/charmbracelet/vhs) and [ImageMagick](https://imagemagick.org) (`brew install vhs imagemagick`) and run `demo/render.sh`. It builds a small project in `~/bash-why-demo`, records one Claude Code session there with the installed mod, captures it with the lines shown and hidden, and frames both into `assets/before-after.png`. If the layout of Claude Code changes, adjust the crop regions at the top of `demo/compose.sh`.

## Related

[description-hook](https://github.com/david-zvi/description-hook) makes Claude describe every command and shows that description in the permission prompt, before you approve it. bash-why is about reading the transcript afterwards. The two work well together.
