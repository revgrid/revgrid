import { ColumnProperties } from '../column/column-properties';
import { GridProperties } from '../grid/grid-properties';
import { Localization } from '../lib/localization';
import { WritablePoint } from '../lib/point';
import { Rectangle, RectangleInterface } from '../lib/rectangular';
import { DataModel } from '../model/data-model';
import { CellPaintConfig } from './cell-paint-config';
import { RenderCell } from './render-cell';

/** @public */
export class CellPaintConfigAccessor implements CellPaintConfig {
    private readonly _gridProperties: GridProperties;
    private readonly _columnProperties: ColumnProperties;

    constructor(renderCell: RenderCell) {
        this._columnProperties = renderCell.column.properties;
        this._gridProperties = renderCell.grid.properties;
    }

    dataCell: WritablePoint;
    gridCell: WritablePoint;
    allRowsSelected: boolean;
    bounds: RectangleInterface;
    dataRow: DataModel.DataRowObject;
    formatValue: Localization.FormatFunction;
    isCellHovered: boolean;
    isCellSelected: boolean;
    isColumnHovered: boolean;
    isColumnSelected: boolean;
    isDataColumn: boolean;
    isDataRow: boolean;
    isFilterRow: boolean;
    isHandleColumn: boolean;
    isHeaderRow: boolean;
    isInCurrentSelectionRectangle: boolean;
    isRowHovered: boolean;
    isRowSelected: boolean;
    isSelected: boolean;
    isTreeColumn: boolean;
    isUserDataArea: boolean;
    minWidth: number;
    mouseDown: boolean;
    prefillColor: GridProperties.Color;
    snapshot: RenderCell.SubrowSnapshot; // RenderCell
    subrow: number;
    subrows: number;
    value: unknown;

    clickRect?: Rectangle;

    cellBorderThickness?: number;
    cellBorderStyle?: string /*| CanvasGradient | CanvasPattern */;
    hotIcon?: string;

    // grid overrides
    // private _backgroundSelectionColor?: GridProperties.Color;
    // private _centerIcon?: string;
    // private _color?: GridProperties.Color;
    // private _foregroundSelectionColor?: GridProperties.Color;
    // private _foregroundSelectionFont?: string;
    // private _headerTextWrapping?: boolean;
    // private _hoverCellHighlight?: GridProperties.HoverColors;
    // private _hoverColumnHighlight?: GridProperties.HoverColors;
    // private _hoverRowHighlight?: GridProperties.HoverColors;
    // private _iconPadding?: number;
    // private _leftIcon?: string;
    // private _linkOnHover?: boolean;
    // private _linkColor?: GridProperties.Color;
    // private _linkColorOnHover?: boolean;
    // private _renderer?: string;
    // private _renderFalsy?: boolean;
    // private _rightIcon?: string;
    // private _rowHeaderNumbers?: boolean;
    // private _strikeThrough?: boolean;
    // private _truncateTextWithEllipsis?: boolean | undefined;
    // private _voffset?: number;

    // grid overrides set by renderer as well
    private _selectionRegionOutlineColor: GridProperties.Color;
    private _selectionRegionOverlayColor: GridProperties.Color;

    // column overrides
    // private _cellPadding?: number;
    // private _columnAutosizing?: boolean;
    // private _font?: string;
    // private _format?: string;
    // private _gridLinesHWidth?: number;
    // private _gridLinesVWidth?: number;
    // private _link?: false | string | GridProperties.LinkProp | GridProperties.LinkFunction;

    // column overrides set by painters/renderer as well
    private _backgroundColor: GridProperties.Color;
    private _halign: GridProperties.Halign;

