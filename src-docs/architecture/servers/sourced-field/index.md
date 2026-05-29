---
title: Sourced Field Server
---

Sourced Field servers build fields from one or more source definitions.

This model is used when displayed columns are not a one-to-one mapping with raw source structures. It supports custom field generation, source references, and composed heading strategies.

Sourced-field modules also provide specialized record and data-row-array variants for common application patterns.

## Primary Public Symbols

1. {@link sourced-field/sourced-field/server/sourced-field!RevSourcedField:interface RevSourcedField}
1. {@link sourced-field/sourced-field/server/sourced-field-custom-headings!RevSourcedFieldCustomHeadings:interface RevSourcedFieldCustomHeadings}
1. {@link sourced-field/sourced-field/server/definition/sourced-field-definition!RevSourcedFieldDefinition:interface RevSourcedFieldDefinition}
1. {@link sourced-field/sourced-field/server/definition/sourced-field-source-definition!RevSourcedFieldSourceDefinition:interface RevSourcedFieldSourceDefinition}
1. {@link sourced-field/sourced-field/server/allowed-sourced-fields-column-layout-definition!RevAllowedSourcedFieldsColumnLayoutDefinition:type RevAllowedSourcedFieldsColumnLayoutDefinition}

## Variant Families

1. `sourced-field/data-row-array/*` single-heading and multi-heading sourced-field modules.
1. `sourced-field/record/record/*` record sourced-field modules.
1. `sourced-field/record/table/*` table/data-source/value/field-source modules.

Use API Reference pages for full class/interface/type/member listings across each variant.
