import { Subgrid } from '../behaviors/subgrid';
import { CellEvent } from '../lib/cell-event';
import { DataModel } from '../lib/data-model';
import { Effect } from '../lib/dom/effects';
import { defaults } from './defaults';

export interface HypergridProperties {
    /** Select cell's entire column. */
    autoSelectColumns?: boolean;
    /** Select cell's entire row. */
    autoSelectRows?: boolean;
    backgroundColor?: HypergridProperties.Color;
    backgroundColor2?: HypergridProperties.Color;
    backgroundSelectionColor?: HypergridProperties.Color;
    boxSizing?: string;
    calculators?: HypergridProperties.Calculators;
    cellPadding?: number;
    /** Clicking in a cell "selects" it; it is added to the select region and repainted with "cell selection" colors. */
    cellSelection?: boolean;
    checkboxOnlyRowSelections?: boolean;
    /** Collapse cell selection onto next row selection. */
    collapseCellSelections?: boolean;
    color?: HypergridProperties.Color;
    /** Whether the column is auto-sized */
    columnAutosized?: boolean;
    /** Whether to automatically expand column width to accommodate widest rendered value. */
    columnAutosizing?: boolean;
    /** The widest the column will be auto-sized to. */
    columnAutosizingMax?: number;
    /** Set up a clipping region around each column before painting cells. */
    columnClip?: boolean | null;
    /** Column grab within this number of pixels from top of cell. */
    columnGrabMargin?: number;
    columnHeaderBackgroundColor?: HypergridProperties.Color;
    columnHeaderBackgroundSelectionColor?: HypergridProperties.Color;
    columnHeaderColor?: HypergridProperties.Color;
    columnHeaderFont?: string;
    columnHeaderForegroundSelectionColor?: HypergridProperties.Color;
    columnHeaderForegroundSelectionFont?: string;
    columnHeaderFormat?: string;
    columnHeaderHalign?: HypergridProperties.Halign;
    columnHeaderRenderer?: string;
    /** Active column indices */
    columnIndexes?: number[];
    /** Clicking in a column header (top row) "selects" the column; the entire column is added to the select region and repainted with "column selection" colors. */
    columnSelection?: boolean;
    /** Allow user to move columns. */
    columnsReorderable?: boolean;
    centerIcon?: string;
    defaultRowHeight?: number;
    defaultColumnWidth?: number;
    editable?: boolean;
    /** Edit cell on double-click rather than single-click. */
    editOnDoubleClick?: boolean;
    editOnKeydown?: boolean;
    /** Open cell editor when cell selected via keyboard navigation. */
    editOnNextCell?: boolean;
    /** Name of a cell editor. */
    editor?: string;
    /** Re-render grid at maximum speed. */
    enableContinuousRepaint?: boolean;
    features?: string[];
    /** Validation failure feedback. */
    feedbackCount?: number;
    feedbackEffect?: HypergridProperties.FeedbackEffect;
    fetchSubregions?: boolean;
    filterable?: boolean;
    filterBackgroundColor?: HypergridProperties.Color;
    filterBackgroundSelectionColor?: HypergridProperties.Color;
    filterColor?: HypergridProperties.Color;
    filterEditor?: string;
    filterFont?: string;
    filterForegroundSelectionColor?: HypergridProperties.Color;
    filterHalign?: HypergridProperties.Halign;
    filterRenderer?: string;

    // Tree Header may no longer be relevant
    treeHeaderFont?: string;
    treeHeaderColor?: HypergridProperties.Color;
    treeHeaderBackgroundColor?: HypergridProperties.Color;
    treeHeaderForegroundSelectionColor?: HypergridProperties.Color;
    treeHeaderForegroundSelectionFont?: string;
    treeHeaderBackgroundSelectionColor?: HypergridProperties.Color;

