---
title: Grid
children:
    - ./definition/index.md
    - ./options/index.md
---

# Client Grid

A Revgrid instance is created by instantiating an instance of the {@link client/client-grid!RevClientGrid:class RevClientGrid} class or a descendant of this class.

## Constructor Parameters

The constructor for this class requires the following parameters:

* **element**: HTMLCanvasElement\
The [canvas element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/canvas) upon which the grid will be drawn. See [Canvas description](../components/canvas/index.md#element) for more information about the canvas element.
* **definition**: {@link client/grid-definition!RevGridDefinition:interface RevGridDefinition&lt;BCS, SF&gt;}\
Specifies the columns and subgrids within the grid. See [Grid Definition](./definition/index.md) for more information.
* **settings**: BGS\
Specifies the settings for the grid. See [Client Setting Interfaces](../../settings/client/index.md) for more information.
* **getSettingsForNewColumnEventer**: RevClientGrid.{@link client/client-grid!RevClientGrid.GetSettingsForNewColumnEventer GetSettingsForNewColumnEventer&lt;BCS, SF&gt;}\
Specifies a callback which returns the initial settings for a new column. See [Client Setting Interfaces](../../settings/client/index.md) for more information.
* **options**: RevGridOptions&lt;BGS, BCS, SF&gt; (optional)\
Specifies options for the grid. See [Grid Options](./options/index.md) for more information.

## Generic Parameters
