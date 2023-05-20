import { ColumnSettings } from '../../interfaces/column-settings';
import { DataModel } from '../../interfaces/data-model';
import { MetaModel } from '../../interfaces/meta-model';
import { SubgridInterface } from '../../interfaces/subgrid-interface';
import { ViewLayoutColumn } from '../../interfaces/view-layout-column';
import { ViewLayoutRow } from '../../interfaces/view-layout-row';
import { RectangleInterface } from '../../lib/rectangle-interface';
import { ColumnsManager } from '../column/columns-manager';

/** @public */
export class ViewCell {
    format: string;
    subgrid: SubgridInterface;
    viewLayoutColumn: ViewLayoutColumn;
    viewLayoutRow: ViewLayoutRow;

    // partial render support
    paintFingerprint: ViewCell.PaintFingerprint | undefined;

    // caches
    cellOwnProperties: MetaModel.CellOwnProperties | undefined; // only get via CellPropertiesBehavior
    private _bounds: ViewCell.Bounds | undefined;
    private _columnProperties: ColumnSettings | undefined;

    constructor(private readonly _columnsManager: ColumnsManager) {
    }

    // special method for use by renderer which reuses cellEvent object for performance reasons
    reset(viewLayoutColumn: ViewLayoutColumn, viewLayoutRow: ViewLayoutRow) {
        // getter caches
        this._columnProperties = undefined;
        this.cellOwnProperties = undefined;
        this._bounds = undefined;

        // this.disabled = undefined;

        this.viewLayoutColumn = viewLayoutColumn;
        this.viewLayoutRow = viewLayoutRow;

        this.subgrid = viewLayoutRow.subgrid;

        this.paintFingerprint = undefined;
    }

    /**
     * Set up this `CellEvent` instance to point to the cell at the given grid coordinates.
     * @desc If the requested cell is not be visible (due to being scrolled out of view or outside the bounds of the rendered grid), the instance is not reset.
     * @param gridX - Raw horizontal grid cell coordinate.
     * @param gridY - Raw vertical grid cell coordinate.
     * @returns Visibility.
     */
    resetGridXY(vc: ViewLayoutColumn | undefined, vr: ViewLayoutRow | undefined) {
        if (vc === undefined) {
            return false;
        } else {
            if (vr === undefined) {
                return false;
            } else {
                this.reset(vc, vr);
                return true;
            }
        }
    }

    clearCellOwnProperties() {
        this.cellOwnProperties = undefined;
    }

    /**
     * The raw value of the cell, unformatted.
     */
    get value() {
        return this.subgrid.getValue(this.viewLayoutColumn.column, this.viewLayoutRow.subgridRowIndex);
    }
    set value(value: DataModel.DataValue) {
        this.subgrid.setValue(this.viewLayoutColumn.column, this.viewLayoutRow.subgridRowIndex, value);
    }

    /**
     * The bounds of the cell.
     */
    get bounds(): ViewCell.Bounds {
        if (this._bounds === undefined) {
            this._bounds = {
                x: this.viewLayoutColumn.left,
                y: this.viewLayoutRow.top,
                width: this.viewLayoutColumn.width,
                height: this.viewLayoutRow.height
            }
            return this._bounds;
        } else {
            return this._bounds;
        }
    }

    get columnProperties() {
        let cp = this._columnProperties;
        if (!cp) {
            cp = this.viewLayoutColumn.column.settings;
            // Next 5 lines were commented out in TypeScript conversion
            // if (this.isHeaderRow || this.isSummaryRow) {
            //     cp = cp.columnHeader;
            // } else if (this.isFilterRow) {
            //     cp = cp.filterProperties;
            // }

            // isDataColumn: cp already set to cp.rowHeader or cp.treeHeader
            // isDataRow: cp already set to basic props

            this._columnProperties = cp;
        }
        return cp;
    }

    /**
     * Copy self with or without own properties
     * @param assign - Copy the own properties to the clone.
     */
    // clone(assign = false) {
    //     const cellEvent = new CellInfo(this.grid, this.gridX, this.gridY);

