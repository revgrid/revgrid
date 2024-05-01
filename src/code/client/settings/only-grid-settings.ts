// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevHorizontalWheelScrollingAllowedId, RevModifierKey, RevRowOrColumnSelectionAreaType, RevSelectionAreaType } from '../../common/internal-api';

/** @public */
export interface RevOnlyGridSettings {
    /** Modifier key that indicates a UI action should add a selection area to selection or toggle a selection area within a selection */
    addToggleSelectionAreaModifierKey: RevModifierKey;
    /** Specifies whether the addToggleSelectionAreaModifierKey toggles.  If if does not toggle, then it adds */
    addToggleSelectionAreaModifierKeyDoesToggle: boolean;
    backgroundColor: RevOnlyGridSettings.Color;
    color: RevOnlyGridSettings.Color;
    /** The widest the column will be auto-sized to. */
    columnAutoSizingMax: number | undefined;
    /** Set up a clipping region around each column before painting cells. */
    columnClip: boolean | undefined;
    columnMoveDragPossibleCursorName: string | undefined;
    columnMoveDragPossibleTitleText: string | undefined;
    columnMoveDragActiveCursorName: string | undefined;
    columnMoveDragActiveTitleText: string | undefined;
    columnResizeDragPossibleCursorName: string | undefined;
    columnResizeDragPossibleTitleText: string | undefined;
    columnResizeDragActiveCursorName: string | undefined;
    columnResizeDragActiveTitleText: string | undefined;
    columnSortPossibleCursorName: string | undefined;
    columnSortPossibleTitleText: string | undefined;
    /** Allow user to move columns. */
    columnsReorderable: boolean;
    /** Columns can be hidden when being reordered. */
    columnsReorderableHideable: boolean;
    switchNewRectangleSelectionToRowOrColumn: RevRowOrColumnSelectionAreaType | undefined;
    defaultRowHeight: number;
    /** Whether to automatically expand column width to accommodate widest rendered value. */
    defaultColumnAutoSizing: boolean;
    defaultColumnWidth: number;
    defaultUiControllerTypeNames: string[];
    editable: boolean;
    /** Keyboard event key for editing a cell */
    editKey: string;
    /** Open cell editor for cell when clicked by mouse */
    editOnClick: boolean;
    /** Open cell editor for cell when double clicked by mouse */
    editOnDoubleClick: boolean;
    /** Open cell editor for cell when cell gains focus */
    editOnFocusCell: boolean;
    /** Open cell editor for cell when cell focus and certain keys are pushed down */
    editOnKeyDown: boolean;
    /** Cursor to display when cell editor can be clicked */
    editorClickableCursorName: string | undefined;
    /** Modifier key that indicates a UI action should extend the selection area */
    extendLastSelectionAreaModifierKey: RevModifierKey;
    /** Whether grid events are dispatched as DOM events */
    eventDispatchEnabled: boolean;
    /** Validation failure feedback. */
    filterable: boolean;
    filterBackgroundColor: RevOnlyGridSettings.Color;
    filterBackgroundSelectionColor: RevOnlyGridSettings.Color;
    filterColor: RevOnlyGridSettings.Color;
    filterEditor: string;
    filterFont: string;
    filterForegroundSelectionColor: RevOnlyGridSettings.Color;
    filterCellPainter: string;

