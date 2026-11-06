#!/bin/sh
# Builds the small project the demo tape records in: ~/bash-why-demo.
set -e
D="$HOME/bash-why-demo"
rm -rf "$D"
mkdir -p "$D/tests"
cd "$D"
git init -q -b main
printf 'def add(a, b):\n    return a + b\n\n\ndef divide(a, b):\n    if b == 0:\n        raise ValueError("cannot divide by zero")\n    return a / b\n' > calc.py
printf 'import unittest\n\nfrom calc import add, divide\n\n\nclass CalcTest(unittest.TestCase):\n    def test_add(self):\n        self.assertEqual(add(2, 3), 5)\n\n    def test_divide_by_zero(self):\n        with self.assertRaises(ValueError):\n            divide(1, 0)\n' > tests/test_calc.py
touch tests/__init__.py
echo "# calc" > README.md
git add .
git -c user.name=Demo -c user.email=demo@example.com commit -q -m "Add calc with add and divide"
printf '\n\ndef subtract(a, b):\n    return a - b\n' >> calc.py
