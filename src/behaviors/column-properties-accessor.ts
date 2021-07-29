import { HypergridProperties } from '../grid/hypergrid-properties';
import { DataModel } from '../lib/data-model';
import { Column } from './column';
import { ColumnProperties } from './column-properties';

export class ColumnPropertiesAccessor implements ColumnProperties {
    // not overridable properties
    private _preferredWidth?: number;

    // grid overridable properties
    private _boxSizing?: string;
    private _cellPadding?: number;
    private _columnAutosizingMax?: number;
    private _columnClip?: boolean | null;
    private _editOnKeydown?: boolean;
    private _editOnNextCell?: boolean;
    private _editor?: string;
    private _feedbackCount?: number;
    private _filterable?: boolean;
    private _font?: string;
    private _format?: string;
    private _gridLinesVWidth?: number;
    private _gridLinesHWidth?: number;
    private _halign?: HypergridProperties.Halign;
    private _link?: false | string | HypergridProperties.LinkProp | HypergridProperties.LinkFunction;
    private _linkTarget?: string;
    private _maximumColumnWidth?: number;
    private _resizeColumnInPlace?: boolean;
    private _sortOnDoubleClick?: boolean;
    private _unsortable?: boolean;

    // grid overridable properties set by Painters as well
    private _backgroundColor?: HypergridProperties.Color;
    private _columnAutosized?: boolean;
    private _columnAutosizing?: boolean;
    private _minimumColumnWidth?: number;
    private _width?: number;

    readonly rowHeader: ColumnPropertiesAccessor.RowHeader;
    // Tree Header probably no longer supported
    readonly treeHeader: ColumnPropertiesAccessor.TreeHeader;
    readonly columnHeader: ColumnPropertiesAccessor.ColumnHeader;
    readonly filterProperties: ColumnPropertiesAccessor.Filter;

    constructor(private readonly _gridProperties: HypergridProperties, private readonly _column: Column) {
        this.rowHeader = new ColumnPropertiesAccessor.RowHeader(this._gridProperties);
        this.treeHeader = new ColumnPropertiesAccessor.TreeHeader(this._gridProperties);
        this.columnHeader = new ColumnPropertiesAccessor.ColumnHeader(this._gridProperties);
        this.filterProperties = new ColumnPropertiesAccessor.Filter(this._gridProperties);

        // switch (_column.index) {
        //     case _column.behavior.treeColumnIndex: properties = properties.treeHeader; break;
        //     case _column.behavior.rowColumnIndex: properties = properties.rowHeader; break;
        // }
    }

    get type() { return this._column.type; }
    set type(value: string) { this._column.type = value; }
    get calculator() { return this._column.calculator; }
    set calculator(value: DataModel.ColumnSchema.Calculator) { this._column.calculator = value; }

    get preferredWidth() { return this._preferredWidth; }
    set preferredWidth(value: number) { this._preferredWidth = value; }

