---
title: Focus Select Behavior
---

Focus-select behavior keeps focus and selection state in sync.

It applies keyboard/mouse modifier semantics and ensures range selections, anchor updates, and focused-cell updates follow predictable rules.

## Primary Class

{@link client/behavior/focus-select-behavior!RevFocusSelectBehavior:class RevFocusSelectBehavior}

## Key Members

1. Column selection: selectColumn(s), onlySelectColumn(s), toggleSelectColumn(...), focusOnlySelectColumn(...).
1. Row selection: selectRow(s), selectAllRows(...), onlySelectRow(s), toggleSelectRow(...), focusOnlySelectRow(...).
1. Cell/rectangle selection: focusOnlySelectCell(...), focusSelectCell(...), focusToggleSelectCell(...), focusOnlySelectRectangle(...).
1. Area transforms: focusReplaceLastArea(...), focusReplaceLastAreaWithRectangle(...), tryExtendLastSelectionAreaAsCloseAsPossibleToFocus().
1. Helpers: tryOnlySelectFocusedCell(), onlySelectViewCell(...), isMouseAddToggleExtendSelectionAreaAllowed(...).

## Integration Notes

Focus-select behavior batches selection updates with beginChange/endChange and synchronizes with focus-setting calls to avoid intermediate inconsistent states.
