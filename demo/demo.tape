# Recorded by demo/render.sh: one session, captured with the lines shown and
# again after /bash-why off, then /bash-why on restores the setting.

Output demo/demo.gif

Set Shell zsh
Set FontSize 18
Set Width 1240
Set Height 1000
Set Padding 24
Set Theme "Catppuccin Mocha"
Set TypingSpeed 30ms
Env PYTHONDONTWRITEBYTECODE "1"

Hide
Type "unset CLAUDECODE CLAUDE_CODE_CHILD_SESSION; cd ~/bash-why-demo && clear && claude --permission-mode default --allowedTools Bash"
Enter
Sleep 6s
Down
Enter
Sleep 5s
Show

Type "Review the uncommitted change and run the tests. Reply in two short sentences."
Sleep 500ms
Enter
Sleep 75s
Screenshot demo/with.png
Sleep 2s

Type "/bash-why off"
Sleep 1s
Enter
Sleep 4s
Screenshot demo/without.png
Sleep 2s

Type "/bash-why on"
Sleep 1s
Enter
Sleep 3s
Ctrl+C
Ctrl+C
Sleep 1s