    fixedColumnCount?: number;
    fixedLinesHColor?: HypergridProperties.Color;
    fixedLinesHEdge?: number;
    fixedLinesHWidth?: number;
    fixedLinesVColor?: HypergridProperties.Color;
    fixedLinesVEdge?: number;
    fixedLinesVWidth?: number;
    fixedRowCount?: number;
    font?: string;
    foregroundSelectionColor?: HypergridProperties.Color;
    foregroundSelectionFont?: string;
    /** Name of a formatter for cell text. */
    format?: string;
    gridBorder?: boolean | string;
    gridBorderBottom?: boolean | string;
    gridBorderLeft?: boolean | string;
    gridBorderRight?: boolean | string;
    gridBorderTop?: boolean | string;
    gridLinesColumnHeader?: boolean;
    gridLinesRowHeader?: boolean;
    gridLinesH?: boolean;
    gridLinesHColor?: HypergridProperties.Color;
    gridLinesHWidth?: number;
    gridLinesUserDataArea?: boolean;
    gridLinesV?: boolean;
    gridLinesVColor?: HypergridProperties.Color;
    gridLinesVWidth?: number;
    /** Name of grid renderer. */
    gridRenderer?: string;
    /** The cell's horizontal alignment, as interpreted by the cell renderer */
    halign?: HypergridProperties.Halign;
    headerify?: string;
    /** Whether text in header cells is wrapped. */
    headerTextWrapping?: boolean;
    /** On mouse hover, whether to repaint the cell background and how. */
    hoverCellHighlight?: HypergridProperties.HoverColors;
    /** On mouse hover, whether to repaint the column background and how. */
    hoverColumnHighlight?: HypergridProperties.HoverColors;
    /** On mouse hover, whether to repaint the row background and how. */
    hoverRowHighlight?: HypergridProperties.HoverColors;
    hScrollbarClassPrefix?: string,
    iconPadding?: number;
    leftIcon?: string;
    lineColor?: HypergridProperties.Color;
    lineWidth?: number;
    /** Display cell value as a link (with underline). */
    link?: false | string | HypergridProperties.LinkProp | HypergridProperties.LinkFunction;
    /** Color for link. */
    linkColor?: HypergridProperties.Color;
    /** Color link on hover only. */
    linkColorOnHover?: boolean;
    /** Underline link on hover only. */
    linkOnHover?: boolean;
    /** The window (or tab) in which to open the link. */
    linkTarget?: string;
    /** Color for visited link. */
    linkVisitedColor?: HypergridProperties.Color;
    /** The maximum number of columns that may participate in a multi-column sort (via ctrl-click headers). */
    maxSortColumns?: number;
    minimumColumnWidth?: number;
    maximumColumnWidth?: number;
    /** Allow multiple cell region selections. */
    multipleSelections?: boolean;
    /** Mappings for cell navigation keys. */
    navKeyMap?: HypergridProperties.NavKeyMap;
    noDataMessage?: string;
    // propClassLayers: HypergridProperties.propClassEnum;
    readOnly?: boolean;
    /** Name of cell renderer. */
    renderer?: string;
    /** Set to `true` to render `0` and `false`. Otherwise these value appear as blank cells. */
    renderFalsy?: boolean;
    repaintImmediately?: boolean;
    repaintIntervalRate?: number;
    rightIcon?: string;
    resizeColumnInPlace?: boolean;
    /** Restore column selections across data transformations (`reindex` calls). */
    restoreColumnSelections?: boolean;
    /** Restore row selections across data transformations (`reindex` calls). */
    restoreRowSelections?: boolean;
    rowHeaderBackgroundColor?: HypergridProperties.Color;
    rowHeaderBackgroundSelectionColor?: HypergridProperties.Color;
    rowHeaderCheckboxes?: boolean;
    rowHeaderColor?: HypergridProperties.Color;
    rowHeaderFont?: string;
    rowHeaderForegroundSelectionColor?: HypergridProperties.Color;
    /** Font style for selected rows' headers. */
    rowHeaderForegroundSelectionFont?: string;
    rowHeaderNumbers?: boolean;
    /** Whether to automatically expand row number column width to accommodate widest rendered row number */
    rowNumberAutosizing?: boolean;
    rowResize?: boolean;
    /** Clicking in a row header (leftmost column) "selects" the row; the entire row is added to the select region and repainted with "row selection" colors. */
    rowSelection?: boolean;
    /** Repeating pattern of property overrides for grid rows. */
    rowStripes?: HypergridProperties.RowStripe[];
    scrollbarHoverOver?: string,
    scrollbarHoverOff?: string,
    scrollingEnabled?: boolean,
    /** Stroke color for last selection overlay. */
    selectionRegionOutlineColor?: HypergridProperties.Color;
    /** Fill color for last selection overlay. */
    selectionRegionOverlayColor?: HypergridProperties.Color;
    settingState?: boolean;
    singleRowSelectionMode?: boolean;
    showFilterRow?: boolean;
    showHeaderRow?: boolean;
    showRowNumbers?: boolean;
    showTreeColumn?: boolean;
    /** Sort column on double-click rather than single-click. */
    sortOnDoubleClick?: boolean;
    /** Column(s) participating and subsequently hidden still affect sort. */
    sortOnHiddenColumns?: boolean;
    /** Display cell font with strike-through line drawn over it. */
    strikeThrough?: boolean;
    subgrids?: Subgrid.Spec[];
    themeName?: string;
    /** Whether to automatically expand row number column width to accommodate widest rendered group label. */
    treeColumnAutosizing?: boolean;
    /** The widest the tree column will be auto-sized to. */
    treeColumnAutosizingMax?: number;
    treeRenderer?: string;
    /** How to truncate text. */
    truncateTextWithEllipsis?: boolean | null;
    unsortable?: boolean;
    useBitBlit?: boolean;
    useHiDPI?: boolean;
    voffset?: number;
    vScrollbarClassPrefix?: string;
    wheelHFactor?: number;
    wheelVFactor?: number;
    /** The current width of the column */
    width?: number;
}

