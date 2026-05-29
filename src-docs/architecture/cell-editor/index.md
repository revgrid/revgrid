---
title: Cell Editor
---

Cell editors provide interactive editing controls for focused cells.

Editor lifecycle:

1. Activate for current focus cell.
1. Read initial value and configure UI element.
1. Validate and transform user input.
1. Commit or cancel, then release resources.

Editors are selected by cell/column configuration and executed through focus + UI-controller orchestration.

Standard implementations are documented in [Standard Cell Editors](../libraries/standard/cell-editors/index.md).
