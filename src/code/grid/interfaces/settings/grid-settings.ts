import { ModifierKey, ModifierKeyEnum } from '../../types-utils/modifier-key';
import { UnreachableCaseError } from '../../types-utils/revgrid-error';
import { Halign, HorizontalWheelScrollingAllowed, SelectionAreaType, SelectionAreaTypeSpecifier } from '../../types-utils/types';
import { deepExtendValue } from '../../types-utils/utils';

/** @public */
export interface GridSettings {
    /** Modifier key that indicates a UI action should add a selection area to selection or toggle a selection area within a selection */
    readonly addToggleSelectionAreaModifierKey: ModifierKeyEnum;
    /** Specifies whether the addToggleSelectionAreaModifierKey toggles.  If if does not toggle, then it adds */
    readonly addToggleSelectionAreaModifierKeyDoesToggle: boolean;
    readonly backgroundColor: GridSettings.Color;
    readonly color: GridSettings.Color;
    /** The widest the column will be auto-sized to. */
    readonly columnAutosizingMax: number | undefined;
    /** Set up a clipping region around each column before painting cells. */
    readonly columnClip: boolean | undefined;
    readonly columnMoveDragPossibleCursorName: string | undefined;
    readonly columnMoveDragPossibleTitleText: string | undefined;
    readonly columnMoveDragActiveCursorName: string | undefined;
    readonly columnMoveDragActiveTitleText: string | undefined;
    readonly columnResizeDragPossibleCursorName: string | undefined;
    readonly columnResizeDragPossibleTitleText: string | undefined;
    readonly columnResizeDragActiveCursorName: string | undefined;
    readonly columnResizeDragActiveTitleText: string | undefined;
    readonly columnSortPossibleCursorName: string | undefined;
    readonly columnSortPossibleTitleText: string | undefined;
    /** Allow user to move columns. */
    readonly columnsReorderable: boolean;
    /** Columns can be hidden when being reordered. */
    readonly columnsReorderableHideable: boolean;
    readonly defaultRowHeight: number;
    /** Whether to automatically expand column width to accommodate widest rendered value. */
    readonly defaultColumnAutosizing: boolean;
    readonly defaultColumnWidth: number;
    readonly defaultUiBehaviorTypeNames: string[];
    readonly editable: boolean;
    /** Keyboard event key for editing a cell */
    readonly editKey: string;
    /** Open cell editor for cell when clicked by mouse */
    readonly editOnClick: boolean;
    /** Open cell editor for cell when double clicked by mouse */
    readonly editOnDoubleClick: boolean;
    /** Open cell editor for cell when cell gains focus */
    readonly editOnFocusCell: boolean;
    /** Open cell editor for cell when cell focus and certain keys are pushed down */
    readonly editOnKeyDown: boolean;
    readonly enableContinuousRepaint: boolean;
    /** Modifier key that indicates a UI action should extend the selection area */
    readonly extendLastSelectionAreaModifierKey: ModifierKeyEnum;
    /** Whether grid events are dispatched as DOM events */
    readonly eventDispatchEnabled: boolean;
    /** Validation failure feedback. */
    readonly filterable: boolean;
    readonly filterBackgroundColor: GridSettings.Color;
    readonly filterBackgroundSelectionColor: GridSettings.Color;
    readonly filterColor: GridSettings.Color;
    readonly filterEditor: string;
    readonly filterFont: string;
    readonly filterForegroundSelectionColor: GridSettings.Color;
    readonly filterHalign: Halign;
    readonly filterCellPainter: string;

