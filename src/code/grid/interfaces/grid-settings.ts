import { ModifierKey, ModifierKeyEnum } from '../lib/html-types';
import { SelectionArea } from '../lib/selection-area';
import { Halign, HorizontalWheelScrollingAllowed, TextTruncateType } from '../lib/types';
import { deepExtendValue } from '../lib/utils';

/** @public */
export interface GridSettings {
    /** Modifier key that indicates a UI action should add a selection area to selection or toggle a selection area within a selection */
    addToggleSelectionAreaModifierKey: ModifierKeyEnum;
    /** Specifies whether the addToggleSelectionAreaModifierKey toggles.  If if does not toggle, then it adds */
    addToggleSelectionAreaModifierKeyDoesToggle: boolean;
    /** Select cell's entire column. */
    autoSelectColumns: boolean;
    /** Select cell's entire row. */
    autoSelectRows: boolean;
    backgroundColor: GridSettings.Color;
    backgroundColor2: GridSettings.Color;
    backgroundSelectionColor: GridSettings.Color;
    cellPadding: number;
    checkboxOnlyRowSelections: boolean;
    color: GridSettings.Color;
    /** Whether the column is auto-sized */
    columnAutosized: boolean;
    /** Whether to automatically expand column width to accommodate widest rendered value. */
    columnAutosizing: boolean;
    /** The widest the column will be auto-sized to. */
    columnAutosizingMax: number;
    /** Set up a clipping region around each column before painting cells. */
    columnClip: boolean | undefined;
    /** Column grab within this number of pixels from top of cell. */
    columnGrabMargin: number;
    columnHeaderBackgroundColor: GridSettings.Color;
    columnHeaderBackgroundSelectionColor: GridSettings.Color;
    columnHeaderColor: GridSettings.Color;
    columnHeaderFont: string;
    columnHeaderForegroundSelectionColor: GridSettings.Color;
    columnHeaderForegroundSelectionFont: string;
    columnHeaderFormat: string;
    columnHeaderHalign: Halign;
    columnHeaderCellPainter: string;
    /** Active column indices */
    columnIndexes: number[];
    /** Allow user to move columns. */
    columnsReorderable: boolean;
    /** Columns can be hidden when being reordered. */
    columnsReorderableHideable: boolean;
    defaultRowHeight: number;
    defaultColumnWidth: number;
    editable: boolean;
    /** Edit cell on double-click rather than single-click. */
    editOnDoubleClick: boolean;
    editOnKeydown: boolean;
    /** Keyboard event key for editing a cell */
    editKey: string;
    /** Open cell editor when cell selected via keyboard navigation. */
    editOnFocusCell: boolean;
    /** Name of a cell editor. */
    editor: string | undefined;
    // /** Emit events arising from SchemaModel and DataModel callbacks */
    // emitModelEvents: boolean;
    /** @summary Re-render grid at maximum speed.
     * @desc In this mode:
     * * The "dirty" flag, set by calling `grid.repaint()`, is ignored.
     * * `grid.getCanvas().currentFPS` is a measure of the number times the grid is being re-rendered each second.
     * * The Hypergrid renderer gobbles up CPU time even when the grid appears idle (the very scenario `repaint()` is designed to avoid). For this reason, we emphatically advise against shipping applications using this mode.
     */
    enableContinuousRepaint: boolean;
    /** Modifier key that indicates a UI action should extend the selection area */
    extendLastSelectionAreaModifierKey: ModifierKeyEnum;
    features: string[];
    /** Validation failure feedback. */
    feedbackCount: number;
    feedbackEffect: GridSettings.FeedbackEffect;
    fetchSubregions: boolean;
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
    fixedLinesHColor: GridSettings.Color;
    /**
     * Define this property to render just the edges of the lines between non-scrollable rows & scrollable rows, creating a double-line effect.
     * The value is the thickness of the edges.
     * Undefined means no edge effect
     * Typical definition would be `1` in tandem with setting {@link module:defaults.fixedLinesHWidth fixedLinesHWidth} to `3`.
     */
    fixedLinesHEdge: number | undefined;
    /**
     * Define this property to style rule lines between non-scrollable rows and scrollable rows differently from {@link module:defaults.gridLinesHWidth gridLinesHWidth}.
     * Undefine it to show normal grid line in that position.
     */
    fixedLinesHWidth: number | undefined;
    /**
     * Define this property to style rule lines between fixed & scolling columns differently from {@link module:defaults.gridLinesVColor}.
     */
    fixedLinesVColor: GridSettings.Color;
    /**
     * Define this property to render just the edges of the lines between fixed & scrolling columns, creating a double-line effect.
     * The value is the thickness of the edges.
     * Undefined means no edge effect
     * Typical definition would be `1` in tandem with setting {@link module:defaults.fixedLinesVWidth fixedLinesVWidth} to `3`.
     * {@link module:defaults.fixedLinesVWidth}
     */
    fixedLinesVEdge: number | undefined;
    /**
     * Define this property to style rule lines between non-scrollable columns and scrollable columns differently from {@link module:defaults.gridLinesVWidth gridLinesVWidth}.
     * Undefine it to show normal grid line in that position.
     */
    fixedLinesVWidth: number | undefined;
    fixedRowCount: number;
    focusedCellBorderColor: GridSettings.Color;
    font: string;
    foregroundSelectionColor: GridSettings.Color;
    foregroundSelectionFont: string;
    /** Name of a formatter for cell text. */
    format: string | undefined;
    /**
     * Instead of visible columns starting from left side of canvas, they end at the right side of canvas
     * So last column is always visible and the first one visible is dependent on the width of the canvas
     */
    gridRightAligned: boolean;
    gridBorder: boolean | string;
    gridBorderBottom: boolean | string;
    gridBorderLeft: boolean | string;
    gridBorderRight: boolean | string;
    gridBorderTop: boolean | string;
    gridLinesColumnHeader: boolean;
    gridLinesH: boolean;
    gridLinesHColor: GridSettings.Color;
    gridLinesHWidth: number;
    gridLinesUserDataArea: boolean;
    gridLinesV: boolean;
    gridLinesVColor: GridSettings.Color;
    gridLinesVWidth: number;
    /** The cell's horizontal alignment, as interpreted by the cell renderer */
    halign: Halign;
    headerify: string;
    /** Whether text in header cells is wrapped. */
    headerTextWrapping: boolean;
    horizontalWheelScrollingAllowed: HorizontalWheelScrollingAllowed;
    /** On mouse hover, whether to repaint the cell background and how. */
    hoverCellHighlight: GridSettings.HoverColors;
    /** On mouse hover, whether to repaint the column background and how. */
    hoverColumnHighlight: GridSettings.HoverColors;
    /** On mouse hover, whether to repaint the row background and how. */
    hoverRowHighlight: GridSettings.HoverColors;
    hScrollbarClassPrefix: string,
    lineColor: GridSettings.Color;
    lineWidth: number;
    /** Display cell value as a link (with underline). */
    link: false | string | GridSettings.LinkProp | GridSettings.LinkFunction;
    /** Color for link. */
    linkColor: GridSettings.Color;
    /** Color link on hover only. */
    linkColorOnHover: boolean;
    /** Underline link on hover only. */
    linkOnHover: boolean;
    /** The window (or tab) in which to open the link. */
    linkTarget: string;
    /** Color for visited link. */
    linkVisitedColor: GridSettings.Color;
    /** The maximum number of columns that may participate in a multi-column sort (via ctrl-click headers). */
    maxSortColumns: number;
    minimumColumnWidth: number;
    maximumColumnWidth: number | undefined;
    visibleColumnWidthAdjust: boolean;
    /** Clicking in a cell "selects" it; it is added to the select region and repainted with "cell selection" colors. */
    mouseCellSelection: boolean;
    /** Clicking in a column header (top row) "selects" the column; the entire column is added to the select region and repainted with "column selection" colors. */
    mouseColumnSelection: boolean;
    /** Clicking in a row header (leftmost column) "selects" the row; the entire row is added to the select region and repainted with "row selection" colors. */
    mouseRowSelection: boolean;
    /** Allow multiple cell region selections. */
    multipleSelectionAreas: boolean;
    /** Mappings for cell navigation keys. */
    navKeyMap: GridSettings.NavKeyMap;
    noDataMessage: string;
    /** The area type that is added to a selection by default in a UI operation. Can also be specified in API calls which add an area to a Selection. */
    primarySelectionAreaType: SelectionArea.Type;
    // propClassLayers: GridSettings.propClassEnum;
    readOnly: boolean;
    /** Name of cell renderer. */
    cellPainter: string;
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
    /** Restore column selections across data transformations (`reindex` calls). */
    restoreColumnSelections: boolean;
    /** Restore row selections across data transformations (`reindex` calls). */
    restoreRowSelections: boolean;
    /** Restore single cell selection across data transformations (`reindex` calls). Takes priority over restoreColumnSelections and restoreRowSelections. */
    restoreSingleCellSelection: boolean;
    rowResize: boolean;
    /** Repeating pattern of property overrides for grid rows. */
    rowStripes: GridSettings.RowStripe[] | undefined;
    /** Anchor column does not need to align with edge of grid */
    scrollHorizontallySmoothly: boolean;
    scrollbarHoverOver: string,
    scrollbarHoverOff: string,
    scrollingEnabled: boolean,
    /** The alternative area type that can be added to a selection in a UI operation. Can also be specified in API calls which add an area to a Selection. */
    secondarySelectionAreaType: SelectionArea.Type;
    secondarySelectionAreaTypeSpecifierModifierKey: ModifierKeyEnum;
    /** Stroke color for last selection overlay. */
    selectionRegionOutlineColor: GridSettings.Color;
    /** Fill color for last selection overlay. */
    selectionRegionOverlayColor: GridSettings.Color;
    settingState?: boolean;
    singleRowSelectionMode: boolean;
    showFilterRow: boolean;
    /** Sort column on double-click rather than single-click. */
    sortOnDoubleClick: boolean;
    /** Column(s) participating and subsequently hidden still affect sort. */
    sortOnHiddenColumns: boolean;
    /** Display cell font with strike-through line drawn over it. */
    strikeThrough: boolean;
    themeName: string;
    /** How to truncate text. */
    textTruncateType: TextTruncateType | undefined;
    sortable: boolean;
    useBitBlit: boolean;
    useHiDPI: boolean;
    voffset: number;
    vScrollbarClassPrefix: string;
    wheelHFactor: number;
    wheelVFactor: number;
    /** The default width of a column */
    width: number;
}

