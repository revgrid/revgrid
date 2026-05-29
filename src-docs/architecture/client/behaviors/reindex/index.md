---
title: Reindex Behavior
---

Reindex behavior reconciles client state after row index changes.

It updates mappings used by selection, focus, and view layout so row insertions/deletions/reorders remain consistent with the active data model.

## Primary Class

{@link client/behavior/reindex-behavior!RevReindexBehavior:class RevReindexBehavior}

## Key Members

1. stash(): Captures focus/selection state and clears current state before reindexing.
1. unstash(allRowsKept): Restores stashed focus/selection state after reindexing.

## Guarantees

Nested stash requests are reference-counted. Assertions protect against unbalanced or invalid stash/unstash usage.
