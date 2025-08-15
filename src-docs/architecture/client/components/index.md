---
title: Components
children:
    - ./canvas/index.md
    - ./columns-manager/index.md
    - ./focus/index.md
    - ./mouse/index.md
    - ./renderer/index.md
    - ./scroller/index.md
    - ./selection/index.md
    - ./subgrids-manager/index.md
    - ./view-layout/index.md
---

# Client Components

The Client components manage the main resources and constructs used in Revgrid. Each component maintains its state and exposes methods which allow dependent components or behaviors to update its state.  The diagram below shows the dependency between components.  Components are dependent on components below them where linked.

![Components Dependency Block](components-dependency-block.excalidraw.svg)

* **[Canvas](./canvas/index.md)**\
Handles interactions with the grid's canvas HTML element.
* **[Columns Manager](./columns-manager/index.md)**\
Manages the structure, visibility, sizing, and settings of columns in the grid, ensuring that the grid view and data schema remain synchronized.
* **[Subgrids Manager](./subgrids-manager/index.md)**\
ToDo
* **[View Layout](./view-layout/index.md)**\
ToDo
* **[Focus](./focus/index.md)**\
Manages cell focus and cell editing within a grid component.
* **[Mouse](./mouse/index.md)**\
Manages mouse interactions for the grid component.
* **[Scroller (Horizontal & Vertical)](./scroller/index.md)**\
ToDo
* **[Selection](./selection/index.md)**\
Manages selection logic for a grid component.
* **[Renderer](./renderer/index.md)**\
ToDo
