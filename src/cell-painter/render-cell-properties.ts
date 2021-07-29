import { WritablePoint } from '../dependencies/point';
import { Rectangle, RectangleInterface } from '../dependencies/rectangular';
import { HypergridProperties } from '../grid/hypergrid-properties';
import { DataModel } from '../lib/data-model';
import { Localization } from '../lib/localization';

export interface RenderCellProperties {
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
    backgroundSelectionColor?: HypergridProperties.Color;
    centerIcon?: string;
    color?: HypergridProperties.Color;
    foregroundSelectionColor?: HypergridProperties.Color;
    foregroundSelectionFont?: string;
    headerTextWrapping?: boolean;
    hoverCellHighlight?: HypergridProperties.HoverColors;
    hoverColumnHighlight?: HypergridProperties.HoverColors;
    hoverRowHighlight?: HypergridProperties.HoverColors;
    iconPadding?: number;
    leftIcon?: string;
    linkOnHover?: boolean;
    linkColor?: HypergridProperties.Color;
    linkColorOnHover?: boolean;
    renderer?: string;
    renderFalsy?: boolean;
    rightIcon?: string;
    rowHeaderNumbers?: boolean;
    selectionRegionOutlineColor?: HypergridProperties.Color;
    selectionRegionOverlayColor?: HypergridProperties.Color;
    strikeThrough?: boolean;
    truncateTextWithEllipsis?: boolean | null;
    voffset?: number;

    // column overrides
    boxSizing?: string;
    cellPadding?: number;
    columnAutosizing?: boolean;
    font?: string;
    format?: string;
    gridLinesHWidth?: number;
    gridLinesVWidth?: number;
    link?: false | string | HypergridProperties.LinkProp | HypergridProperties.LinkFunction;

    // column overrides set by painters/renderer as well
    backgroundColor?: HypergridProperties.Color;
    halign?: HypergridProperties.Halign;
}

export namespace RenderCellProperties {
    export interface Snapshot {
        value: string;
        foundationColor: boolean;
        textColor: string;
        textFont: string;
        colors: string[];
    }
}
