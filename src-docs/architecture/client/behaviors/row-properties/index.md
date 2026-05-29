---
title: Row Properties Behavior
---

Row-properties behavior resolves row-level settings and metadata.

It is used by layout and rendering logic for row sizing, visibility, and per-row display treatment.

## Primary Class

{@link client/behavior/row-properties-behavior!RevRowPropertiesBehavior:class RevRowPropertiesBehavior}

## Key Members

1. setRowHeight(...): Updates row pixel height and invalidates layout/render state.
1. setRowProperties(...), setRowPropertiesUsingCell(...): Full row-properties replacement APIs.
1. setRowProperty(...), setRowPropertyUsingCell(...): Single-property mutation APIs.

## Invalidation Semantics

Row-height changes invalidate horizontal layout with row-size awareness; non-height property changes trigger state refresh without forced size recomputation.
