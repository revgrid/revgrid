---
title: Insert Column Flow
---

Insert-column flow updates schema-dependent state after column changes.

1. Schema/column-layout server publishes structural update.
1. Columns manager rebuilds active column set.
1. View layout recalculates widths/positions.
1. Selection/focus reconcile column references.
1. Renderer repaints with new column geometry.

Column identity is used to minimize disruption to existing UI state.