    get backgroundSelectionColor() { return this._gridProperties.backgroundSelectionColor; }
    // set backgroundSelectionColor(value: GridProperties.Color | undefined) { this._backgroundSelectionColor = value; }
    get centerIcon() { return this._gridProperties.centerIcon; }
    // set centerIcon(value: string | undefined) { this._centerIcon = value; }
    get color() { return this._gridProperties.color; }
    // set color(value: GridProperties.Color | undefined) { this._color = value; }
    get foregroundSelectionColor() { return this._gridProperties.foregroundSelectionColor; }
    // set foregroundSelectionColor(value: GridProperties.Color | undefined) { this._foregroundSelectionColor = value; }
    get foregroundSelectionFont() { return this._gridProperties.foregroundSelectionFont; }
   //  set foregroundSelectionFont(value: string | undefined) { this._foregroundSelectionFont = value; }
    get headerTextWrapping() { return this._gridProperties.headerTextWrapping; }
   //  set headerTextWrapping(value: boolean | undefined) { this._headerTextWrapping = value; }
    get hoverCellHighlight() { return this._gridProperties.hoverCellHighlight; }
   //  set hoverCellHighlight(value: GridProperties.HoverColors | undefined) { this._hoverCellHighlight = value; }
    get hoverColumnHighlight() { return this._gridProperties.hoverColumnHighlight; }
   //  set hoverColumnHighlight(value: GridProperties.HoverColors | undefined) { this._hoverColumnHighlight = value; }
    get hoverRowHighlight() { return this._gridProperties.hoverRowHighlight; }
   //  set hoverRowHighlight(value: GridProperties.HoverColors | undefined) { this._hoverRowHighlight = value; }
    get iconPadding() { return this._gridProperties.iconPadding; }
   //  set iconPadding(value: number | undefined) { this._iconPadding = value; }
    get leftIcon() { return this._gridProperties.leftIcon; }
   //  set leftIcon(value: string | undefined) { this._leftIcon = value; }
    get linkOnHover() { return this._gridProperties.linkOnHover; }
   //  set linkOnHover(value: boolean | undefined) { this._linkOnHover = value; }
    get linkColor() { return this._gridProperties.linkColor; }
   //  set linkColor(value: GridProperties.Color | undefined) { this._linkColor = value; }
    get linkColorOnHover() { return this._gridProperties.linkColorOnHover; }
   //  set linkColorOnHover(value: boolean | undefined) { this._linkColorOnHover = value; }
    get renderer() { return this._gridProperties.cellPainter; }
   //  set renderer(value: string | undefined) { this._renderer = value; }
    get renderFalsy() { return this._gridProperties.renderFalsy; }
   //  set renderFalsy(value: boolean | undefined) { this._renderFalsy = value; }
    get rightIcon() { return this._gridProperties.rightIcon; }
   //  set rightIcon(value: string | undefined) { this._rightIcon = value; }
    get strikeThrough() { return this._gridProperties.strikeThrough; }
   //  set strikeThrough(value: boolean | undefined) { this._strikeThrough = value; }
    get truncateText() { return this._gridProperties.truncateText; }
   //  set truncateTextWithEllipsis(value: boolean | undefined) { this._truncateTextWithEllipsis = value; }
    get voffset() { return this._gridProperties.voffset; }
   //  set voffset(value: number | undefined) { this._voffset = value; }

    get selectionRegionOutlineColor() { return this._selectionRegionOutlineColor ?? this._gridProperties.selectionRegionOutlineColor; }
    set selectionRegionOutlineColor(value: GridProperties.Color) { this._selectionRegionOutlineColor = value; }
    get selectionRegionOverlayColor() { return this._selectionRegionOverlayColor ?? this._gridProperties.selectionRegionOverlayColor; }
    set selectionRegionOverlayColor(value: GridProperties.Color) { this._selectionRegionOverlayColor = value; }

    get columnName() { return this._columnProperties.name; }
    get cellPadding() { return this._columnProperties.cellPadding; }
   //  set cellPadding(value: number | undefined) { this._cellPadding = value; }
    get columnAutosizing() { return this._columnProperties.columnAutosizing; }
   //  set columnAutosizing(value: boolean | undefined) { this._columnAutosizing = value; }
    get font() { return this._columnProperties.font; }
   //  set font(value: string | undefined) { this._font = value; }
    get format() { return this._columnProperties.format; }
   //  set format(value: string | undefined) { this._format = value; }
    get gridLinesHWidth() { return this._columnProperties.gridLinesHWidth; }
   //  set gridLinesHWidth(value: number | undefined) { this._gridLinesHWidth = value; }
    get gridLinesVWidth() { return this._columnProperties.gridLinesVWidth; }
   //  set gridLinesVWidth(value: number | undefined) { this._gridLinesVWidth = value; }
    get link() { return this._columnProperties.link; }
   //  set link(value: false | string | GridProperties.LinkProp | GridProperties.LinkFunction | undefined) { this._link = value; }

    get backgroundColor() { return this._backgroundColor ?? this._columnProperties.backgroundColor; }
    set backgroundColor(value: GridProperties.Color) { this._backgroundColor = value; }
    get halign() { return this._halign ?? this._columnProperties.halign; }
    set halign(value: GridProperties.Halign) { this._halign = value; }
}
