---
title: Breaking Changes
---

# Breaking Changes

## 0.11.0

* Grid is now constructed around a &lt;canvas> element.  Previous versions were constructed around a HTML element (host element) to which Revgrid added a &lt;canvas> element as a child.  Now the &lt;canvas> element needs to be supplied to the Revgrid constructor (instead of the host element).\
\
In most cases, this breaking change can be fixed by:
    1. Adding the following &lt;canvas> element as a child to your existing host element:\
    `<canvas id="gridCanvas" tabindex="0" draggable="true"></canvas>`
    1. Giving the &lt;canvas> element the following the styles:

        ```css
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
        border-width: 0;
        outline: none;
        ```

    1. Passing the &lt;canvas> element to the Revgrid constructor instead of the host element.

* Rename Grid setting `editorClickableCursorName` to `cellEditPossibleCursorName`
* Rename RevColumnsManager and RevClientGrid function `swapColumns` to `swapActiveColumns`

## 0.10.0

* Current and previous focus can be in different subgrids
* Selection areas now can be in different subgrids
* `allArea` replaced with `dynamicAll` area type which can be set individually for each subgrid