    //     cellEvent.resetGridXY(this.visibleColumn.index, this.viewLayoutRow.index);

    //     if (assign) {
    //         cellEvent.renderer = this.renderer;
    //         cellEvent.selectionModel = this.selectionModel;
    //         cellEvent.behavior = this.behavior;
    //         cellEvent.dataModel = this.dataModel;
    //         cellEvent.subgrid = this.subgrid;
    //         cellEvent.dataCell = this.dataCell;
    //         cellEvent.gridCell = this.gridCell;
    //         cellEvent.visibleColumn = this.visibleColumn;
    //         cellEvent.visibleRow = this.visibleRow;
    //         cellEvent.column = this.column;
    //     }

    //     return cellEvent;
    // }

    /**
     * "Visible" means scrolled into view.
     */
    get isRowVisible() {
        return !!this.viewLayoutRow;
    }
    /**
     * "Visible" means scrolled into view.
     */
    get isColumnVisible() {
        return !!this.viewLayoutColumn;
    }
    /**
     * "Visible" means scrolled into view.
     */
    get isCellVisible() {
        return this.isRowVisible && this.isColumnVisible;
    }

    /**
     * A data row is any row in the data subgrid; all other rows (headers, footers, _etc._) are not data rows.
     */
    get isMainRow() {
        return this.subgrid.isMain;
    }

    /**
     * A data cell is a cell in both a data row and a data column.
     */
    get isDataCell() {
        return this.isMainRow;
    }

    get isRowFixed() {
        return this.subgrid.isRowFixed(this.viewLayoutRow.subgridRowIndex);
    }

    get isColumnFixed() {
        return this._columnsManager.isColumnFixed(this.viewLayoutColumn.activeColumnIndex);
    }

    get isCellFixed() {
        return this.isRowFixed && this.isColumnFixed;
    }

    get isHeaderRow() {
        return this.subgrid.isHeader;
    }

    get isHeaderCell() {
        return this.isHeaderRow;
    }

    get isFilterRow() {
        return this.subgrid.isFilter;
    }

    get isFilterCell() {
        return this.isFilterRow;
    }

    get isSummaryRow() {
        return this.subgrid.isSummary;
    }

    get isSummaryCell() {
        return this.isSummaryRow;
    }

    // get isTopTotalsRow() {
    //     return this.subgrid === this.behavior.subgrids.lookup.topTotals;
    // }

    // get isTopTotalsHandle() {
    //     return this.isTopTotalsRow && this.isHandleColumn;
    // }

    // get isTopTotalsCell() {
    //     return this.isTopTotalsRow && this.isDataColumn;
    // }

    // get isBottomTotalsRow() {
    //     return this.subgrid === this.behavior.subgrids.lookup.bottomTotals;
    // }

    // get isBottomTotalsHandle() {
    //     return this.isBottomTotalsRow && this.isHandleColumn;
    // }

    // get isBottomTotalsCell() {
    //     return this.isBottomTotalsRow && this.isDataColumn;
    // }

    getRowProperties() {
        return this.subgrid.getRowProperties(this.viewLayoutRow.subgridRowIndex);
    }

    getRowProperty(key: string) {
        // undefined return means there is no row properties object OR no such row property `[key]`
        return this.subgrid.getRowProperty(this.viewLayoutRow.subgridRowIndex, key);
    }

    setRowPropertyRC(key: string, value: unknown) {
        // creates new object as needed
        const rowProperties = this.getRowProperties();
        if (rowProperties !== undefined) {
            (rowProperties[key as keyof MetaModel.RowProperties] as unknown) = value; // todo: call `stateChanged()` after refac-as-flags
        }
    }

}

/** @public */
export namespace ViewCell {
    export type PaintFingerprint = Record<string, unknown>;

    export interface Bounds extends RectangleInterface {
    }

    export function sameByDataPoint(left: ViewCell, right: ViewCell) {
        return (
            left.viewLayoutRow.subgridRowIndex === right.viewLayoutRow.subgridRowIndex &&
            left.viewLayoutColumn.column.index === right.viewLayoutColumn.column.index &&
            left.subgrid === right.subgrid
        );
    }
}
