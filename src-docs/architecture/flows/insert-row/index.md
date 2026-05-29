---
title: Insert Row Flow
---

Insert-row flow updates the grid after server row insertion.

1. Data server emits row insertion/reindex notification.
1. Reindex behavior updates index mapping and dependent state.
1. Selection and focus reconcile row positions.
1. View layout recalculates row ranges.
1. Renderer repaints impacted regions.

Focus stashing/restoration keeps user context stable during row-index shifts.
