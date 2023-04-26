import { GridProperties } from '../grid-properties';
import { Localization } from '../lib/localization';
import { WritablePoint } from '../lib/point';
import { RectangleInterface } from '../lib/rectangle-interface';
import { Halign, TextTruncateType } from '../lib/types';
import { DataModel } from '../model/data-model';

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
    prefillColor: GridProperties.Color | undefined;
    snapshot: Record<string, unknown>;
    value: unknown;

    // grid overrides
    readonly backgroundSelectionColor: GridProperties.Color;
    readonly color: GridProperties.Color;
    readonly foregroundSelectionColor: GridProperties.Color;
    readonly foregroundSelectionFont: string;
    readonly headerTextWrapping: boolean;
    readonly hoverCellHighlight: GridProperties.HoverColors;
    readonly hoverColumnHighlight: GridProperties.HoverColors;
    readonly hoverRowHighlight: GridProperties.HoverColors;
    readonly linkOnHover: boolean;
    readonly linkColor: GridProperties.Color;
    readonly linkColorOnHover: boolean;
    readonly cellPainter: string;
    readonly strikeThrough: boolean;
    readonly textTruncateType: TextTruncateType | undefined;
    readonly voffset: number;

    // grid overrides set by renderer
    selectionRegionOutlineColor: GridProperties.Color;
    selectionRegionOverlayColor: GridProperties.Color;

    // column overrides
    readonly columnName: string;
    readonly cellPadding: number;
    readonly columnAutosizing: boolean;
    readonly font: string;
    readonly format: string | undefined;
    readonly gridLinesHWidth: number;
    readonly gridLinesVWidth: number;
    readonly link: false | string | GridProperties.LinkProp | GridProperties.LinkFunction;

    // column overrides set by painters/renderer as well
    backgroundColor: GridProperties.Color;
    halign: Halign;
}
