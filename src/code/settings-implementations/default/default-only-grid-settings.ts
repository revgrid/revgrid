
import { RevOnlyGridSettings } from '../../client';
import { RevHorizontalWheelScrollingAllowedId, RevModifierKey } from '../../common';

/** @public */
export const revDefaultOnlyGridSettings: RevOnlyGridSettings = {

    eventDispatchEnabled: false,

    /**
     * Multiplier for horizontal mouse wheel movement, applied to values of [`WheelEvent#deltaX`](https://developer.mozilla.org/docs/Web/API/WheelEvent/deltaX) (received by the horizontal scrollbar's listener).
     *
     * #### Caveat
     * Wheel granularity depends on the OS, the input device, and possibly the browser. Any setting you choose will work differently in different environments. If you don't know the user's environment, it is probably best to give users control of this setting so they can fine tune it themselves.
     *
     * #### Default values
     * This particular default value of `0.01` seems to work well on the MacBook Pro trackpad. It's slower than it was, which will greatly improve the scrolling experience since column scrolling often occurred inadvertently when the intent was to scroll in the veritcal direction only.
     *
     * Be aware however that the trackpad scrolling speed can be adjusted by the Mac user at the OS level (System Preferences -> Accessibility -> Mouse & Trackpad -> Trackpad Options… -> Scrolling speed).
     *
     * Hint: You can tell if the user is using a trackpad by listening for any deltaX (since a simple mouse wheel is deltaY only); and what OS by checking user agent.
     * @default
     * @type {number}
     */
    wheelHFactor: 1,

    /**
     * Multiplier for vertical mouse wheel movement, applied to values of [`WheelEvent#deltaY`](https://developer.mozilla.org/docs/Web/API/WheelEvent/deltaY) (received by the vertical scrollbar's listener).
     *
     * #### Caveat
     * Wheel granularity depends on the OS, the input device, and possibly the browser. Any setting you choose will work differently in different environments. If you don't know the user's environment, it is probably best to give users control of this setting so they can fine tune it themselves.
     *
     * #### Default values
     * This particular default value of `0.05` is a compromise. It seems to work well on the MacBook Pro trackpad; and works acceptably (though differently) with a mouse wheel on both Mac OS and Windows.
     *
     * Be aware however that the trackpad scrolling speed can be adjusted by the Mac user at the OS level (System Preferences -> Accessibility -> Mouse & Trackpad -> Trackpad Options… -> Scrolling speed). Mouse wheel scrolling speed is also adjustable ( _yada yada_ -> Mouse Options… -> Scrolling speed; or on Windows search for "Change mouse wheel settings" in the Start menu).
     *
     * This default setting of `0.05` feels good on trackpad (2-finger drag). It's much slower than it was, but the way it was before was way to coarse and fast, scrolling hundreds of rows in a flash.
     *
     * With this setting, a mouse connected to a Mac, the wheel requires 5 click-stops to scroll 1 row; the same mouse connected to Windows scrolls 5 rows per click-stop. (However, I may have changed the default settings on my machines; not sure.)
     *
     * On Windows, the original multiplier setting (_i.e.,_ `1.0`) scrolled 100 grid rows on a single mouse wheel click-stop; the new default (`0.05`) scrolls 5 rows per click-stop. It stands to reason therefore that a setting of `0.01` will scroll 1:1 (1 row per 1 click-stop).
     *
     * #### Hint
     * You can tell if the user is using a trackpad by listening for any deltaX (since a simple mouse wheel is deltaY only); and what OS by checking user agent.
     * @default
     * @type {number}
     */
    wheelVFactor: 1,

    /**
     * Font color for data cells.
     * @default
     * @type {string}
     */
    color: 'rgb(25, 25, 25)',

    /**
     * Background color for data cells.
     * @default
     * @type {string}
     */
    backgroundColor: 'rgb(241, 241, 241)',

    columnMoveDragPossibleCursorName: undefined,
    columnMoveDragPossibleTitleText: 'Drag to move column',
    columnMoveDragActiveCursorName: 'ew-resize',
    columnMoveDragActiveTitleText: '',
    columnResizeDragPossibleCursorName: 'col-resize',
    columnResizeDragPossibleTitleText: 'Double click to adjust width to fit text\nHold <shift> to widen only\nHold <Ctrl> to activate auto fit',
    columnResizeDragActiveCursorName: 'col-resize',
    columnResizeDragActiveTitleText: '',
    columnSortPossibleCursorName: undefined,
    columnSortPossibleTitleText: 'Click to sort', // Change this if double click to sort is true
    filterFont: '12px Tahoma, Geneva, sans-serif',
    filterColor: 'rgb(25, 25, 25)',
    filterBackgroundColor: 'white',
    filterForegroundSelectionColor: 'rgb(25, 25, 25)',
    filterBackgroundSelectionColor: 'rgb(255, 220, 97)',
    filterCellPainter: 'SimpleCell',
    filterEditor: 'TextField',
    filterable: true,
    showFilterRow: false,
    scrollerThickness: '0.7em',
    scrollerThumbColor: '#d3d3d3',
    scrollerThumbReducedVisibilityOpacity: 0.4,
    showScrollerThumbOnMouseMoveModifierKey: RevModifierKey.control,
    scrollHorizontallySmoothly: true,
    scrollingEnabled: true,
    horizontalWheelScrollingAllowed: RevHorizontalWheelScrollingAllowedId.CtrlKeyDown,

    horizontalGridLinesWidth: 1,
    horizontalGridLinesColor: 'rgb(199, 199, 199)',

    verticalGridLinesWidth: 1,
    verticalGridLinesColor: 'rgb(199, 199, 199)',

    verticalGridLinesVisible: true,
    visibleVerticalGridLinesDrawnInFixedAndPreMainOnly: false,
    horizontalGridLinesVisible: true,
    gridRightAligned: false,
    horizontalFixedLineWidth: 2,
    horizontalFixedLineEdgeWidth: undefined,
    horizontalFixedLineColor: 'rgb(164,164,164)', // ~21% darker than default
    verticalFixedLineWidth: 2,
    verticalFixedLineEdgeWidth: undefined,
    verticalFixedLineColor: 'rgb(164,164,164)', // ~21% darker than default
    defaultRowHeight: 14,

    defaultColumnWidth: 50,

    /**
     * The default (`5`) is enough room for an ellipsis with default font size.
     */
    minimumColumnWidth: 5,

    maximumColumnWidth: undefined,

    visibleColumnWidthAdjust: true,

    /**
     * Resizing a column through the UI (by clicking and dragging on the column's
     * right border in the column header row) normally affects the width of the whole grid.
     *
     * Set this new property to truthy to inversely resize the next column.
     * In other words, if user expands (say) the third column, then the fourth column will contract —
     * and _vice versa_ — without therefore affecting the width of the grid.
     *
     * This is a _column property_ and may be set for selected columns (`myColumn.properties.resizeColumnInPlace`)
     * or for all columns by setting it at the grid level (`myGrid.properties.resizeColumnInPlace`).
     *
     * Note that the implementation of this property does not allow expanding a
     * column beyond the width it can borrow from the next column.
     * The last column, however, is unconstrained, and resizing of course affects the total grid width.
     * @default
     * @type {boolean}
     */
    resizeColumnInPlace: false,

    resizedEventDebounceExtendedWhenPossible: false,
    resizedEventDebounceInterval: 100, // milliseconds

    minimumAnimateTimeInterval: 80,
    backgroundAnimateTimeInterval: undefined, // Set to 0 to repaint continuously.  Set to positive integer to repaint regularly (ie polling instead of being event driven)
    useHiDPI: true,
    fixedColumnCount: 0,
    fixedRowCount: 0,
    mouseLastSelectionAreaExtendingDragActiveCursorName: 'cell',
    mouseLastSelectionAreaExtendingDragActiveTitleText: undefined,
    mouseAddToggleExtendSelectionAreaEnabled: true,
    mouseAddToggleExtendSelectionAreaDragModifierKey: undefined,
    mouseColumnSelectionEnabled: true,
    mouseColumnSelectionModifierKey: RevModifierKey.alt,
    mouseRowSelectionEnabled: true,
    mouseRowSelectionModifierKey: undefined,
    primarySelectionAreaType: 'rectangle',
    secondarySelectionAreaType: 'row',
    secondarySelectionAreaTypeSpecifierModifierKey: RevModifierKey.control,
    extendLastSelectionAreaModifierKey: RevModifierKey.shift,
    addToggleSelectionAreaModifierKey: RevModifierKey.control,
    addToggleSelectionAreaModifierKeyDoesToggle: true,
    switchNewRectangleSelectionToRowOrColumn: undefined,

    /**
     * Fill color for last selection overlay.
     * @remarks The color should be translucent (or transparent). Note that "Partial" grid renderers (such as the {@link paintCellsAsNeeded} renderer) do not draw overlay because it just gets darker and darker for non-updated cells.
     * @default
     * @type {cssColor}
     */
    selectionRegionOverlayColor: undefined, // 'rgba(0, 0, 48, 0.2)',

    /**
     * Stroke color for last selection overlay.
     * @default
     * @type {string}
     */
    selectionRegionOutlineColor: undefined, // rgb(69, 69, 69)',

    /**
     * Whether to automatically expand column width to accommodate widest rendered value.
     * @remarks When truthy for a given column _and_ user has not manually resized it, column will expand to accommodate widest rendered value.
     *
     * What's actually happening is (`props` in the following refers to the column's properties):
     * 1. On each grid render, for all visible columns:
     *    1. The cell renderer reports back the width of each rendered cell contents.
     *    2. The largest value for each column is saved (in `props.preferredWidth`).
     * 2. At the conclusion of the grid render, the renderer calls `grid.gridRenderedNotification`, which calls `grid.behavior.checkColumnAutoSizing`, which for all columns for which `props.columnAutoSizing` is truthy, determines if the column needs to be widened subject to the following conditions:
     *    1. If user has not already manually set column width (`props.columnAutoSized` is still falsy)
     *    2. If render width > current width (`props.preferredWidths > props.width`)
     *    3. If column's max autoSizing width is defined and it's greater than render width (`props.peferredWidths < props.columnAutoSizingMax`)
     * 3. If any column width has changed, re-shape the grid with the new column widths and re-render it. As this typically happens before the next monitor refresh, user only sees the final result.
     * @default
     * @type {boolean}
     */
    defaultColumnAutoSizing: true,

    /**
     * The widest the column will be auto-sized to.
     * @remarks For no limit, set this property to a falsy value such as `undefined` or `0`.
     *
     * Note this property only specifies a maximum column width for _auto-sizing;_ it places no limit on manual resizing of column width.
     * @default
     * @type {number}
     */
    columnAutoSizingMax: 400,

    /**
     * @default
     * @type {boolean}
     */
    rowResize: false,


    /* CELL EDITING */

    editable: false,
    editKey: 'F2',

    editOnClick: true,
    /**
     * Edit cell on double-click rather than single-click.
     */
    editOnDoubleClick: false,

    editOnFocusCell: false,
    editOnKeyDown: true,

    cellEditPossibleCursorName: 'pointer',

    sortOnClick: true,
    sortOnDoubleClick: false,

    multipleSelectionAreas: true,

    columnsReorderable: true,
    columnsReorderableHideable: false,

    columnClip: true,

    rowStripeBackgroundColor: undefined,

    defaultUiControllerTypeNames: [
        'focusscroll',
        'selection',
        // 'filters',
        // 'cellselection',
        // 'keypaging',
        'columnresizing',
        // 'rowresizing',
        // 'rowselection',
        // 'columnselection',
        'columnmoving',
        'columnsorting',
        // 'cellclick',
        // 'cellediting',
        'hover',
        'touchscrolling',
        // 'thumbwheelscrolling',
        'clipboard'
    ],
};

/** cssColor
 * @see https://developer.mozilla.org/docs/Web/CSS/color_value
 */
/** cssFont
 * @see https://developer.mozilla.org/docs/Web/CSS/font
 */
