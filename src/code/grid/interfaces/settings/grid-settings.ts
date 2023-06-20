import { ModifierKey, ModifierKeyEnum } from '../../types-utils/modifier-key';
import { UnreachableCaseError } from '../../types-utils/revgrid-error';
import { Halign, HorizontalWheelScrollingAllowed, SelectionAreaType, SelectionAreaTypeSpecifier } from '../../types-utils/types';
import { deepExtendValue } from '../../types-utils/utils';

/** @public */
export interface GridSettings {
    /** Modifier key that indicates a UI action should add a selection area to selection or toggle a selection area within a selection */
    addToggleSelectionAreaModifierKey: ModifierKeyEnum;
    /** Specifies whether the addToggleSelectionAreaModifierKey toggles.  If if does not toggle, then it adds */
    addToggleSelectionAreaModifierKeyDoesToggle: boolean;
    backgroundColor: GridSettings.Color;
    color: GridSettings.Color;
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
    defaultUiBehaviorTypeNames: string[];
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
    filterBackgroundColor: GridSettings.Color;
    filterBackgroundSelectionColor: GridSettings.Color;
    filterColor: GridSettings.Color;
    filterEditor: string;
    filterFont: string;
    filterForegroundSelectionColor: GridSettings.Color;
    filterHalign: Halign;
    filterCellPainter: string;

    fixedColumnCount: number;
    /**
     * Define this property to style rule lines between fixed & scolling rows differently from {@link module:defaults.gridLinesHColor}.
     */
    horizontalFixedLineColor: GridSettings.Color;
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
    verticalFixedLineColor: GridSettings.Color;
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
    horizontalGridLinesColor: GridSettings.Color;
    /** Thickness of horizontal grid lines (pixels). */
    horizontalGridLinesWidth: number;
    horizontalGridLinesVisible: boolean;
    /** Color of vertical grid lines. */
    verticalGridLinesColor: GridSettings.Color;
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
    rowStripes: GridSettings.RowStripe[] | undefined;
    scrollerThumbColor: string;
    scrollerThumbReducedVisibilityOpacity: number;
        // thumb.style.backgroundColor = this._gridSettings.scrollerThumbColor;
        // thumb.style.opacity = this._gridSettings.scrollerThumbReducedVisibilityOpacity.toString(10);
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
    selectionRegionOutlineColor: GridSettings.Color;
    /** Fill color for last selection overlay. */
    selectionRegionOverlayColor: GridSettings.Color;
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
export namespace GridSettings {
    export type Color = string;

    export interface RowStripe {
        backgroundColor?: string;
    }

    export function assign(source: Partial<GridSettings>, target: GridSettings): boolean {
        const sourceKeys = Object.keys(source) as (keyof GridSettings)[];
        if (sourceKeys.length === 0) {
            return false;
        } else {
            for (const key of sourceKeys) {
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    const typedValue = source[key];
                    const value = deepExtendValue({}, typedValue);
                    (target[key] as unknown) = value;
                }
            }
            return true;
        }
    }

    export function isAddToggleSelectionAreaModifierKeyDownInEvent<T extends MouseEvent | KeyboardEvent>(gridSettings: GridSettings, event: T) {
        return ModifierKey.isDownInEvent(gridSettings.addToggleSelectionAreaModifierKey, event);
    }

    export function isExtendLastSelectionAreaModifierKeyDownInEvent<T extends MouseEvent | KeyboardEvent>(gridSettings: GridSettings, event: T) {
        return ModifierKey.isDownInEvent(gridSettings.extendLastSelectionAreaModifierKey, event);
    }

    export function isSecondarySelectionAreaTypeSpecifierModifierKeyDownInEvent<T extends MouseEvent | KeyboardEvent>(gridSettings: GridSettings, event: T) {
        return ModifierKey.isDownInEvent(gridSettings.secondarySelectionAreaTypeSpecifierModifierKey, event);
    }

    export function isShowScrollerThumbOnMouseMoveModifierKeyDownInEvent<T extends MouseEvent | KeyboardEvent>(gridSettings: GridSettings, event: T) {
        return ModifierKey.isDownInEvent(gridSettings.showScrollerThumbOnMouseMoveModifierKey, event);
    }

    export function getSelectionAreaTypeFromEvent<T extends MouseEvent | KeyboardEvent>(gridSettings: GridSettings, event: T) {
        if (ModifierKey.isDownInEvent(gridSettings.secondarySelectionAreaTypeSpecifierModifierKey, event)) {
            return gridSettings.secondarySelectionAreaType;
        } else {
            return gridSettings.primarySelectionAreaType;
        }
    }

    export function getSelectionAreaTypeSpecifierFromEvent<T extends MouseEvent | KeyboardEvent>(gridSettings: GridSettings, event: T) {
        if (GridSettings.isSecondarySelectionAreaTypeSpecifierModifierKeyDownInEvent(gridSettings, event)) {
            return SelectionAreaTypeSpecifier.Secondary;
        } else {
            return SelectionAreaTypeSpecifier.Primary;
        }
    }

    export function isMouseSelectionAllowed(gridSettings: GridSettings, selectionAreaType: SelectionAreaType) {
        switch (selectionAreaType) {
            case SelectionAreaType.Rectangle: return gridSettings.mouseRectangleSelection;
            case SelectionAreaType.Column: return gridSettings.mouseColumnSelection;
            case SelectionAreaType.Row: return gridSettings.mouseRowSelection;
            default:
                throw new UnreachableCaseError('GSIMSA67221', selectionAreaType);
        }
    }
}
