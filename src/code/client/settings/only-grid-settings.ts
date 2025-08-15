import { RevHorizontalWheelScrollingAllowedId, RevModifierKey, RevRowOrColumnSelectionAreaType, RevSelectionAreaType } from '../../common';

/** @public */
export interface RevOnlyGridSettings {
    /** Modifier key that indicates a UI action should add a selection area to selection or toggle a selection area within a selection */
    addToggleSelectionAreaModifierKey: RevModifierKey;
    /** Specifies whether the addToggleSelectionAreaModifierKey toggles.  If if does not toggle, then it adds */
    addToggleSelectionAreaModifierKeyDoesToggle: boolean;
    backgroundColor: RevOnlyGridSettings.Color;
    color: RevOnlyGridSettings.Color;
    /**
     * The widest the column will be auto-sized to.
     * @see [Columns Manager Client Component 🗎](../../../../Architecture/Client/Components/Columns_Manager/)
     */
    columnAutoSizingMax: number | undefined;
    /** Set up a clipping region around each column before painting cells. This will be interpretted differently by grid painters according to their algorithm*/
    columnClip: boolean | undefined;
    /**
     * Cursor to display when current mouse position allows a column to be moved with a mouse drag
     * @see [Mouse Client Component 🗎](../../../../Architecture/Client/Components/Mouse/)
     */
    columnMoveDragPossibleCursorName: string | undefined;
    /**
     * Title text of canvas element when current mouse position allows a column to be moved with a mouse drag
     * @see [Mouse Client Component 🗎](../../../../Architecture/Client/Components/Mouse/)
     */
    columnMoveDragPossibleTitleText: string | undefined;
    /**
     * Cursor to display when moving a column with a mouse drag
     * @see [Mouse Client Component 🗎](../../../../Architecture/Client/Components/Mouse/)
     */
    columnMoveDragActiveCursorName: string | undefined;
    /**
     * Title text of canvas element when moving a column with a mouse drag
     * @see [Mouse Client Component 🗎](../../../../Architecture/Client/Components/Mouse/)
     */
    columnMoveDragActiveTitleText: string | undefined;
    /**
     * Cursor to display when current mouse position allows a column to be resized with a mouse drag
     * @see [Mouse Client Component 🗎](../../../../Architecture/Client/Components/Mouse/)
     */
    columnResizeDragPossibleCursorName: string | undefined;
    /**
     * Title text of canvas element when current mouse position allows a column to be resized with a mouse drag
     * @see [Mouse Client Component 🗎](../../../../Architecture/Client/Components/Mouse/)
     */
    columnResizeDragPossibleTitleText: string | undefined;
    /**
     * Cursor to display when resizing a column with a mouse drag
     * @see [Mouse Client Component 🗎](../../../../Architecture/Client/Components/Mouse/)
     */
    columnResizeDragActiveCursorName: string | undefined;
    /**
     * Title text of canvas element when resizing a column with a mouse drag
     * @see [Mouse Client Component 🗎](../../../../Architecture/Client/Components/Mouse/)
     */
    columnResizeDragActiveTitleText: string | undefined;
    /**
     * Cursor to display when current mouse position allows column sorting with a mouse action
     * @see [Mouse Client Component 🗎](../../../../Architecture/Client/Components/Mouse/)
     */
    columnSortPossibleCursorName: string | undefined;
    /**
     * Title text of canvas element when current mouse position allows column sorting with a mouse action
     * @see [Mouse Client Component 🗎](../../../../Architecture/Client/Components/Mouse/)
     */
    columnSortPossibleTitleText: string | undefined;
    /**
     * Allow user to move columns.
     */
    columnsReorderable: boolean;
    /** Columns can be hidden when being reordered. */
    columnsReorderableHideable: boolean;
    /** If defined, when new rectangle selection areas are added to a selection, they will be converted to a row or column area type as
     * specified by this setting.  This allows you to restrict selections to rows or columns.
     * @see [Selection Client Component 🗎](../../../../Architecture/Client/Components/Selection/)
     */
    switchNewRectangleSelectionToRowOrColumn: RevRowOrColumnSelectionAreaType | undefined;
    defaultRowHeight: number;
    /**
     * Whether to automatically expand column width to accommodate widest rendered value.
     * @see [Columns Manager Client Component 🗎](../../../../Architecture/Client/Components/Columns_Manager/)
     */
    defaultColumnAutoSizing: boolean;
    /**
     * This default column width is used when `width` property is undefined.
     * (`width` is defined on column creation unless {@link defaultColumnAutoSizing} has been set to `false`.)
     * @see [Columns Manager Client Component 🗎](../../../../Architecture/Client/Components/Columns_Manager/)
     */
    defaultColumnWidth: number;
    /**
     * Default UiController automatically used by program.  Note that order of these in array is important as it
     * defines the order in which UI Events are processed.
     */
    defaultUiControllerTypeNames: string[];
    editable: boolean;
    /**
     * Keyboard event key for editing a cell
     * @see [Focus Client Component 🗎](../../../../Architecture/Client/Components/Focus/)
     */
    editKey: string;
    /**
     * Open cell editor for cell when clicked by mouse
     * @see [Focus Client Component 🗎](../../../../Architecture/Client/Components/Focus/)
     */
    editOnClick: boolean;
    /** Open cell editor for cell when double clicked by mouse */
    editOnDoubleClick: boolean;
    /**
     * Open cell editor for cell when cell gains focus
     * @see [Focus Client Component 🗎](../../../../Architecture/Client/Components/Focus/)
     */
    editOnFocusCell: boolean;
    /**
     * Open cell editor for cell when cell focus and certain keys are pushed down
     * @see [Focus Client Component 🗎](../../../../Architecture/Client/Components/Focus/)
     */
    editOnKeyDown: boolean;
    /** Cursor to display when cell can be edited */
    cellEditPossibleCursorName: string | undefined;
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

