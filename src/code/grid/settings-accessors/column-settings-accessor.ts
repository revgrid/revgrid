import { ColumnSettings, MergableColumnSettings } from '../interfaces/column-settings';
import { GridSettings } from '../interfaces/grid-settings';
import { Halign } from '../lib/types';
import { deepExtendValue } from '../lib/utils';

export class ColumnSettingsAccessor implements MergableColumnSettings {
    // not overridable properties
    private _preferredWidth?: number;

    // grid overridable properties
    private _cellPadding: number | undefined;
    private _mouseCellSelection: boolean | undefined;
    private _columnAutosizingMax: number | undefined;
    private _columnClip: boolean | undefined;
    private _editable: boolean | undefined;
    private _editOnDoubleClick: boolean | undefined;
    private _editOnKeydown: boolean | undefined;
    private _editOnNextCell: boolean | undefined;
    private _editor: string | undefined;
    private _feedbackCount: number | undefined;
    private _filterable: boolean | undefined;
    private _font: string | undefined;
    private _format: string | undefined;
    private _gridLinesVWidth: number | undefined;
    private _gridLinesHWidth: number | undefined;
    private _halign: Halign | undefined;
    private _link: false | string | GridSettings.LinkProp | GridSettings.LinkFunction | undefined;
    private _linkTarget: string | undefined;
    private _maximumColumnWidth: number | undefined;
    private _resizeColumnInPlace: boolean | undefined;
    private _sortOnDoubleClick: boolean | undefined;
    private _sortable: boolean | undefined;

    // grid overridable properties set by Painters as well
    private _backgroundColor: GridSettings.Color | undefined;
    private _columnAutosized: boolean | undefined;
    private _columnAutosizing: boolean | undefined;
    private _minimumColumnWidth: number | undefined;
    private _width: number | undefined;

    readonly columnHeader: ColumnSettingsAccessor.ColumnHeader;
    readonly filterProperties: ColumnSettingsAccessor.Filter;

    constructor(private readonly _gridSettings: GridSettings, initialColumnSettings: Partial<ColumnSettings> | undefined) {
        this.columnHeader = new ColumnSettingsAccessor.ColumnHeader(this._gridSettings);
        this.filterProperties = new ColumnSettingsAccessor.Filter(this._gridSettings);

        if (initialColumnSettings !== undefined) {
            // todo initialise stuff here
        }

        // switch (_column.index) {
        //     case _column.behavior.treeColumnIndex: properties = properties.treeHeader; break;
        //     case _column.behavior.rowColumnIndex: properties = properties.rowHeader; break;
        // }
    }

    get preferredWidth() { return this._preferredWidth; }
    set preferredWidth(value: number | undefined) { this._preferredWidth = value; }

