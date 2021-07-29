import { ColumnProperties } from '../behaviors/column-properties';
import { WritablePoint } from '../dependencies/point';
import { Rectangle, RectangleInterface } from '../dependencies/rectangular';
import { HypergridProperties } from '../grid/hypergrid-properties';
import { DataModel } from '../lib/data-model';
import { Localization } from '../lib/localization';
import { RenderCellProperties } from './render-cell-properties';

export class RenderCellPropertiesAccessor implements RenderCellProperties {
    constructor(private readonly _columnProperties: ColumnProperties, private readonly _gridProperties: HypergridProperties) {
    }

    // Also in RenderCell
    dataCell?: WritablePoint;
    gridCell?: WritablePoint;
    clickRect?: Rectangle;

    // not overrides
    cellBorderThickness?: number;
    cellBorderStyle?: string /*| CanvasGradient | CanvasPattern */;
    hotIcon?: string;

    // not overrides also set by painters/renderer
    allRowsSelected?: boolean;
    bounds?: RectangleInterface;
    dataRow?: DataModel.DataRowObject;
    formatValue?: Localization.FormatFunction;
    isCellHovered?: boolean;
    isCellSelected?: boolean;
    isColumnHovered?: boolean;
    isColumnSelected?: boolean;
    isDataColumn?: boolean;
    isDataRow?: boolean;
    isFilterRow?: boolean;
    isHandleColumn?: boolean;
    isHeaderRow?: boolean;
    isInCurrentSelectionRectangle?: boolean;
    isRowHovered?: boolean;
    isRowSelected?: boolean;
    isSelected?: boolean;
    isTreeColumn?: boolean;
    isUserDataArea?: boolean;
    minWidth?: number;
    mouseDown?: boolean;
    prefillColor?: HypergridProperties.Color;
    snapshot?: RenderCellProperties.Snapshot; // RenderCell
    subrow?: number;
    subrows?: number;
    value?: unknown;

    // grid overrides
    private _backgroundSelectionColor?: HypergridProperties.Color;
    private _centerIcon?: string;
    private _color?: HypergridProperties.Color;
    private _foregroundSelectionColor?: HypergridProperties.Color;
    private _foregroundSelectionFont?: string;
    private _headerTextWrapping?: boolean;
    private _hoverCellHighlight?: HypergridProperties.HoverColors;
    private _hoverColumnHighlight?: HypergridProperties.HoverColors;
    private _hoverRowHighlight?: HypergridProperties.HoverColors;
    private _iconPadding?: number;
    private _leftIcon?: string;
    private _linkOnHover?: boolean;
    private _linkColor?: HypergridProperties.Color;
    private _linkColorOnHover?: boolean;
    private _renderer?: string;
    private _renderFalsy?: boolean;
    private _rightIcon?: string;
    private _rowHeaderNumbers?: boolean;
    private _selectionRegionOutlineColor?: HypergridProperties.Color;
    private _selectionRegionOverlayColor?: HypergridProperties.Color;
    private _strikeThrough?: boolean;
    private _truncateTextWithEllipsis?: boolean | null;
    private _voffset?: number;

    // column overrides
    private _boxSizing?: string;
    private _cellPadding?: number;
    private _columnAutosizing?: boolean;
    private _font?: string;
    private _format?: string;
    private _gridLinesHWidth?: number;
    private _gridLinesVWidth?: number;
    private _link?: false | string | HypergridProperties.LinkProp | HypergridProperties.LinkFunction;

    // column overrides set by painters/renderer as well
    private _backgroundColor?: HypergridProperties.Color;
    private _halign?: HypergridProperties.Halign;

