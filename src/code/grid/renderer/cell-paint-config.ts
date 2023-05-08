import { DataModel } from '../interfaces/data-model';
import { GridSettings } from '../interfaces/grid-settings';
import { Localization } from '../lib/localization';
import { WritablePoint } from '../lib/point';
import { RectangleInterface } from '../lib/rectangle-interface';
import { Halign, TextTruncateType } from '../lib/types';

/** @public */
export interface CellPaintConfig {
    // not overrides also set by grid painters/renderer
    dataCell: WritablePoint;
    gridCell: WritablePoint;
    allRowsSelected: boolean;
    bounds: RectangleInterface;
    dataRow: DataModel.DataRow;
    formatValue: Localization.FormatFunction;
    isCellHovered: boolean;
    isCellSelected: boolean;
    isColumnHovered: boolean;
    isColumnSelected: boolean;
    isMainRow: boolean;
    isFilterRow: boolean;
    isHeaderRow: boolean;
    isInCurrentSelectionRectangle: boolean;
    isRowHovered: boolean;
    isRowFocused: boolean;
    isRowSelected: boolean;
    isSelected: boolean;
    isUserDataArea: boolean;
    prefillColor: GridSettings.Color | undefined;
    snapshot: Record<string, unknown> | undefined;
    value: unknown;

    // grid overrides
    readonly backgroundSelectionColor: GridSettings.Color;
    readonly color: GridSettings.Color;
    readonly foregroundSelectionColor: GridSettings.Color;
    readonly foregroundSelectionFont: string;
    readonly headerTextWrapping: boolean;
    readonly hoverCellHighlight: GridSettings.HoverColors;
    readonly hoverColumnHighlight: GridSettings.HoverColors;
    readonly hoverRowHighlight: GridSettings.HoverColors;
    readonly linkOnHover: boolean;
    readonly linkColor: GridSettings.Color;
    readonly linkColorOnHover: boolean;
    readonly cellPainter: string;
    readonly strikeThrough: boolean;
    readonly textTruncateType: TextTruncateType | undefined;
    readonly voffset: number;

    // column overrides
    readonly columnName: string;
    readonly cellPadding: number;
    readonly columnAutosizing: boolean;
    readonly font: string;
    readonly format: string | undefined;
    readonly gridLinesHWidth: number;
    readonly gridLinesVWidth: number;
    readonly link: false | string | GridSettings.LinkProp | GridSettings.LinkFunction;
    readonly backgroundColor: GridSettings.Color;
    readonly halign: Halign;
}
