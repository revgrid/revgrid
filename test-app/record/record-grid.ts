import {
    RevColumn,
    RevLinedHoverCell,
    RevListChangedTypeId,
    RevPoint,
    RevRecordGrid,
    RevSimpleBehavioredColumnSettings,
    RevViewCell
} from '../..';
import { AppBehavioredGridSettings } from './app-behaviored-grid-settings';
import {
    GridField
} from './grid-field';

export class RecordGrid extends RevRecordGrid<
        AppBehavioredGridSettings,
        RevSimpleBehavioredColumnSettings,
        GridField
    > {
    columnSortEventer: RecordGrid.ColumnSortEventer | undefined;
    columnsWidthChangedEventer: RecordGrid.ColumnsWidthChangedEventer | undefined;
    cellFocusChangedEventer: RecordGrid.CellFocusChangedEventer | undefined;
    cellClickEventer: RecordGrid.CellClickEventer | undefined;
    cellDblClickEventer: RecordGrid.CellDblClickEventer | undefined;
    resizedEventer: RecordGrid.ResizedEventer | undefined;
    fieldColumnListChanged: RecordGrid.FieldColumnListChanged | undefined;
    columnsViewWidthsChangedEventer: RecordGrid.ColumnsViewWidthsChangedEventer | undefined;
    renderedEventer: RecordGrid.RenderedEventer | undefined;

    get columnCount(): number { return this.activeColumnCount; }

    protected override descendantProcessColumnsWidthChanged(columns: RevColumn<RevSimpleBehavioredColumnSettings, GridField>[], ui: boolean) {
        super.descendantProcessColumnsWidthChanged(columns, ui);

        if (this.columnsWidthChangedEventer !== undefined) {
            this.columnsWidthChangedEventer(columns);
        }
    }

    protected override descendantProcessColumnSort(event: MouseEvent, headerOrFixedRowCell: RevViewCell<RevSimpleBehavioredColumnSettings, GridField>) {
        super.descendantProcessColumnSort(event, headerOrFixedRowCell);

        if (this.columnSortEventer !== undefined) {
            this.columnSortEventer(headerOrFixedRowCell);
        }
    }

    protected override descendantProcessClick(event: MouseEvent, hoverCell: RevLinedHoverCell<RevSimpleBehavioredColumnSettings, GridField> | null | undefined) {
        if (hoverCell === null) {
            hoverCell = this.viewLayout.findLinedHoverCellAtCanvasOffset(event.offsetX, event.offsetY);
        }

        if (hoverCell !== undefined) {
            if (!RevLinedHoverCell.isMouseOverLine(hoverCell) && this.cellClickEventer !== undefined) {
                const viewCell = hoverCell.viewCell;
                this.cellClickEventer(viewCell);
            }
        }
    }

    protected override descendantProcessDblClick(event: MouseEvent, hoverCell: RevLinedHoverCell<RevSimpleBehavioredColumnSettings, GridField> | null | undefined) {
        if (hoverCell === null) {
            hoverCell = this.viewLayout.findLinedHoverCellAtCanvasOffset(event.offsetX, event.offsetY);
        }

        if (hoverCell !== undefined) {
            if (!RevLinedHoverCell.isMouseOverLine(hoverCell) && this.cellDblClickEventer !== undefined) {
                const viewCell = hoverCell.viewCell;
                this.cellDblClickEventer(viewCell);
            }
        }
    }

    protected override descendantProcessCellFocusChanged(newPoint: RevPoint | undefined, oldPoint: RevPoint | undefined) {
        if (this.cellFocusChangedEventer !== undefined) {
            this.cellFocusChangedEventer(newPoint, oldPoint);
        }
    }

    protected override descendantProcessResized() {
        if (this.resizedEventer !== undefined) {
            this.resizedEventer();
        }
    }

    protected override descendantProcessColumnsViewWidthsChanged() {
        if (this.columnsViewWidthsChangedEventer !== undefined) {
            this.columnsViewWidthsChangedEventer();
        }
    }

    protected override descendantProcessRendered() {
        if (this.renderedEventer !== undefined) {
            this.renderedEventer();
        }
    }
}

export namespace RecordGrid {
    export type FieldNameToHeaderMap = Map<string, string | undefined>;

    export type CtrlKeyMouseMoveEventer = (this: void) => void;
    export type CellFocusChangedEventer = (this: void, newFocusPoint: RevPoint | undefined, oldFocusPoint: RevPoint | undefined) => void;
    export type CellClickEventer = (this: void, viewCell: RevViewCell<RevSimpleBehavioredColumnSettings, GridField>) => void;
    export type CellDblClickEventer = (this: void, viewCell: RevViewCell<RevSimpleBehavioredColumnSettings, GridField>) => void;
    export type ResizedEventer = (this: void) => void;
    export type ColumnsViewWidthsChangedEventer = (this: void) => void;
    export type RenderedEventer = (this: void) => void;
    export type ColumnSortEventer = (this: void, headerOrFixedRowCell: RevViewCell<RevSimpleBehavioredColumnSettings, GridField>) => void;
    export type ColumnsWidthChangedEventer = (this: void, columns: RevColumn<RevSimpleBehavioredColumnSettings, GridField>[]) => void;
    export type FieldColumnListChanged = (typeId: RevListChangedTypeId, index: number, count: number, targetIndex: number) => void;

    export type RenderedCallback = (this: void) => void;
}