    get cellPadding() { return this._cellPadding ?? this._gridSettings.cellPadding; }
    set cellPadding(value: number) { this._cellPadding = value; }
    get mouseCellSelection() { return this._mouseCellSelection ?? this._gridSettings.mouseCellSelection; }
    set mouseCellSelection(value: boolean) { this._mouseCellSelection = value; }
    get columnAutosizingMax() { return this._columnAutosizingMax ?? this._gridSettings.columnAutosizingMax; }
    set columnAutosizingMax(value: number) { this._columnAutosizingMax = value; }
    get columnClip() { return this._columnClip ?? this._gridSettings.columnClip; }
    set columnClip(value: boolean | undefined) { this._columnClip = value; }
    get editable() { return this._editable ?? this._gridSettings.editable; }
    set editable(value: boolean) { this._editable = value; }
    get editOnDoubleClick() { return this._editOnDoubleClick ?? this._gridSettings.editOnDoubleClick; }
    set editOnDoubleClick(value: boolean) { this._editOnDoubleClick = value; }
    get editOnKeydown() { return this._editOnKeydown ?? this._gridSettings.editOnKeydown; }
    set editOnKeydown(value: boolean) { this._editOnKeydown = value; }
    get editOnNextCell() { return this._editOnNextCell ?? this._gridSettings.editOnNextCell; }
    set editOnNextCell(value: boolean) { this._editOnNextCell = value; }
    get editor() { return this._editor ?? this._gridSettings.editor; }
    set editor(value: string | undefined) { this._editor = value; }
    get feedbackCount() { return this._feedbackCount ?? this._gridSettings.feedbackCount; }
    set feedbackCount(value: number) { this._feedbackCount = value; }
    get filterable() { return this._filterable ?? this._gridSettings.filterable; }
    set filterable(value: boolean) { this._filterable = value; }
    get font() { return this._font ?? this._gridSettings.font; }
    set font(value: string) { this._font = value; }
    get format() { return this._format ?? this._gridSettings.format; }
    set format(value: string | undefined) { this._format = value; }
    get gridLinesVWidth() { return this._gridLinesVWidth ?? this._gridSettings.gridLinesVWidth; }
    set gridLinesVWidth(value: number) { this._gridLinesVWidth = value; }
    get gridLinesHWidth() { return this._gridLinesHWidth ?? this._gridSettings.gridLinesHWidth; }
    set gridLinesHWidth(value: number) { this._gridLinesHWidth = value; }
    get halign() { return this._halign ?? this._gridSettings.halign; }
    set halign(value: Halign) { this._halign = value; }
    get link() { return this._link ?? this._gridSettings.link; }
    set link(value: false | string | GridSettings.LinkProp | GridSettings.LinkFunction) { this._link = value; }
    get linkTarget() { return this._linkTarget ?? this._gridSettings.linkTarget; }
    set linkTarget(value: string) { this._linkTarget = value; }
    get maximumColumnWidth() { return this._maximumColumnWidth ?? this._gridSettings.maximumColumnWidth; }
    set maximumColumnWidth(value: number | undefined) { this._maximumColumnWidth = value; }
    get resizeColumnInPlace() { return this._resizeColumnInPlace ?? this._gridSettings.resizeColumnInPlace; }
    set resizeColumnInPlace(value: boolean) { this._resizeColumnInPlace = value; }
    get sortOnDoubleClick() { return this._sortOnDoubleClick ?? this._gridSettings.sortOnDoubleClick; }
    set sortOnDoubleClick(value: boolean) { this._sortOnDoubleClick = value; }
    get sortable() { return this._sortable ?? this._gridSettings.sortable; }
    set sortable(value: boolean) { this._sortable = value; }

    get backgroundColor() { return this._backgroundColor ?? this._gridSettings.backgroundColor; }
    set backgroundColor(value: GridSettings.Color) { this._backgroundColor = value; }
    get columnAutosized() { return this._columnAutosized ?? this._gridSettings.columnAutosized; }
    set columnAutosized(value: boolean) { this._columnAutosized = value; }
    get columnAutosizing() { return this._columnAutosizing ?? this._gridSettings.columnAutosizing; }
    set columnAutosizing(value: boolean) { this._columnAutosizing = value; }
    get minimumColumnWidth() { return this._minimumColumnWidth ?? this._gridSettings.minimumColumnWidth; }
    set minimumColumnWidth(value: number) { this._minimumColumnWidth = value; }
    get width() { return this._width ?? this._gridSettings.width; }
    set width(value: number) { this._width = value; }

    get color() { return this._gridSettings.color; }
    get backgroundSelectionColor() { return this._gridSettings.backgroundSelectionColor; }
    get foregroundSelectionColor() { return this._gridSettings.foregroundSelectionColor; }
    get foregroundSelectionFont() { return this._gridSettings.foregroundSelectionFont; }
    get cellPainter() { return this._gridSettings.cellPainter; }

    // not yet implemented
    // toJSON() {
    //     return Object.assign({
    //         header: this.header,
    //         type: this.type,
    //         // calculator: this.calculator
    //     }, this);
    // }

    merge(properties: Partial<ColumnSettings>) {
        Object.keys(properties).forEach((key) => {
            const typedValue = properties[key as keyof ColumnSettings];
            const value = deepExtendValue({}, typedValue);
            (this[key as keyof ColumnSettingsAccessor] as unknown) = value;
        });
    }
}