    fixedColumnCount: number;
    /**
     * Define this property to style rule lines between fixed & scolling rows differently from {@link module:defaults.gridLinesHColor}.
     */
    horizontalFixedLineColor: RevOnlyGridSettings.Color;
    /**
     * Define this property to render just the edges of the lines between non-scrollable rows & scrollable rows, creating a double-line effect.
     * The value is the thickness of the edges.
     * Undefined means no edge effect
     * Typical definition would be `1` in tandem with setting {@link module:defaults.fixedLinesHWidth fixedLinesHWidth} to `3`.
     */
    horizontalFixedLineEdgeWidth: number | undefined;
    /**
     * Define this property to style rule lines between non-scrollable rows and scrollable rows differently from {@link module:defaults.gridLinesHWidth gridLinesHWidth}.
     * Undefine it to show normal grid line in that position.
     */
    horizontalFixedLineWidth: number | undefined;
    /**
     * Define this property to style rule lines between fixed & scolling columns differently from {@link module:defaults.gridLinesVColor}.
     */
    verticalFixedLineColor: RevOnlyGridSettings.Color;
    /**
     * Define this property to render just the edges of the lines between fixed & scrolling columns, creating a double-line effect.
     * The value is the thickness of the edges.
     * Undefined means no edge effect
     * Typical definition would be `1` in tandem with setting {@link module:defaults.fixedLinesVWidth fixedLinesVWidth} to `3`.
     * {@link module:defaults.fixedLinesVWidth}
     */
    verticalFixedLineEdgeWidth: number | undefined;
    /**
     * Define this property to style rule lines between non-scrollable columns and scrollable columns differently from {@link module:defaults.gridLinesVWidth gridLinesVWidth}.
     * Undefine it to show normal grid line in that position.
     */
    verticalFixedLineWidth: number | undefined;
    fixedRowCount: number;
    /**
     * Instead of visible columns starting from left side of canvas, they end at the right side of canvas
     * So last column is always visible and the first one visible is dependent on the width of the canvas
     */
    gridRightAligned: boolean;
    /** Color of horizontal grid lines. */
    horizontalGridLinesColor: RevOnlyGridSettings.Color;
    /** Thickness of horizontal grid lines (pixels). */
    horizontalGridLinesWidth: number;
    horizontalGridLinesVisible: boolean;
    horizontalWheelScrollingAllowed: RevHorizontalWheelScrollingAllowedId;
    minimumColumnWidth: number;
    maximumColumnWidth: number | undefined;
    /** Cursor to appear when extending a selection with a mouse drag */
    mouseLastSelectionAreaExtendingDragActiveCursorName: string | undefined;
    mouseLastSelectionAreaExtendingDragActiveTitleText: string | undefined;
    /** Allows rectangle selections with more than one cell and/or multiple rectangle selections.  If false, then only focused cell is selected */
    mouseAddToggleExtendSelectionAreaEnabled: boolean;
    mouseAddToggleExtendSelectionAreaDragModifierKey: RevModifierKey | undefined;
    /** Enables column selections with mouse */
    mouseColumnSelectionEnabled: boolean;
    mouseColumnSelectionModifierKey: RevModifierKey | undefined;
    /** Enables row selections with mouse */
    mouseRowSelectionEnabled: boolean;
    mouseRowSelectionModifierKey: RevModifierKey | undefined;
    /** Allow multiple cell region selections. */
    multipleSelectionAreas: boolean;
    /** The area type that is added to a selection by default in a UI operation. Can also be specified in API calls which add an area to a RevSelection. */
    primarySelectionAreaType: RevSelectionAreaType;
    /** The minimum time interval (in milliseconds) between call requestAnimationFrame to paint grid. Set low value for minimum latency. Set high value to reduce resource usage.*/
    minimumAnimateTimeInterval: number;
    /** Specifies the interval (in milliseconds) between regular calls of requestAnimationFrame to paint grid. Set to undefined for no regular calls of requestAnimationFrame.
     * This is normally not required (undefined) as the grid will automatically detect when a repaint and automatically immediately initiate a repaint.  However this can be used to force continuous
     * repaints (set to 0) for debugging purpose. It can also be used when data server invalidate callbacks to grid do not notify all data changes and repaints should be triggered by polling.
    */
    backgroundAnimateTimeInterval: number | undefined;
    resizeColumnInPlace: boolean;
    /** Reduce resize processing even more by increasing debounce when lots of resize observer call backs are occurring */
    resizedEventDebounceExtendedWhenPossible: boolean;
    /** Reduce resize processing with debounce.  In milliseconds */
    resizedEventDebounceInterval: number;
    /** On mouse hover, whether to repaint the row background and how. */
    rowResize: boolean;
    /** Repeating pattern of property overrides for grid rows. */
    rowStripeBackgroundColor: RevOnlyGridSettings.Color | undefined;
    /** Height or width (depending on orientation) in either pixels (px) or Em (em) */
    scrollerThickness: string; // size with units
    scrollerThumbColor: string;
    scrollerThumbReducedVisibilityOpacity: number;
    /** Anchor column does not need to align with edge of grid */
    scrollHorizontallySmoothly: boolean;
    scrollingEnabled: boolean;
    /** The alternative area type that can be added to a selection in a UI operation. Can also be specified in API calls which add an area to a RevSelection. */
    secondarySelectionAreaTypeSpecifierModifierKey: RevModifierKey | undefined;
    secondarySelectionAreaType: RevSelectionAreaType;
    /** Stroke color for last selection overlay. */
    selectionRegionOutlineColor: RevOnlyGridSettings.Color | undefined;
    /** Fill color for last selection overlay. */
    selectionRegionOverlayColor: RevOnlyGridSettings.Color | undefined;
    showFilterRow: boolean;
    showScrollerThumbOnMouseMoveModifierKey: RevModifierKey | undefined;
    /** Sort column on double-click rather than single-click. */
    sortOnDoubleClick: boolean;
    /** Column can be sorted with mouse click on column header */
    sortOnClick: boolean;
    useHiDPI: boolean;
    /** Color of vertical grid lines. */
    verticalGridLinesColor: RevOnlyGridSettings.Color;
    verticalGridLinesVisible: boolean;
    /** Thickness of vertical grid lines (pixels). */
    verticalGridLinesWidth: number;
    visibleColumnWidthAdjust: boolean;
    visibleVerticalGridLinesDrawnInFixedAndPreMainOnly: boolean;
    wheelHFactor: number;
    wheelVFactor: number;
}

/** @public */
export namespace RevOnlyGridSettings {
    export type Color = string;
}
