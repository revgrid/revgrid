import { ModifierKeyEnum } from '../../types-utils/modifier-key';
import { HorizontalWheelScrollingAllowed, SelectionAreaType } from '../../types-utils/types';

/** @public */
export interface OnlyGridSettings {
    /** Modifier key that indicates a UI action should add a selection area to selection or toggle a selection area within a selection */
    addToggleSelectionAreaModifierKey: ModifierKeyEnum;
    /** Specifies whether the addToggleSelectionAreaModifierKey toggles.  If if does not toggle, then it adds */
    addToggleSelectionAreaModifierKeyDoesToggle: boolean;
    backgroundColor: OnlyGridSettings.Color;
    color: OnlyGridSettings.Color;
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
    enableContinuousRepaint: boolean;
    /** Modifier key that indicates a UI action should extend the selection area */
    extendLastSelectionAreaModifierKey: ModifierKeyEnum;
    /** Whether grid events are dispatched as DOM events */
    eventDispatchEnabled: boolean;
    /** Validation failure feedback. */
    filterable: boolean;
    filterBackgroundColor: OnlyGridSettings.Color;
    filterBackgroundSelectionColor: OnlyGridSettings.Color;
    filterColor: OnlyGridSettings.Color;
    filterEditor: string;
    filterFont: string;
    filterForegroundSelectionColor: OnlyGridSettings.Color;
    filterCellPainter: string;

    fixedColumnCount: number;
    /**
     * Define this property to style rule lines between fixed & scolling rows differently from {@link module:defaults.gridLinesHColor}.
     */
    horizontalFixedLineColor: OnlyGridSettings.Color;
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
    verticalFixedLineColor: OnlyGridSettings.Color;
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
    verticalGridLinesVisible: boolean;
    /** Color of horizontal grid lines. */
    horizontalGridLinesColor: OnlyGridSettings.Color;
    /** Thickness of horizontal grid lines (pixels). */
    horizontalGridLinesWidth: number;
    horizontalGridLinesVisible: boolean;
    /** Color of vertical grid lines. */
    verticalGridLinesColor: OnlyGridSettings.Color;
    /** Thickness of vertical grid lines (pixels). */
    verticalGridLinesWidth: number;
    horizontalWheelScrollingAllowed: HorizontalWheelScrollingAllowed;
    horizontalScrollbarClassPrefix: string;
    minimumColumnWidth: number;
    maximumColumnWidth: number | undefined;
    visibleColumnWidthAdjust: boolean;
    /** Clicking in a cell "selects" it; it is added to the select region and repainted with "cell selection" colors. */
    mouseRectangleSelection: boolean;
    /** Clicking in a column header (top row) "selects" the column; the entire column is added to the select region and repainted with "column selection" colors. */
    mouseColumnSelection: boolean;
    /** Clicking in a row header (leftmost column) "selects" the row; the entire row is added to the select region and repainted with "row selection" colors. */
    mouseRowSelection: boolean;
    /** Allow multiple cell region selections. */
    multipleSelectionAreas: boolean;
    /** The area type that is added to a selection by default in a UI operation. Can also be specified in API calls which add an area to a Selection. */
    primarySelectionAreaType: SelectionAreaType;
    /**
     * Normally multiple calls to {@link Hypergrid#repaint grid.repaint()}, {@link Hypergrid#reindex grid.reindex()}, {@link Hypergrid#behaviorShapeChanged grid.behaviorShapeChanged()}, and/or {@link Hypergrid#behaviorStateChanged grid.behaviorStateChanged()} defer their actions until just before the next scheduled render. For debugging purposes, set `repaintImmediately` to truthy to carry out these actions immediately while leaving the paint loop running for when you resume execution. Alternatively, call {@link Canvas#stopPaintLoop grid.canvas.stopPaintLoop()}. Caveat: Both these modes are for debugging purposes only and may not render the grid perfectly for all interactions.
     */
    repaintImmediately: boolean;
    repaintFramesPerSecond: number;
    resizeColumnInPlace: boolean;
    /** Reduce resize processing even more by increasing debounce when lots of resize observer call backs are occurring */
    resizedEventDebounceExtendedWhenPossible: boolean;
    /** Reduce resize processing with debounce.  In milliseconds */
    resizedEventDebounceInterval: number;
    /** On mouse hover, whether to repaint the row background and how. */
    rowResize: boolean;
    /** Repeating pattern of property overrides for grid rows. */
    rowStripeBackgroundColor: OnlyGridSettings.Color | undefined;
    scrollerThumbColor: string;
    scrollerThumbReducedVisibilityOpacity: number;
        // thumb.style.backgroundColor = this._onlyGridSettings.scrollerThumbColor;
        // thumb.style.opacity = this._onlyGridSettings.scrollerThumbReducedVisibilityOpacity.toString(10);
    /** Anchor column does not need to align with edge of grid */
    scrollHorizontallySmoothly: boolean;
    scrollingEnabled: boolean;
    /** The alternative area type that can be added to a selection in a UI operation. Can also be specified in API calls which add an area to a Selection. */
    secondarySelectionAreaTypeSpecifierModifierKey: ModifierKeyEnum | undefined;
    secondarySelectionAreaType: SelectionAreaType;
    /** Cursor to appear when extending a selection with a mouse drag */
    selectionExtendDragActiveCursorName: string | undefined;
    selectionExtendDragActiveTitleText: string | undefined;
    /** Stroke color for last selection overlay. */
    selectionRegionOutlineColor: OnlyGridSettings.Color;
    /** Fill color for last selection overlay. */
    selectionRegionOverlayColor: OnlyGridSettings.Color;
    showFilterRow: boolean;
    showScrollerThumbOnMouseMoveModifierKey: ModifierKeyEnum | undefined;
    /** Sort column on double-click rather than single-click. */
    sortOnDoubleClick: boolean;
    /** Column can be sorted with mouse click on column header */
    sortOnClick: boolean;
    useHiDPI: boolean;
    verticalScrollbarClassPrefix: string;
    wheelHFactor: number;
    wheelVFactor: number;
}

/** @public */
export namespace OnlyGridSettings {
    export type Color = string;
}