    get boxSizing() { return this._boxSizing ?? this._gridProperties.boxSizing; }
    set boxSizing(value: string) { this._boxSizing = value; }
    get cellPadding() { return this._cellPadding ?? this._gridProperties.cellPadding; }
    set cellPadding(value: number) { this._cellPadding = value; }
    get columnAutosizingMax() { return this._columnAutosizingMax ?? this._gridProperties.columnAutosizingMax; }
    set columnAutosizingMax(value: number) { this._columnAutosizingMax = value; }
    get columnClip() { return this._columnClip ?? this._gridProperties.columnClip; }
    set columnClip(value: boolean | null) { this._columnClip = value; }
    get editOnKeydown() { return this._editOnKeydown ?? this._gridProperties.editOnKeydown; }
    set editOnKeydown(value: boolean) { this._editOnKeydown = value; }
    get editOnNextCell() { return this._editOnNextCell ?? this._gridProperties.editOnNextCell; }
    set editOnNextCell(value: boolean) { this._editOnNextCell = value; }
    get editor() { return this._editor ?? this._gridProperties.editor; }
    set editor(value: string) { this._editor = value; }
    get feedbackCount() { return this._feedbackCount ?? this._gridProperties.feedbackCount; }
    set feedbackCount(value: number) { this._feedbackCount = value; }
    get filterable() { return this._filterable ?? this._gridProperties.filterable; }
    set filterable(value: boolean) { this._filterable = value; }
    get font() { return this._font ?? this._gridProperties.font; }
    set font(value: string) { this._font = value; }
    get format() { return this._format ?? this._gridProperties.format; }
    set format(value: string) { this._format = value; }
    get gridLinesVWidth() { return this._gridLinesVWidth ?? this._gridProperties.gridLinesVWidth; }
    set gridLinesVWidth(value: number) { this._gridLinesVWidth = value; }
    get gridLinesHWidth() { return this._gridLinesHWidth ?? this._gridProperties.gridLinesHWidth; }
    set gridLinesHWidth(value: number) { this._gridLinesHWidth = value; }
    get halign() { return this._halign ?? this._gridProperties.halign; }
    set halign(value: HypergridProperties.Halign) { this._halign = value; }
    get link() { return this._link ?? this._gridProperties.link; }
    set link(value: false | string | HypergridProperties.LinkProp | HypergridProperties.LinkFunction) { this._link = value; }
    get linkTarget() { return this._linkTarget ?? this._gridProperties.linkTarget; }
    set linkTarget(value: string) { this._linkTarget = value; }
    get maximumColumnWidth() { return this._maximumColumnWidth ?? this._gridProperties.maximumColumnWidth; }
    set maximumColumnWidth(value: number) { this._maximumColumnWidth = value; }
    get resizeColumnInPlace() { return this._resizeColumnInPlace ?? this._gridProperties.resizeColumnInPlace; }
    set resizeColumnInPlace(value: boolean) { this._resizeColumnInPlace = value; }
    get sortOnDoubleClick() { return this._sortOnDoubleClick ?? this._gridProperties.sortOnDoubleClick; }
    set sortOnDoubleClick(value: boolean) { this._sortOnDoubleClick = value; }
    get unsortable() { return this._unsortable ?? this._gridProperties.unsortable; }
    set unsortable(value: boolean) { this._unsortable = value; }

    get backgroundColor() { return this._backgroundColor ?? this._gridProperties.backgroundColor; }
    set backgroundColor(value: HypergridProperties.Color) { this._backgroundColor = value; }
    get columnAutosized() { return this._columnAutosized ?? this._gridProperties.columnAutosized; }
    set columnAutosized(value: boolean) { this._columnAutosized = value; }
    get columnAutosizing() { return this._columnAutosizing ?? this._gridProperties.columnAutosizing; }
    set columnAutosizing(value: boolean) { this._columnAutosizing = value; }
    get minimumColumnWidth() { return this._minimumColumnWidth ?? this._gridProperties.minimumColumnWidth; }
    set minimumColumnWidth(value: number) { this._minimumColumnWidth = value; }
    get width() { return this._width ?? this._gridProperties.width; }
    set width(value: number) { this._width = value; }

    // not yet implemented
    // toJSON() {
    //     return Object.assign({
    //         header: this.header,
    //         type: this.type,
    //         // calculator: this.calculator
    //     }, this);
    // }
}

export namespace ColumnPropertiesAccessor {
    export class RowHeader implements ColumnProperties.RowHeader {
        private _leftIcon: string | undefined;

