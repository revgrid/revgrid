---
title: Column Layout Server
---

Column Layout servers manage named column layouts and references.

They support:

1. Defining reusable column sets.
1. Storing favorites or active layout references.
1. Resolving layout-or-reference structures into concrete visible columns.

This enables end-user personalization and persisted layout switching without changing underlying field definitions.

## Primary Public Symbols

1. {@link column-layout/server/column-layout!RevColumnLayout:class RevColumnLayout}
1. {@link column-layout/server/referenceable-column-layout!RevReferenceableColumnLayout:class RevReferenceableColumnLayout}
1. {@link column-layout/server/referenceable-grid-columns!RevReferenceableColumnLayouts:interface RevReferenceableColumnLayouts}
1. {@link column-layout/server/column-layout-or-reference!RevColumnLayoutOrReference:class RevColumnLayoutOrReference}
1. {@link column-layout/server/column-layout-change!RevColumnLayoutChange:namespace RevColumnLayoutChange}
1. `column-layout/server/definition/*` definition and store types
1. {@link column-layout/column-layout-grid!RevColumnLayoutGrid:class RevColumnLayoutGrid}

See API Reference pages for exhaustive member-level details.