    get backgroundSelectionColor() { return this._backgroundSelectionColor ?? this._gridProperties.backgroundSelectionColor; }
    set backgroundSelectionColor(value: HypergridProperties.Color | undefined) { this._backgroundSelectionColor = value; }
    get centerIcon() { return this._centerIcon ?? this._gridProperties.centerIcon; }
    set centerIcon(value: string | undefined) { this._centerIcon = value; }
    get color() { return this._color ?? this._gridProperties.color; }
    set color(value: HypergridProperties.Color | undefined) { this._color = value; }
    get foregroundSelectionColor() { return this._foregroundSelectionColor ?? this._gridProperties.foregroundSelectionColor; }
    set foregroundSelectionColor(value: HypergridProperties.Color | undefined) { this._foregroundSelectionColor = value; }
    get foregroundSelectionFont() { return this._foregroundSelectionFont ?? this._gridProperties.foregroundSelectionFont; }
    set foregroundSelectionFont(value: string | undefined) { this._foregroundSelectionFont = value; }
    get headerTextWrapping() { return this._headerTextWrapping ?? this._gridProperties.headerTextWrapping; }
    set headerTextWrapping(value: boolean | undefined) { this._headerTextWrapping = value; }
    get hoverCellHighlight() { return this._hoverCellHighlight ?? this._gridProperties.hoverCellHighlight; }
    set hoverCellHighlight(value: HypergridProperties.HoverColors | undefined) { this._hoverCellHighlight = value; }
    get hoverColumnHighlight() { return this._hoverColumnHighlight ?? this._gridProperties.hoverColumnHighlight; }
    set hoverColumnHighlight(value: HypergridProperties.HoverColors | undefined) { this._hoverColumnHighlight = value; }
    get hoverRowHighlight() { return this._hoverRowHighlight ?? this._gridProperties.hoverRowHighlight; }
    set hoverRowHighlight(value: HypergridProperties.HoverColors | undefined) { this._hoverRowHighlight = value; }
    get iconPadding() { return this._iconPadding ?? this._gridProperties.iconPadding; }
    set iconPadding(value: number | undefined) { this._iconPadding = value; }
    get leftIcon() { return this._leftIcon ?? this._gridProperties.leftIcon; }
    set leftIcon(value: string | undefined) { this._leftIcon = value; }
    get linkOnHover() { return this._linkOnHover ?? this._gridProperties.linkOnHover; }
    set linkOnHover(value: boolean | undefined) { this._linkOnHover = value; }
    get linkColor() { return this._linkColor ?? this._gridProperties.linkColor; }
    set linkColor(value: HypergridProperties.Color | undefined) { this._linkColor = value; }
    get linkColorOnHover() { return this._linkColorOnHover ?? this._gridProperties.linkColorOnHover; }
    set linkColorOnHover(value: boolean | undefined) { this._linkColorOnHover = value; }
    get renderer() { return this._renderer ?? this._gridProperties.renderer; }
    set renderer(value: string | undefined) { this._renderer = value; }
    get renderFalsy() { return this._renderFalsy ?? this._gridProperties.renderFalsy; }
    set renderFalsy(value: boolean | undefined) { this._renderFalsy = value; }
    get rightIcon() { return this._rightIcon ?? this._gridProperties.rightIcon; }
    set rightIcon(value: string | undefined) { this._rightIcon = value; }
    get rowHeaderNumbers() { return this._rowHeaderNumbers ?? this._gridProperties.rowHeaderNumbers; }
    set rowHeaderNumbers(value: boolean | undefined) { this._rowHeaderNumbers = value; }
    get selectionRegionOutlineColor() { return this._selectionRegionOutlineColor ?? this._gridProperties.selectionRegionOutlineColor; }
    set selectionRegionOutlineColor(value: HypergridProperties.Color | undefined) { this._selectionRegionOutlineColor = value; }
    get selectionRegionOverlayColor() { return this._selectionRegionOverlayColor ?? this._gridProperties.selectionRegionOverlayColor; }
    set selectionRegionOverlayColor(value: HypergridProperties.Color | undefined) { this._selectionRegionOverlayColor = value; }
    get strikeThrough() { return this._strikeThrough ?? this._gridProperties.strikeThrough; }
    set strikeThrough(value: boolean | undefined) { this._strikeThrough = value; }
    get truncateTextWithEllipsis() { return this._truncateTextWithEllipsis ?? this._gridProperties.truncateTextWithEllipsis; }
    set truncateTextWithEllipsis(value: boolean | null | undefined) { this._truncateTextWithEllipsis = value; }
    get voffset() { return this._voffset ?? this._gridProperties.voffset; }
    set voffset(value: number | undefined) { this._voffset = value; }

    get boxSizing() { return this._boxSizing ?? this._columnProperties.boxSizing; }
    set boxSizing(value: string | undefined) { this._boxSizing = value; }
    get cellPadding() { return this._cellPadding ?? this._columnProperties.cellPadding; }
    set cellPadding(value: number | undefined) { this._cellPadding = value; }
    get columnAutosizing() { return this._columnAutosizing ?? this._columnProperties.columnAutosizing; }
    set columnAutosizing(value: boolean | undefined) { this._columnAutosizing = value; }
    get font() { return this._font ?? this._columnProperties.font; }
    set font(value: string | undefined) { this._font = value; }
    get format() { return this._format ?? this._columnProperties.format; }
    set format(value: string | undefined) { this._format = value; }
    get gridLinesHWidth() { return this._gridLinesHWidth ?? this._columnProperties.gridLinesHWidth; }
    set gridLinesHWidth(value: number | undefined) { this._gridLinesHWidth = value; }
    get gridLinesVWidth() { return this._gridLinesVWidth ?? this._columnProperties.gridLinesVWidth; }
    set gridLinesVWidth(value: number | undefined) { this._gridLinesVWidth = value; }
    get link() { return this._link ?? this._columnProperties.link; }
    set link(value: false | string | HypergridProperties.LinkProp | HypergridProperties.LinkFunction | undefined) { this._link = value; }

    get backgroundColor() { return this._backgroundColor ?? this._columnProperties.backgroundColor; }
    set backgroundColor(value: HypergridProperties.Color | undefined) { this._backgroundColor = value; }
    get halign() { return this._halign ?? this._columnProperties.halign; }
    set halign(value: HypergridProperties.Halign | undefined) { this._halign = value; }
}
