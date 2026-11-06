#!/bin/sh
# Records the demo session and builds assets/before-after.png from it.
set -e
cd "$(dirname "$0")/.."
demo/setup.sh
vhs demo/demo.tape
demo/compose.sh
rm -rf "$HOME/bash-why-demo"