/** @public */
export namespace GridSettings {
    export type Color = /* CanvasGradient | CanvasPattern |*/ string;

    export const enum propClassEnum {
        COLUMNS = 1,
        STRIPES = 2,
        ROWS = 3,
        CELLS= 4
    }

    export const propClassLayersMap = {
        DEFAULT: [propClassEnum.COLUMNS, propClassEnum.STRIPES, propClassEnum.ROWS, propClassEnum.CELLS],
        NO_ROWS: [propClassEnum.COLUMNS, propClassEnum.CELLS]
    }

    export interface HoverColors {
        /** `false` means not hilite on hover */
        enabled?: boolean;
        /** cell, row, or column background color. Alpha channel will be respected and if given will be painted over the cells predetermined color. */
        backgroundColor?: string;
        // @property {cssColor} [header.backgroundColor=backgroundColor] - for columns and rows, this is the background color of the column or row "handle" (header rows or columns, respectively). (Not used for cells.)
        header?: HoverColors.Header;
    }

    export namespace HoverColors {
        export interface Header {
            backgroundColor: string;
        }
    }

    export type FeedbackEffect = string;

    export type LinkFunction = (this: void, cellEvent: unknown) => string;
    export type LinkProp = [url: string, target: string];

    export interface RowStripe {
        backgroundColor?: string;
    }

