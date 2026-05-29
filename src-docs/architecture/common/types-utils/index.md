---
title: Types and Utilities
---

The `types-utils` package provides foundational types and helpers used across client and server modules.

This area includes:

1. Geometry and range primitives (`point`, `rectangle`, `corner-area`, `start-length`).
1. Selection and keyboard-related enums/types.
1. Canvas and CSS utility abstractions.
1. Generic helpers (`registry`, error wrappers, and runtime utility functions).

These primitives are intentionally small and reusable so higher-level modules can compose behavior without duplicating low-level logic.

## Major Symbol Families

1. Geometry and ranges: `RevPoint`, `RevRectangle`, `RevCornerArea`, `RevCornerRectangle`, `RevStartLength`.
1. Selection typing: `RevSelectionAreaTypeId`, `RevSelectionAreaType`, `RevSelectionAreaType` namespace conversion helpers.
1. View/state helpers: `RevEnsureFullyInView`, `RevModifierKey`, registry and utility helpers.
1. Error and runtime utility types: `RevgridError` derivatives and shared structural aliases.

Each utility module under `common/types-utils` has a generated API Reference page listing interfaces, enums, namespaces, constants, and all member signatures.