export namespace HypergridProperties {
    export type Color = /* CanvasGradient | CanvasPattern |*/ string;

    export interface Calculators {
        [calculatorName: string]: DataModel.ColumnSchema.CalculateFunction;
    }

    export const enum HalignEnum {
        'left',
        'right',
        'center',
        'start',
        'end'
    }

    export type Halign = keyof typeof HalignEnum;

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
        backgroundColor: string;
        // @property {cssColor} [header.backgroundColor=backgroundColor] - for columns and rows, this is the background color of the column or row "handle" (header rows or columns, respectively). (Not used for cells.)
        header?: HoverColors.Header;
    }

    export namespace HoverColors {
        export interface Header {
            backgroundColor: string;
        }
    }

    export type FeedbackEffect = string | FeedbackEffectSpec;
    export interface FeedbackEffectSpec {
        name: string;
        options: Effect.Options;
    }

    export type LinkFunction = (this: void, cellEvent: CellEvent) => string;
    export type LinkProp = [url: string, target: string];

    export interface RowStripe {
        backgroundColor: string;
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
     *
     * @default
     * @type {object|undefined}
     * @memberOf module:defaults
     */

    export type NavKeyMap = Record<string, string>;

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
    export function navKey(properties: HypergridProperties, keyChar: string, ctrlKey = false): undefined|string {
        let result: string | undefined;
        if (keyChar.length > 1 || !properties.editOnKeydown || ctrlKey) {
            result = keyChar; // return the mapped value
        }
        return result;
    }

    /**
     * Returns only values of `keyChar` that, when run through {@link module:defaults.navKeyMap|navKeyMap}, pass the {@link module:defaults.navKey|navKey} logic test.
     *
     * @param keyChar - A value from Canvas's `charMap`, to be remapped through {@link module:defaults.navKeyMap|navKeyMap}.
     * @param ctrlKey - The CTRL key was down.
     * @returns `undefined` means not a nav key; otherwise returns `keyChar`.
     */
    export function mappedNavKey(properties: HypergridProperties, keyChar: string, ctrlKey = false): undefined | string {
        keyChar = properties.navKeyMap[keyChar];
        return keyChar && navKey(properties, keyChar, ctrlKey);
    }

    export function assign(source: HypergridProperties, target: HypergridProperties): void {
        Object.keys(source).forEach((key) => {
            let value = source[key];

            if (typeof value === 'object') {
                value = deepClone(value);
            }

            target[key] = value;
        });
    }

    export function copy(properties: HypergridProperties): HypergridProperties {
        const result = {} as HypergridProperties;
        assign(properties, result);
        return result;
    }

    export function createDefaults(): HypergridProperties {
        return copy(defaults);
    }
}

function deepClone(object: Record<string, unknown>) {
    const result = clone(object);
    Object.keys(result).forEach(function(key) {
        const descriptor = Object.getOwnPropertyDescriptor(result, key);
        if (typeof descriptor.value === 'object') {
            result[key] = deepClone(descriptor.value);
        }
    });
    return result;
}

function clone(value: unknown) {
    if (Array.isArray(value)) {
        return value.slice(); // clone array
    } else if (typeof value === 'object') {
        return Object.defineProperties({}, Object.getOwnPropertyDescriptors(value));
    } else {
        return value;
    }
}
