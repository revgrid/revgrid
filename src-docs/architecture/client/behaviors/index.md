---
title: Behavior
children:
    - ./cell-properties/index.md
    - ./data-extract/index.md
    - ./event/index.md
    - ./focus-scroll/index.md
    - ./focus-select/index.md
    - ./reindex/index.md
    - ./row-properties/index.md
    - ./server-notification/index.md
---

Behaviors coordinate cross-component actions and expose higher-level operations.

They are the preferred integration surface for custom workflows because they combine component updates in a consistent order.

Behavior modules cover focus/selection coordination, reindexing, server notification handling, event forwarding, and property/value extraction helpers.

## Public Behavior Classes

1. {@link client/behavior/behavior-manager!RevBehaviorManager:class RevBehaviorManager}
1. {@link client/behavior/cell-properties-behavior!RevCellPropertiesBehavior:class RevCellPropertiesBehavior}
1. {@link client/behavior/data-extract-behavior!RevDataExtractBehavior:class RevDataExtractBehavior}
1. {@link client/behavior/event-behavior!RevEventBehavior:class RevEventBehavior}
1. {@link client/behavior/focus-scroll-behavior!RevFocusScrollBehavior:class RevFocusScrollBehavior}
1. {@link client/behavior/focus-select-behavior!RevFocusSelectBehavior:class RevFocusSelectBehavior}
1. {@link client/behavior/reindex-behavior!RevReindexBehavior:class RevReindexBehavior}
1. {@link client/behavior/row-properties-behavior!RevRowPropertiesBehavior:class RevRowPropertiesBehavior}
1. {@link client/behavior/server-notification-behavior!RevServerNotificationBehavior:class RevServerNotificationBehavior}