    /**
     * @summary Mappings for cell navigation keys.
     * @desc Cell navigation is handled in the {@link CellSelection} "feature".
     * This property gives you control over which key presses the built-in mechanism will respond to.
     *
     * (If this built-in cell selection logic is insufficient for your needs, you can also listen for
     * the various "fin-key" events and carry out more complex operations in your listeners.)
     *
     * The key press names used here are defined in Canvas.js.
     * Note that all key presses actually have two names, a normal name and a shifted name.
     * The latter name is used when **shift** is depressed.
     *
     * The built-in nav key presses are as follows:
     * * **`UP`** _(up-arrow key)_ - Replace all selections with a single cell, one row up from the last selection.
     * * **`DOWN`** _(down-arrow key)_ - Replace all selections with a single cell, one row down from the last selection.
     * * **`LEFT`** _(left-arrow key)_ - Replace all selections with a single cell, one column to the left of the last selection.
     * * **`RIGHT`** _(right-arrow key)_ - Replace all selections with a single cell, one column to the right of the last selection.
     * * **`UPSHIFT`** _(shift + up-arrow)_ - Extend the last selection up one row.
     * * **`DOWNSHIFT`** _(shift + down-arrow)_ - Extend the last selection down one row.
     * * **`LEFTSHIFT`** _(shift + left-arrow)_ - Extend the last selection left one column.
     * * **`RIGHTSHIFT`** _(shift + right-arrow)_ - Extend the last selection right one column.
     *
     * To alter these or add other mappings see the examples below.
     *
     * A note regarding the other meta keys (**ctrl**, **option**, and **command**):
     * Although these meta keys can be detected, they do not modify the key names as **shift** does.
     * This is because they are more for system use and generally (with the possibly exception fo **ctrl**) should not
     * be depended upon, as system functions will take priority and your app will never see these key presses.
     *
     * A special accommodation has been made to the {@link module:defaults.editOnKeydown|editOnKeydown} property:
     * * If `editOnKeydown` truthy AND mapped character is an actual (non-white-space) character, as opposed to (say)
     * **tab** or **return**, then navigation requires the **ctrl** key to distinguish between nav and data.
     * * If `editOnKeydown` falsy, the **ctrl** key is ignored.
     *
     * So if (say) `a` is mapped to `LEFT` as in the last example below, if `editOnKeydown` is ON, then `a` (without
     * **ctrl**) would start editing the cell but **ctrl** + `a` would move the selection one column to the left.
     *
     * @example
     * // To void the above build-ins:
     * navKeyMap: {
     *     UP: undefined,
     *     UPSHIFT: undefined,
     *     DOWN: undefined,
     *     ...
     * }
     *
     * @example
     * // To map alternative nav key presses to RETURN and TAB (default mapping):
     * navKeyMap: {
     *     RETURN: 'DOWN',
     *     RETURNSHIFT: 'UP',
     *     TAB: 'RIGHT',
     *     TABSHIFT: 'LEFT'
     * }
     *
     * @example
     * // To map alternative nav key presses to a/w/d/s and extend select to A/W/D/S:
     * navKeyMap: {
     *     a: 'LEFT', A: 'LEFTSHIFT',
     *     w: 'UP', W: 'UPSHIFT',
     *     s: 'DOWN', S: 'DOWNSHIFT',
     *     d: 'RIGHT', D: 'RIGHTSHIFT'
     * }
     */