    readonly fixedColumnCount: number;
    /**
     * Define this property to style rule lines between fixed & scolling rows differently from {@link module:defaults.gridLinesHColor}.
     */
    readonly horizontalFixedLineColor: GridSettings.Color;
    /**
     * Define this property to render just the edges of the lines between non-scrollable rows & scrollable rows, creating a double-line effect.
     * The value is the thickness of the edges.
     * Undefined means no edge effect
     * Typical definition would be `1` in tandem with setting {@link module:defaults.fixedLinesHWidth fixedLinesHWidth} to `3`.
     */
    readonly horizontalFixedLineEdgeWidth: number | undefined;
    /**
     * Define this property to style rule lines between non-scrollable rows and scrollable rows differently from {@link module:defaults.gridLinesHWidth gridLinesHWidth}.
     * Undefine it to show normal grid line in that position.
     */
    readonly horizontalFixedLineWidth: number | undefined;
    /**
     * Define this property to style rule lines between fixed & scolling columns differently from {@link module:defaults.gridLinesVColor}.
     */
    readonly verticalFixedLineColor: GridSettings.Color;
    /**
     * Define this property to render just the edges of the lines between fixed & scrolling columns, creating a double-line effect.
     * The value is the thickness of the edges.
     * Undefined means no edge effect
     * Typical definition would be `1` in tandem with setting {@link module:defaults.fixedLinesVWidth fixedLinesVWidth} to `3`.
     * {@link module:defaults.fixedLinesVWidth}
     */
    readonly verticalFixedLineEdgeWidth: number | undefined;
    /**
     * Define this property to style rule lines between non-scrollable columns and scrollable columns differently from {@link module:defaults.gridLinesVWidth gridLinesVWidth}.
     * Undefine it to show normal grid line in that position.
     */
    readonly verticalFixedLineWidth: number | undefined;
    readonly fixedRowCount: number;
    /**
     * Instead of visible columns starting from left side of canvas, they end at the right side of canvas
     * So last column is always visible and the first one visible is dependent on the width of the canvas
     */
    readonly gridRightAligned: boolean;
    readonly verticalGridLinesVisible: boolean;
    /** Enable rendering of horizontal grid lines. */
    readonly horizontalGridLinesEnabled: boolean;
    /** Color of horizontal grid lines. */
    readonly horizontalGridLinesColor: GridSettings.Color;
    /** Thickness of horizontal grid lines (pixels). */
    readonly horizontalGridLinesWidth: number;
    readonly horizontalGridLinesVisible: boolean;
    /** Enable rendering of vertical grid lines. */
    readonly verticalGridLinesEnabled: boolean;
    /** Color of vertical grid lines. */
    readonly verticalGridLinesColor: GridSettings.Color;
    /** Thickness of vertical grid lines (pixels). */
    readonly verticalGridLinesWidth: number;
    readonly horizontalWheelScrollingAllowed: HorizontalWheelScrollingAllowed;
    readonly horizontalScrollbarClassPrefix: string;
    readonly minimumColumnWidth: number;
    readonly maximumColumnWidth: number | undefined;
    readonly visibleColumnWidthAdjust: boolean;
    /** Clicking in a cell "selects" it; it is added to the select region and repainted with "cell selection" colors. */
    readonly mouseRectangleSelection: boolean;
    /** Clicking in a column header (top row) "selects" the column; the entire column is added to the select region and repainted with "column selection" colors. */
    readonly mouseColumnSelection: boolean;
    /** Clicking in a row header (leftmost column) "selects" the row; the entire row is added to the select region and repainted with "row selection" colors. */
    readonly mouseRowSelection: boolean;
    /** Allow multiple cell region selections. */
    readonly multipleSelectionAreas: boolean;
    /** The area type that is added to a selection by default in a UI operation. Can also be specified in API calls which add an area to a Selection. */
    readonly primarySelectionAreaType: SelectionAreaType;
    /**
     * Normally multiple calls to {@link Hypergrid#repaint grid.repaint()}, {@link Hypergrid#reindex grid.reindex()}, {@link Hypergrid#behaviorShapeChanged grid.behaviorShapeChanged()}, and/or {@link Hypergrid#behaviorStateChanged grid.behaviorStateChanged()} defer their actions until just before the next scheduled render. For debugging purposes, set `repaintImmediately` to truthy to carry out these actions immediately while leaving the paint loop running for when you resume execution. Alternatively, call {@link Canvas#stopPaintLoop grid.canvas.stopPaintLoop()}. Caveat: Both these modes are for debugging purposes only and may not render the grid perfectly for all interactions.
     */
    readonly repaintImmediately: boolean;
    readonly repaintFramesPerSecond: number;
    readonly resizeColumnInPlace: boolean;
    /** Reduce resize processing even more by increasing debounce when lots of resize observer call backs are occurring */
    readonly resizedEventDebounceExtendedWhenPossible: boolean;
    /** Reduce resize processing with debounce.  In milliseconds */
    readonly resizedEventDebounceInterval: number;
    /** On mouse hover, whether to repaint the row background and how. */
    readonly rowResize: boolean;
    /** Repeating pattern of property overrides for grid rows. */
    readonly rowStripes: GridSettings.RowStripe[] | undefined;
    readonly scrollerThumbColor: string;
    readonly scrollerThumbReducedVisibilityOpacity: number;
        // thumb.style.backgroundColor = this._gridSettings.scrollerThumbColor;
        // thumb.style.opacity = this._gridSettings.scrollerThumbReducedVisibilityOpacity.toString(10);
    /** Anchor column does not need to align with edge of grid */
    readonly scrollHorizontallySmoothly: boolean;
    readonly scrollingEnabled: boolean;
    /** The alternative area type that can be added to a selection in a UI operation. Can also be specified in API calls which add an area to a Selection. */
    readonly secondarySelectionAreaTypeSpecifierModifierKey: ModifierKeyEnum | undefined;
    readonly secondarySelectionAreaType: SelectionAreaType;
    /** Cursor to appear when extending a selection with a mouse drag */
    readonly selectionExtendDragActiveCursorName: string | undefined;
    readonly selectionExtendDragActiveTitleText: string | undefined;
    /** Stroke color for last selection overlay. */
    readonly selectionRegionOutlineColor: GridSettings.Color;
    /** Fill color for last selection overlay. */
    readonly selectionRegionOverlayColor: GridSettings.Color;
    readonly showFilterRow: boolean;
    /** Sort column on double-click rather than single-click. */
    readonly sortOnDoubleClick: boolean;
    /** Column can be sorted with mouse click on column header */
    readonly sortOnClick: boolean;
    readonly useHiDPI: boolean;
    readonly verticalScrollbarClassPrefix: string;
    readonly wheelHFactor: number;
    readonly wheelVFactor: number;
}