        constructor(private readonly _gridProperties: HypergridProperties) {

        }
        get font() { return this._gridProperties.rowHeaderFont }
        set font(value: string) { this._gridProperties.rowHeaderFont = value; }
        get color() { return this._gridProperties.rowHeaderColor }
        set color(value: /*CanvasGradient | CanvasPattern |*/ string | undefined) { this._gridProperties.rowHeaderColor = value; }
        get backgroundColor() { return this._gridProperties.rowHeaderBackgroundColor }
        set backgroundColor(value: /*CanvasGradient | CanvasPattern |*/ string | undefined) { this._gridProperties.rowHeaderBackgroundColor = value; }
        get foregroundSelectionFont() { return this._gridProperties.rowHeaderForegroundSelectionFont }
        set foregroundSelectionFont(value: string) { this._gridProperties.rowHeaderForegroundSelectionFont = value; }
        get foregroundSelectionColor() { return this._gridProperties.rowHeaderForegroundSelectionColor }
        set foregroundSelectionColor(value: /*CanvasGradient | CanvasPattern |*/ string | undefined) { this._gridProperties.rowHeaderForegroundSelectionColor = value; }
        get backgroundSelectionColor() { return this._gridProperties.rowHeaderBackgroundSelectionColor }
        set backgroundSelectionColor(value: /*CanvasGradient | CanvasPattern |*/ string | undefined) { this._gridProperties.rowHeaderBackgroundSelectionColor = value; }

        get leftIcon() {
            if (this._gridProperties.rowHeaderCheckboxes) {
                // let result: string;
                // if (this.isDataRow) {
                //     result = this.isRowSelected ? 'checked' : 'unchecked';
                // } else if (this.isHeaderRow) {
                //     result = this.allRowsSelected ? 'checked' : 'unchecked';
                // } else if (this.isFilterRow) {
                const result = 'filter-off';
                // }
                return result;
            } else {
                return undefined;
            }
        }
        set leftIcon(value: string) {
            this._leftIcon = value;
        }
        get columnAutosizing() { return this._gridProperties.rowNumberAutosizing }
        set columnAutosizing(value: boolean) { this._gridProperties.rowNumberAutosizing = value; }
    }

    // Tree Header probably no longer supported
    export class TreeHeader implements ColumnProperties.TreeHeader {
        constructor(private readonly _gridProperties: HypergridProperties) {

        }
        get font() { return this._gridProperties.treeHeaderFont }
        set font(value: string) { this._gridProperties.treeHeaderFont = value; }
        get color() { return this._gridProperties.treeHeaderColor }
        set color(value: /*CanvasGradient | CanvasPattern |*/ string | undefined) { this._gridProperties.treeHeaderColor = value; }
        get backgroundColor() { return this._gridProperties.treeHeaderBackgroundColor }
        set backgroundColor(value: /*CanvasGradient | CanvasPattern |*/ string | undefined) { this._gridProperties.treeHeaderBackgroundColor = value; }
        get foregroundSelectionFont() { return this._gridProperties.treeHeaderForegroundSelectionFont }
        set foregroundSelectionFont(value: string) { this._gridProperties.treeHeaderForegroundSelectionFont = value; }
        get foregroundSelectionColor() { return this._gridProperties.treeHeaderForegroundSelectionColor }
        set foregroundSelectionColor(value: /*CanvasGradient | CanvasPattern |*/ string | undefined) { this._gridProperties.treeHeaderForegroundSelectionColor = value; }
        get backgroundSelectionColor() { return this._gridProperties.treeHeaderBackgroundSelectionColor }
        set backgroundSelectionColor(value: /*CanvasGradient | CanvasPattern |*/ string | undefined) { this._gridProperties.treeHeaderBackgroundSelectionColor = value; }

        // get columnAutosizing() { return this._gridProperties.treeHeaderAutosizing }
        // set columnAutosizing(value: boolean) { this._gridProperties.treeHeaderAutosizing = value; }
    }

