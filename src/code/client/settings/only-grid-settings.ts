import { RevHorizontalWheelScrollingAllowedId, RevModifierKey, RevRowOrColumnSelectionAreaType, RevSelectionAreaType } from '../../common';

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
    /** Set up a clipping region around each column before painting cells. This will be interpretted differently by grid painters according to their algorithm*/
    columnClip: boolean | undefined;
    columnMoveDragPossibleCursorName: string | undefined;
    columnMoveDragPossibleTitleText: string | undefined;
    /** Cursor to display when moving a column with a mouse drag */
    columnMoveDragActiveCursorName: string | undefined;
    /** Title text of canvas element when moving a column with a mouse drag */
    columnMoveDragActiveTitleText: string | undefined;
    columnResizeDragPossibleCursorName: string | undefined;
    columnResizeDragPossibleTitleText: string | undefined;
    /** Cursor to display when resizing a column with a mouse drag */
    columnResizeDragActiveCursorName: string | undefined;
    /** Title text of canvas element when resizing a column with a mouse drag */
    columnResizeDragActiveTitleText: string | undefined;
    columnSortPossibleCursorName: string | undefined;
    columnSortPossibleTitleText: string | undefined;
    /** Allow user to move columns. */
    columnsReorderable: boolean;
    /** Columns can be hidden when being reordered. */
    columnsReorderableHideable: boolean;
    /** If defined, when new rectangle selection areas are added to a selection, they will be converted to a row or column area type as
     * specified by this setting.  This allows you to restrict selections to rows or columns. */
    switchNewRectangleSelectionToRowOrColumn: RevRowOrColumnSelectionAreaType | undefined;
    defaultRowHeight: number;
    /** Whether to automatically expand column width to accommodate widest rendered value. */
    defaultColumnAutoSizing: boolean;
    /**
     * This default column width is used when `width` property is undefined.
     * (`width` is defined on column creation unless {@link defaultColumnAutoSizing} has been set to `false`.)
     */
    defaultColumnWidth: number;
    /**
     * Default UiController automatically used by program.  Note that order of these in array is important as it
     * defines the order in which UI Events are processed.
     */
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
     * Define this property to style rule lines between fixed & scolling rows differently from {@link horizontalGridLinesColor}.
     */
    horizontalFixedLineColor: RevOnlyGridSettings.Color;
    /**
     * Define this property to render just the edges of the lines between non-scrollable rows & scrollable rows, creating a double-line effect.
     * The value is the thickness of the edges.
     * Undefined means no edge effect
     * Typical definition would be `1` in tandem with setting {@link horizontalFixedLineWidth} to `3`.
     */
    horizontalFixedLineEdgeWidth: number | undefined;
    /**
     * Define this property to style rule lines between non-scrollable rows and scrollable rows differently from {@link horizontalGridLinesWidth}.
     * Undefine it to show normal grid line in that position.
     */
    horizontalFixedLineWidth: number | undefined;
    /**
     * Define this property to style rule lines between fixed & scolling columns differently from {@link verticalGridLinesColor}.
     */
    verticalFixedLineColor: RevOnlyGridSettings.Color;
    /**
     * Define this property to render just the edges of the lines between fixed & scrolling columns, creating a double-line effect.
     * The value is the thickness of the edges.
     * Undefined means no edge effect
     * Typical definition would be `1` in tandem with setting {@link verticalFixedLineWidth} to `3`.
     * {@link verticalFixedLineWidth}
     */
    verticalFixedLineEdgeWidth: number | undefined;
    /**
     * Define this property to style rule lines between non-scrollable columns and scrollable columns differently from {@link verticalGridLinesWidth}.
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
    /** Thickness of horizontal grid lines (pixels). Ignored if {@link horizontalGridLinesVisible} is false */
    horizontalGridLinesWidth: number;
    /** Specifies whether horizontal grid lines are drawn */
    horizontalGridLinesVisible: boolean;
    horizontalWheelScrollingAllowed: RevHorizontalWheelScrollingAllowedId;
    /**
     * Minimum column width.
     * Adjust this value for different fonts/sizes or exotic cell renderers.
     * The default (`5`) is enough room for an ellipsis with default font size.
     */
    minimumColumnWidth: number;
    /**
     * Maximum column width.
     * When defined, column width is clamped to this value.
     * Ignored when falsy.
     * Respects {@link resizeColumnInPlace} but may cause user confusion when
     * user can't make column narrower due to next column having reached its maximum.
     */
    maximumColumnWidth: number | undefined;
    /** Cursor to display when extending a selection with a mouse drag */
    mouseLastSelectionAreaExtendingDragActiveCursorName: string | undefined;
    /** Title text of canvas element when extending a selection with a mouse drag */
    mouseLastSelectionAreaExtendingDragActiveTitleText: string | undefined;
    /** Allows rectangle selections with more than one cell and/or multiple rectangle selections.  If false, then only focused cell is selected */
    mouseAddToggleExtendSelectionAreaEnabled: boolean;
    mouseAddToggleExtendSelectionAreaDragModifierKey: RevModifierKey | undefined;
    /** Enables column selections with mouse */
    mouseColumnSelectionEnabled: boolean;
    mouseColumnSelectionModifierKey: RevModifierKey | undefined;
    /** Enables row selections with mouse
     * @defaultValue true
     */
    mouseRowSelectionEnabled: boolean;
    mouseRowSelectionModifierKey: RevModifierKey | undefined;
    /** Allows multiple areas in a selection. If false, a selection will be cleared when a new area is added. */
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
    secondarySelectionAreaTypeSpecifierModifierKey: RevModifierKey | undefined;
    /** The alternative area type that can be added to a selection in a UI operation. Can also be specified in API calls which add an area to a RevSelection. */
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
    /** Use window.devicePixelRatio to adjust canvas scaling */
    useHiDPI: boolean;
    /** Color of vertical grid lines. */
    verticalGridLinesColor: RevOnlyGridSettings.Color;
    /** Specifies whether vertical grid lines are drawn */
    verticalGridLinesVisible: boolean;
    /** Thickness of vertical grid lines (pixels). Is ignored if {@link verticalGridLinesVisible} is false */
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