    export type NavType = 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'PAGELEFT' | 'PAGERIGHT' | 'PAGEUP' | 'PAGEDOWN';
    export type NavKeyMap = Record<string, NavType>;

    /**
     * Returns any value of `keyChar` that passes the following logic test:
     * 1. If a non-printable, white-space character, then nav key.
     * 2. If not (i.e., a normal character), can still be a nav key if not editing on key down.
     * 3. If not, can still be a nav key if CTRL key is down.
     *
     * Note: Callers are typcially only interested in the following values of `keyChar` and will ignore all others:
     * * `'LEFT'` and `'LEFTSHIFT'`
     * * `'RIGHT'` and `'RIGHTSHIFT'`
     * * `'UP'` and `'UPSHIFT'`
     * * `'DOWN'` and `'DOWNSHIFT'`
     *
     * @param keyChar - A value from Canvas's `charMap`.
     * @param ctrlKey - The CTRL key was down.
     * @returns `undefined` means not a nav key; otherwise returns `keyChar`.
     */
    // export function navKey(properties: GridProperties, keyChar: string, ctrlKey = false): undefined|string {
    //     if (keyChar.length > 1 || !properties.editOnKeydown || ctrlKey) {
    //         return keyChar; // return the mapped value
    //     } else {
    //         return undefined;
    //     }
    // }

