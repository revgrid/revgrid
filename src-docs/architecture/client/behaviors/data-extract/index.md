---
title: Data Extract Behavior
---

Data-extract behavior provides value extraction helpers for selections and ranges.

It is used by clipboard/export style features to collect normalized cell data independent of rendering logic.

## Primary Class

{@link client/behavior/data-extract-behavior!RevDataExtractBehavior:class RevDataExtractBehavior}

## Key Members

1. getSelectionAsTSV(): Converts current selection into tab-separated text.
1. convertDataValueArraysToTsv(...): Matrix-to-string conversion helper.
1. getDynamicAllSelectionMatrix(...): Extracts dynamic-all selection values.
1. getRowSelectionMatrix(...), getColumnSelectionMatrix(...): Extracts row/column-oriented matrices.
1. getSelectedValuesByRectangleColumnRowMatrix(...): Extracts rectangle selections for copy/export style scenarios.
1. getRowSelectionData(...), getSelectedColumnsValues(...): Returns object-based extraction payloads keyed by field name.

## Notes

Selection extraction supports subgrid-aware access and active-column mapping. Data is resolved through subgrid view-value APIs, not renderer state, so extraction remains independent of viewport clipping.
