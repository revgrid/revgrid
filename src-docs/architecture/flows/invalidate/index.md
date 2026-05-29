---
title: Invalidate Flow
---

Invalidate flow refreshes affected visual regions without full grid reconstruction.

1. A server or client action marks rows/cells/columns dirty.
1. Notification behavior forwards invalidation to relevant components.
1. View layout and renderer compute affected areas.
1. Renderer repaints invalid regions on next cycle.

This keeps updates fast for real-time data scenarios.