    /**
     * Returns only values of `keyChar` that, when run through {@link module:defaults.navKeyMap|navKeyMap}, pass the {@link module:defaults.navKey|navKey} logic test.
     *
     * @param keyChar - A value from Canvas's `charMap`, to be remapped through {@link module:defaults.navKeyMap|navKeyMap}.
     * @param ctrlKey - The CTRL key was down.
     * @returns `undefined` means not a nav key; otherwise returns `keyChar`.
     */
    /** @internal */
    // export function mappedNavKey(properties: GridProperties, keyChar: string, shiftKey?: boolean, ctrlKey?: boolean): undefined | string {
    //     let navKey = properties.navKeyMap[keyChar];
    //     if (shiftKey) {
    //         navKey += 'SHIFT';
    //     }
    //     return navKey;
    // }

    /** @internal
     * @returns true if any properties changed - otherwise false
     */
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

    export function isAddToggleSelectionAreaModifierKeyDownInKeyboardEvent(gridProperties: GridSettings, keyboardEvent: KeyboardEvent) {
        return ModifierKey.isDownInKeyboardEvent(gridProperties.addToggleSelectionAreaModifierKey, keyboardEvent);
    }

    export function isAddToggleSelectionAreaModifierKeyDownInMouseEvent(gridProperties: GridSettings, mouseEvent: MouseEvent) {
        return ModifierKey.isDownInMouseEvent(gridProperties.addToggleSelectionAreaModifierKey, mouseEvent);
    }

    export function isExtendLastSelectionAreaModifierKeyDownInKeyboardEvent(gridProperties: GridSettings, keyboardEvent: KeyboardEvent) {
        return ModifierKey.isDownInKeyboardEvent(gridProperties.extendLastSelectionAreaModifierKey, keyboardEvent);
    }

    export function isExtendLastSelectionAreaModifierKeyDownInMouseEvent(gridProperties: GridSettings, mouseEvent: MouseEvent) {
        return ModifierKey.isDownInMouseEvent(gridProperties.extendLastSelectionAreaModifierKey, mouseEvent);
    }

    export function isSecondarySelectionAreaTypeSpecifierModifierKeyDownInKeyboardEvent(gridProperties: GridSettings, keyboardEvent: KeyboardEvent) {
        return ModifierKey.isDownInKeyboardEvent(gridProperties.secondarySelectionAreaTypeSpecifierModifierKey, keyboardEvent);
    }

    export function isSecondarySelectionAreaTypeSpecifierModifierKeyDownInMouseEvent(gridProperties: GridSettings, mouseEvent: MouseEvent) {
        return ModifierKey.isDownInMouseEvent(gridProperties.secondarySelectionAreaTypeSpecifierModifierKey, mouseEvent);
    }
}

export interface LoadableGridSettings extends GridSettings {
    loadDefaults(): void;
    merge(properties: Partial<GridSettings>): boolean;
}
