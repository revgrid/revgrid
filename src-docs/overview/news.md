---
title: News
---

# News

* *03 November 2025*: **Release 0.11.1**\
  **[Breaking changes](./breaking-changes.md#0110)**

  * Revgrid now directly uses a Canvas element supplied via its constructor (instead of a HTML element under which Revgrid created a canvas element). This provides applications with better control over the DOM.
  * No side effects declared in package (to allow tree shaking)
  * Fix bug where active column not correctly found
  * Minor API changes

* *07 August 2025*: **Release 0.10.0**\
  **[Breaking changes](./breaking-changes.md#0100)**
  * Current and previous focus can be in different subgrids
  * Selection areas now can be in different subgrids
  * Clean up naming of focus and selection related property and method names and parameters
  * Ensure click, dblClick and startDrag event handling in UiControllers use same cell as mouseDown event handlers
  * Minor fixes

* *19 July 2025*: **[Client Components](../architecture/client/components/index.md) dependency diagram drawn**

* *04 July 2025*: **[Client](../architecture/client/index.md) doc page written**

* *01 July 2025*: **[Top level grid classes](../architecture/top-level/grid-classes/index.md) doc page written**

* *27 June 2025*: **Switch to TypeDoc expand entryPointStrategy**\
API now better shows hierarchy of modules/namespaces/classes/interfaces.

* *25 June 2025*: **[Data Row Array Test App](../examples/data-row-array-test/index.md) doc page written**

* *23 June 2025*: **[Top level modules](../architecture/top-level/modules/index.md) doc page written**