    /**
     * Number of columns at left of the grid which will not scroll.
     * @see [Columns Manager Client Component 🗎](../../../../Architecture/Client/Components/Columns_Manager/)
     */
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
    /**
     * Number of rows at the top of a scrollable subgrid which will not scroll.
     */
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
     * @see [Columns Manager Client Component 🗎](../../../../Architecture/Client/Components/Columns_Manager/)
     */
    minimumColumnWidth: number;
    /**
     * Maximum column width.
     * When defined, column width is clamped to this value.
     * Ignored when falsy.
     * Respects {@link resizeColumnInPlace} but may cause user confusion when
     * user can't make column narrower due to next column having reached its maximum.
     * @see [Columns Manager Client Component 🗎](../../../../Architecture/Client/Components/Columns_Manager/)
     */
    maximumColumnWidth: number | undefined;
    /**
     * Cursor to display when extending a selection with a mouse drag
     * @see [Mouse Client Component 🗎](../../../../Architecture/Client/Components/Mouse/)
     */
    mouseLastSelectionAreaExtendingDragActiveCursorName: string | undefined;
    /**
     * Title text of canvas element when extending a selection with a mouse drag
     * @see [Mouse Client Component 🗎](../../../../Architecture/Client/Components/Mouse/)
     */
    mouseLastSelectionAreaExtendingDragActiveTitleText: string | undefined;
    /** Allows rectangle selections with more than one cell and/or multiple rectangle selections.  If false, then only focused cell is selected */
    mouseAddToggleExtendSelectionAreaEnabled: boolean;
    mouseAddToggleExtendSelectionAreaDragModifierKey: RevModifierKey | undefined;
    /**
     * Enables column selections with mouse
     * @see [Selection Client Component 🗎](../../../../Architecture/Client/Components/Selection/)
     */
    mouseColumnSelectionEnabled: boolean;
    mouseColumnSelectionModifierKey: RevModifierKey | undefined;
    /** Enables row selections with mouse
     * @defaultValue true
     * @see [Selection Client Component 🗎](../../../../Architecture/Client/Components/Selection/)
     */
    mouseRowSelectionEnabled: boolean;
    mouseRowSelectionModifierKey: RevModifierKey | undefined;
    /**
     * Allows multiple areas in a selection. If false, a selection will be cleared when a new area is added.
     * @see [Selection Client Component 🗎](../../../../Architecture/Client/Components/Selection/)
     */
    multipleSelectionAreas: boolean;
    /**
     * The area type that is added to a selection by default in a UI operation. Can also be specified in API calls which add an area to a RevSelection.
     * @see [Selection Client Component 🗎](../../../../Architecture/Client/Components/Selection/)
     */
    primarySelectionAreaType: RevSelectionAreaType;
    /** The minimum time interval (in milliseconds) between call requestAnimationFrame to paint grid. Set low value for minimum latency. Set high value to reduce resource usage.*/
    minimumAnimateTimeInterval: number;
    /** Specifies the interval (in milliseconds) between regular calls of requestAnimationFrame to paint grid. Set to undefined for no regular calls of requestAnimationFrame.
     * This is normally not required (undefined) as the grid will automatically detect when a repaint and automatically immediately initiate a repaint.  However this can be used to force continuous
     * repaints (set to 0) for debugging purpose. It can also be used when data server invalidate callbacks to grid do not notify all data changes and repaints should be triggered by polling.
    */
    backgroundAnimateTimeInterval: number | undefined;
    resizeColumnInPlace: boolean;
    /**
     * Reduce resize processing even more by increasing debounce when lots of resize observer call backs are occurring
     * @see [Canvas Client Component 🗎](../../../../Architecture/Client/Components/Canvas/)
     */
    resizedEventDebounceExtendedWhenPossible: boolean;
    /**
     * Reduce resize processing with debounce.  In milliseconds
     * @see [Canvas Client Component 🗎](../../../../Architecture/Client/Components/Canvas/)
     */
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
    /**
     * The alternative area type that can be added to a selection in a UI operation. Can also be specified in API calls which add an area to a RevSelection.
     * @see [Selection Client Component 🗎](../../../../Architecture/Client/Components/Selection/)
     */
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
    /**
     * Use window.devicePixelRatio to adjust canvas scaling
     * @see [Canvas Client Component 🗎](../../../../Architecture/Client/Components/Canvas/)
     */
    useHiDPI: boolean;
    /** Color of vertical grid lines. */
    verticalGridLinesColor: RevOnlyGridSettings.Color;
    /** Specifies whether vertical grid lines are drawn */
    verticalGridLinesVisible: boolean;
    /**
     * Thickness of vertical grid lines (pixels). Is ignored if {@link verticalGridLinesVisible} is false
     * @see [Columns Manager Client Component 🗎](../../../../Architecture/Client/Components/Columns_Manager/)
     */
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
