---
title: Standard Table Field Source Definition Caching Factory Service
---

This factory service adds caching to table field-source definition construction.

Caching helps avoid repeated recomputation of equivalent definition graphs, reducing setup overhead in dynamic sourced-field/table scenarios.

Use it when field-source definitions are expensive or reused across multiple table constructions.
