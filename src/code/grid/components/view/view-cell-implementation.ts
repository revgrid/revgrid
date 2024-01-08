import { MetaModel } from '../../interfaces/data/meta-model';
import { Subgrid } from '../../interfaces/data/subgrid';
import { ViewCell } from '../../interfaces/data/view-cell';
import { ViewLayoutRow } from '../../interfaces/data/view-layout-row';
import { DatalessViewCell } from '../../interfaces/dataless/dataless-view-cell';
import { ViewLayoutColumn } from '../../interfaces/dataless/view-layout-column';
import { SchemaField } from '../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { Rectangle } from '../../types-utils/rectangle';
import { ColumnsManager } from '../column/columns-manager';

/** @internal */
export class ViewCellImplementation<BCS extends BehavioredColumnSettings, SF extends SchemaField> implements ViewCell<BCS, SF> {
    /** Set by some Grid Painters to record out cell was painted. If fingerprint is same on successive repaints of cell, then
     * cell does not need to be repainted
     * @internal
     */
    paintFingerprint: DatalessViewCell.PaintFingerprint | undefined;
    // own properties cache
    cellOwnProperties: MetaModel.CellOwnProperties | undefined; // only get via CellPropertiesBehavior

    /** @internal */
    private _subgrid: Subgrid<BCS, SF>;
    /** @internal */
    private _viewLayoutColumn: ViewLayoutColumn<BCS, SF>;
    /** @internal */
    private _viewLayoutRow: ViewLayoutRow<BCS, SF>;

    // caches
    /** @internal */
    private _bounds: Rectangle | undefined;
    /** @internal */
    private _columnSettings: BCS | undefined;

    /** @internal */
    constructor(
        /** @internal */
        private readonly _columnsManager: ColumnsManager<BCS, SF>) {
    }

    get subgrid() { return this._subgrid; }
    get viewLayoutColumn() { return this._viewLayoutColumn; }
    get viewLayoutRow() { return this._viewLayoutRow; }

    /**
     * The raw value of the cell, unformatted.
     */
    get viewValue() {
        return this._subgrid.getViewValue(this._viewLayoutColumn.column, this._viewLayoutRow.subgridRowIndex);
    }

    /**
     * The bounds of the cell.
     */
    get bounds(): Rectangle {
        if (this._bounds === undefined) {
            this._bounds = {
                x: this._viewLayoutColumn.left,
                y: this._viewLayoutRow.top,
                width: this._viewLayoutColumn.width,
                height: this._viewLayoutRow.height
            }
            return this._bounds;
        } else {
            return this._bounds;
        }
    }

    get columnSettings() {
        let columnSettings = this._columnSettings;
        if (columnSettings === undefined) {
            columnSettings = this._viewLayoutColumn.column.settings;
            this._columnSettings = columnSettings;
        }
        return columnSettings;
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
        return !!this._viewLayoutRow;
    }
    /**
     * "Visible" means scrolled into view.
     */
    get isColumnVisible() {
        return !!this._viewLayoutColumn;
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
        return this._subgrid.isMain;
    }

    /**
     * A data cell is a cell in both a data row and a data column.
     */
    get isMain() {
        return this.isMainRow;
    }

    get isHeader() {
        return this._subgrid.isHeader;
    }

    get isRowFixed() {
        return this._subgrid.isRowFixed(this._viewLayoutRow.subgridRowIndex);
    }

    get isColumnFixed() {
        return this._columnsManager.isColumnFixed(this._viewLayoutColumn.activeColumnIndex);
    }

    get isFixed() {
        return this.isRowFixed && this.isColumnFixed;
    }

    get isHeaderOrRowFixed() {
        const subgrid = this._subgrid;
        return subgrid.isHeader || subgrid.isRowFixed(this._viewLayoutRow.subgridRowIndex);
    }

    get isScrollable() {
        return (
            !this._subgrid.isRowFixed(this._viewLayoutRow.subgridRowIndex) &&
            !this._columnsManager.isColumnFixed(this._viewLayoutColumn.activeColumnIndex) &&
            this.isMainRow
        )
    }

    get isFilter() {
        return this._subgrid.isFilter;
    }

    get isSummary() {
        return this._subgrid.isSummary;
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

    clearCellOwnProperties() {
        this.cellOwnProperties = undefined;
    }

    getRowProperties() {
        return this._subgrid.getRowProperties(this._viewLayoutRow.subgridRowIndex);
    }

    getRowProperty(key: string) {
        // undefined return means there is no row properties object OR no such row property `[key]`
        return this._subgrid.getRowProperty(this._viewLayoutRow.subgridRowIndex, key);
    }

    setRowPropertyRC(key: string, value: unknown) {
        // creates new object as needed
        const rowProperties = this.getRowProperties();
        if (rowProperties !== undefined) {
            rowProperties[key as keyof MetaModel.RowProperties] = value; // todo: call `stateChanged()` after refac-as-flags
        }
    }

    /** special method for use by renderer which reuses cellEvent object for performance reasons
     * @internal */
    reset(viewLayoutColumn: ViewLayoutColumn<BCS, SF>, viewLayoutRow: ViewLayoutRow<BCS, SF>) {
        // getter caches
        this._columnSettings = undefined;
        this.cellOwnProperties = undefined;
        this._bounds = undefined;

        // this.disabled = undefined;

        this._viewLayoutColumn = viewLayoutColumn;
        this._viewLayoutRow = viewLayoutRow;

        this._subgrid = viewLayoutRow.subgrid;

        this.paintFingerprint = undefined;
    }

    /**
     * Set up this `CellEvent` instance to point to the cell at the given grid coordinates.
     * @desc If the requested cell is not be visible (due to being scrolled out of view or outside the bounds of the rendered grid), the instance is not reset.
     * @param gridX - Raw horizontal grid cell coordinate.
     * @param gridY - Raw vertical grid cell coordinate.
     * @returns Visibility.
     * @internal
     */
    resetGridXY(vc: ViewLayoutColumn<BCS, SF> | undefined, vr: ViewLayoutRow<BCS, SF> | undefined) {
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

}
