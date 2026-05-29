---
title: Standard Table Field Source Definition Caching Factory Service
---

This factory service adds caching to table field-source definition construction.

Caching helps avoid repeated recomputation of equivalent definition graphs, reducing setup overhead in dynamic sourced-field/table scenarios.

Use it when field-source definitions are expensive or reused across multiple table constructions.

## Primary Public Symbol

1. {@link standard/server/services/standard-table-field-source-definition-caching-factory-service!RevStandardTableFieldSourceDefinitionCachingFactoryService:class RevStandardTableFieldSourceDefinitionCachingFactoryService}

## Key Members

1. get(typeId): Returns cached definition or creates one via provided factory.
1. createLayoutDefinition(fieldIds): Builds column-layout definitions from field identifiers.

The class page in API Reference includes complete generic parameters and member signatures.
