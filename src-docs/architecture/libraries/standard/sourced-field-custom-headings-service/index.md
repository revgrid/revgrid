---
title: Standard Sourced Field Custom Headings Service
---

This service creates custom heading definitions for sourced-field scenarios.

It centralizes heading composition logic so applications can map complex field-source models to consistent heading structures without duplicating transformation code.

Use this service when heading text/shape depends on source composition rules rather than one static schema.

## Primary Public Symbol

1. {@link standard/server/services/standard-sourced-field-custom-headings-service!RevStandardSourcedFieldCustomHeadingsService:class RevStandardSourcedFieldCustomHeadingsService}

## Key Members

1. tryGetFieldHeading(sourceName, fieldName)
1. setFieldHeading(sourceName, fieldName, text)
1. load(), save(), checkSave()

The class page includes complete method/member signatures.