    export class ColumnHeader implements ColumnProperties.ColumnHeader {
        constructor(private readonly _gridProperties: HypergridProperties) {
//
        }
        get font() { return this._gridProperties.columnHeaderFont }
        set font(value: string) { this._gridProperties.columnHeaderFont = value; }
        get color() { return this._gridProperties.columnHeaderColor }
        set color(value: /*CanvasGradient | CanvasPattern |*/ string | undefined) { this._gridProperties.columnHeaderColor = value; }
        get backgroundColor() { return this._gridProperties.columnHeaderBackgroundColor }
        set backgroundColor(value: /*CanvasGradient | CanvasPattern |*/ string | undefined) { this._gridProperties.columnHeaderBackgroundColor = value; }
        get foregroundSelectionFont() { return this._gridProperties.columnHeaderForegroundSelectionFont }
        set foregroundSelectionFont(value: string) { this._gridProperties.columnHeaderForegroundSelectionFont = value; }
        get foregroundSelectionColor() { return this._gridProperties.columnHeaderForegroundSelectionColor }
        set foregroundSelectionColor(value: /*CanvasGradient | CanvasPattern |*/ string | undefined) { this._gridProperties.columnHeaderForegroundSelectionColor = value; }
        get backgroundSelectionColor() { return this._gridProperties.columnHeaderBackgroundSelectionColor }
        set backgroundSelectionColor(value: /*CanvasGradient | CanvasPattern |*/ string | undefined) { this._gridProperties.columnHeaderBackgroundSelectionColor = value; }
        get halign() { return this._gridProperties.columnHeaderHalign }
        set halign(value: HypergridProperties.Halign | undefined) { this._gridProperties.columnHeaderHalign = value; }
        get format() { return this._gridProperties.columnHeaderFormat }
        set format(value: string | undefined) { this._gridProperties.columnHeaderFormat = value; }
        get renderer() { return this._gridProperties.columnHeaderRenderer }
        set renderer(value: string | undefined) { this._gridProperties.columnHeaderRenderer = value; }
        get autosizing() { return this._gridProperties.columnAutosizing }
        set autosizing(value: boolean | undefined) { this._gridProperties.columnAutosizing = value; }
        get autosizingMax() { return this._gridProperties.columnAutosizingMax }
        set autosizingMax(value: number | undefined) { this._gridProperties.columnAutosizingMax = value; }

        // get leftIcon() {
        //     }
        // }
        // set leftIcon(value: string) {
        //     // this._column.rowHeaderLeftIcon = value;
        // }
    }

    export class Filter implements ColumnProperties.Filter {
        private _rightIcon: string;

        constructor(private readonly _gridProperties: HypergridProperties) { }

        get font() { return this._gridProperties.filterFont }
        set font(value: string) { this._gridProperties.filterFont = value; }
        get color() { return this._gridProperties.filterColor }
        set color(value: /*CanvasGradient | CanvasPattern |*/ string | undefined) { this._gridProperties.filterColor = value; }
        get backgroundColor() { return this._gridProperties.filterBackgroundColor }
        set backgroundColor(value: /*CanvasGradient | CanvasPattern |*/ string | undefined) { this._gridProperties.filterBackgroundColor = value; }
        get foregroundSelectionColor() { return this._gridProperties.filterForegroundSelectionColor }
        set foregroundSelectionColor(value: /*CanvasGradient | CanvasPattern |*/ string | undefined) { this._gridProperties.filterForegroundSelectionColor = value; }
        get backgroundSelectionColor() { return this._gridProperties.filterBackgroundSelectionColor }
        set backgroundSelectionColor(value: /*CanvasGradient | CanvasPattern |*/ string | undefined) { this._gridProperties.filterBackgroundSelectionColor = value; }
        get halign() { return this._gridProperties.filterHalign }
        set halign(value: HypergridProperties.Halign | undefined) { this._gridProperties.filterHalign = value; }
        get format() { return this._gridProperties.columnHeaderFormat }
        set format(value: string | undefined) { this._gridProperties.columnHeaderFormat = value; }
        get renderer() { return this._gridProperties.filterRenderer }
        set renderer(value: string | undefined) { this._gridProperties.filterRenderer = value; }
        get editor() { return this._gridProperties.filterEditor }
        set editor(value: string | undefined) { this._gridProperties.filterEditor = value; }

        get rightIcon() {
            const result = this._rightIcon;
            if (result === undefined) {
                if (this._gridProperties.filterable) {
                    // result = this._gridProperties.filter ? 'filter-on' : 'filter-off';
                }
                return result;
            } else {
                return undefined;
            }
        }
        set rightIcon(value: string) {
            this._rightIcon = value;
        }
    }
}