export namespace ColumnSettingsAccessor {
    export class ColumnHeader implements ColumnSettings.ColumnHeader {
        constructor(private readonly _gridProperties: GridSettings) {
//
        }
        get font() { return this._gridProperties.columnHeaderFont }
        set font(value: string) { this._gridProperties.columnHeaderFont = value; }
        get color() { return this._gridProperties.columnHeaderColor }
        set color(value: /*CanvasGradient | CanvasPattern |*/ string) { this._gridProperties.columnHeaderColor = value; }
        get backgroundColor() { return this._gridProperties.columnHeaderBackgroundColor }
        set backgroundColor(value: /*CanvasGradient | CanvasPattern |*/ string) { this._gridProperties.columnHeaderBackgroundColor = value; }
        get foregroundSelectionFont() { return this._gridProperties.columnHeaderForegroundSelectionFont }
        set foregroundSelectionFont(value: string) { this._gridProperties.columnHeaderForegroundSelectionFont = value; }
        get foregroundSelectionColor() { return this._gridProperties.columnHeaderForegroundSelectionColor }
        set foregroundSelectionColor(value: /*CanvasGradient | CanvasPattern |*/ string) { this._gridProperties.columnHeaderForegroundSelectionColor = value; }
        get backgroundSelectionColor() { return this._gridProperties.columnHeaderBackgroundSelectionColor }
        set backgroundSelectionColor(value: /*CanvasGradient | CanvasPattern |*/ string) { this._gridProperties.columnHeaderBackgroundSelectionColor = value; }
        get halign() { return this._gridProperties.columnHeaderHalign }
        set halign(value: Halign) { this._gridProperties.columnHeaderHalign = value; }
        get format() { return this._gridProperties.columnHeaderFormat }
        set format(value: string) { this._gridProperties.columnHeaderFormat = value; }
        get cellPainter() { return this._gridProperties.columnHeaderCellPainter }
        set cellPainter(value: string) { this._gridProperties.columnHeaderCellPainter = value; }
        // get autosizing() { return this._gridProperties.columnAutosizing }
        // set autosizing(value: boolean | undefined) { this._gridProperties.columnAutosizing = value; }
        // get autosizingMax() { return this._gridProperties.columnAutosizingMax }
        // set autosizingMax(value: number | undefined) { this._gridProperties.columnAutosizingMax = value; }

        // get leftIcon() {
        //     }
        // }
        // set leftIcon(value: string) {
        //     // this._column.rowHeaderLeftIcon = value;
        // }
    }

    export class Filter implements ColumnSettings.Filter {
        private _rightIcon: string;

        constructor(private readonly _gridProperties: GridSettings) { }

        get font() { return this._gridProperties.filterFont }
        set font(value: string) { this._gridProperties.filterFont = value; }
        get color() { return this._gridProperties.filterColor }
        set color(value: /*CanvasGradient | CanvasPattern |*/ string) { this._gridProperties.filterColor = value; }
        get backgroundColor() { return this._gridProperties.filterBackgroundColor }
        set backgroundColor(value: /*CanvasGradient | CanvasPattern |*/ string) { this._gridProperties.filterBackgroundColor = value; }
        get foregroundSelectionColor() { return this._gridProperties.filterForegroundSelectionColor }
        set foregroundSelectionColor(value: /*CanvasGradient | CanvasPattern |*/ string) { this._gridProperties.filterForegroundSelectionColor = value; }
        get backgroundSelectionColor() { return this._gridProperties.filterBackgroundSelectionColor }
        set backgroundSelectionColor(value: /*CanvasGradient | CanvasPattern |*/ string) { this._gridProperties.filterBackgroundSelectionColor = value; }
        get halign() { return this._gridProperties.filterHalign }
        set halign(value: Halign) { this._gridProperties.filterHalign = value; }
        get format() { return this._gridProperties.columnHeaderFormat }
        set format(value: string) { this._gridProperties.columnHeaderFormat = value; }
        get cellPainter() { return this._gridProperties.filterCellPainter }
        set cellPainter(value: string) { this._gridProperties.filterCellPainter = value; }
        get editor() { return this._gridProperties.filterEditor }
        set editor(value: string) { this._gridProperties.filterEditor = value; }

        get rightIcon() {
            const result = this._rightIcon;
            if (result === undefined) {
                if (this._gridProperties.filterable) {
                    // result = this._gridProperties.filter ? 'filter-on' : 'filter-off';
                }
                return result;
            } else {
                return '';
            }
        }
        set rightIcon(value: string) {
            this._rightIcon = value;
        }
    }
}
