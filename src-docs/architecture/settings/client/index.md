---
title: Client Setting Interfaces
---

Client setting interfaces define the configurable surface for grid behavior and appearance.

Key interface families include:

1. Grid-level settings (`grid-settings`, `only-grid-settings`, `behaviored-grid-settings`).
1. Column-level settings (`column-settings`, `only-column-settings`, `behaviored-column-settings`).
1. Composite settings (`behaviored-settings`) and invalidation enums used for efficient re-render decisions.

These interfaces are consumed by grid construction and runtime behavior modules, and are implemented by classes in `settings-implementations`.

## Primary Public Symbols

1. {@link client/settings/grid-settings!RevGridSettings:interface RevGridSettings}
1. {@link client/settings/column-settings!RevColumnSettings:interface RevColumnSettings}
1. {@link client/settings/behaviored-grid-settings!RevBehavioredGridSettings:interface RevBehavioredGridSettings}
1. {@link client/settings/behaviored-column-settings!RevBehavioredColumnSettings:interface RevBehavioredColumnSettings}
1. {@link client/settings/only-grid-settings!RevOnlyGridSettings:interface RevOnlyGridSettings}
1. {@link client/settings/only-column-settings!RevOnlyColumnSettings:interface RevOnlyColumnSettings}
1. {@link client/settings/behaviored-settings!RevBehavioredSettings:interface RevBehavioredSettings}
1. {@link client/settings/grid-setting-change-invalidate-types!RevGridSettingChangeInvalidateTypeId:type RevGridSettingChangeInvalidateTypeId}

Generated API Reference pages include complete property lists and member-level descriptions for each interface and related type.