/** @public */
export namespace GridSettings {
    export type Color = /* CanvasGradient | CanvasPattern |*/ string;

    export type FeedbackEffect = string;

    export interface RowStripe {
        backgroundColor?: string;
    }

    // interface Base {
    //     bb: boolean;
    //     bs: string;
    // }

    // const defaultBase: Base = {
    //     bb: true,
    //     bs: 's',
    // }

    // type BaseIdInfos = { [key in keyof Base]: Info };
    // const baseIdInfos: BaseIdInfos = {
    //     bb: { id: 'bb' },
    //     bs: { id: 'bs' },
    // }


    // interface Ex extends Base {
    //     ds: string;
    //     dn: number;
    // }

    // type GetBase<D> = { [key in keyof D]: D[key] }


    // const defaultEx: Ex = {
    //     ds: 'e',
    //     dn: 5,
    // };

    // type ExIdInfos = { [key in keyof Ex]: Info };
    // const exIdInfos: ExIdInfos = {
    //     ds: { id: 'ds' },
    //     dn: { id: 'dn' }
    // }

    // type ExToBase = { [key in keyof Ex]: keyof Base };
    // const exToBase: ExToBase = {
    //     'dn': 'bb',
    //     'ds': 'bs',
    // };

    // interface Not {
    //     nd: Date;
    //     ns: string;
    // }

    // interface Info {
    //     readonly id: keyof OnlyEx;
    // }

    // type OnlyEx = Base & Ex;
    // type OnlyExId = keyof OnlyEx;

    // // type IdInfo<T> = { [key in keyof (Base | Ex)]: Info };

    // type IdInfos = { [key in OnlyExId]: Info };
    // const idInfos: IdInfos = {
    //     ...baseIdInfos,
    //     ...exIdInfos,
    // };

    // const defaults: Base & Ex = {
    //     ...defaultBase,
    //     ...defaultEx,
    // }


    // const xx = defaultBase[exToBase['ds']];

    // type ResolvedDefaults = {[ key in keyof Ex]: ExToBase[key]};

    // const x = defaults.bs === 'x'

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
