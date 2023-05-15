import {
    DataModel,
    Halign,
    IndexSignatureHack,
    RectangleInterface,
    TextTruncateType,
    WritablePoint
} from '../../grid/grid-public-api';
import { GridSettings } from '../../grid/interfaces/grid-settings';

/** @public */
export interface SimpleCellPaintConfig {
    // not overrides
    dataCell: WritablePoint;
    allRowsSelected: boolean;
    bounds: RectangleInterface;
    dataRow: DataModel.DataRow;
    isCellFocused: boolean;
    isCellHovered: boolean;
    isCellSelected: boolean;
    isColumnHovered: boolean;
    isColumnSelected: boolean;
    isMainRow: boolean;
    isFilterRow: boolean;
    isHeaderRow: boolean;
    isRowHovered: boolean;
    isRowFocused: boolean;
    isRowSelected: boolean;
    isSelected: boolean;
    isUserDataArea: boolean;
    prefillColor: GridSettings.Color | undefined;
    value: unknown;

    // set by painter
    snapshot: SimpleCellPaintConfig.Snapshot | undefined;

    // grid overrides
    readonly focusedCellBorderColor: GridSettings.Color;
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

/** @public */
export namespace SimpleCellPaintConfig {
    export interface SnapshotInterface {
        readonly value: string;
        readonly textColor: string;
        readonly textFont: string;
        readonly borderColor: string | undefined;
        readonly firstColorIsFill: boolean;
        readonly layerColors: string[];
    }

    export type Snapshot = IndexSignatureHack<SnapshotInterface>;
}
