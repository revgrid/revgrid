import { CellPainter } from '../cell-painter/cell-painter';
import { ColumnProperties } from '../column/column-properties';
import { ColumnInterface } from '../common/column-interface';
import { SubgridInterface } from '../common/subgrid-interface';
import { DataModel } from '../grid-public-api';
import { Point, WritablePoint } from '../lib/point';
import { Rectangle, RectangleInterface } from '../lib/rectangle';
import { MetaModel } from '../model/meta-model';
import { Renderer } from '../renderer/renderer';
import { Revgrid } from '../revgrid';
import { Subgrid } from '../subgrid/subgrid';

export abstract class RenderedCell {

    // caches
    cellOwnProperties: MetaModel.CellOwnProperties | undefined; // only get via CellPropertiesBehavior
    public _bounds: RenderedCell.Bounds | undefined;
    private _columnProperties: ColumnProperties | undefined;

    // this.disabled: boolean;

    private readonly renderer: Renderer;

    cellPainter: CellPainter;
    clickRect: Rectangle | undefined;
    clientPoint: Point;
    column: ColumnInterface;
    dataCell: WritablePoint = {} as WritablePoint; // no need for initialization
    // dataRow: DataRowObject;
    format: string;
    gridCell: WritablePoint = {} as WritablePoint; // no need for initialization
    gridPoint: Point;
    mousePoint: Point;
    pagePoint: Point;
    row: unknown;
    subgrid: SubgridInterface;
    visibleColumn: Renderer.VisibleColumn;
    visibleRow: Renderer.VisibleRow;


    /**
     * @summary Create a new CellEvent object.
     * @param gridX - grid cell coordinate (adjusted for horizontal scrolling after fixed columns).
     * @param gridY - grid cell coordinate, adjusted (adjusted for vertical scrolling if data subgrid)
     */
    constructor(public grid: Revgrid, public gridX?: number, public gridY?: number) {
        this.renderer = grid.renderer;
        if (gridX !== undefined && gridY !== undefined) {
            this.resetGridCY(gridX, gridY);
        }
    }

    // special method for use by renderer which reuses cellEvent object for performance reasons
    reset(visibleColumn: Renderer.VisibleColumn, visibleRow: Renderer.VisibleRow) {
        // getter caches
        this._columnProperties = undefined;
        this.cellOwnProperties = undefined;
        this._bounds = undefined;

        // this.disabled = undefined;

        this.visibleColumn = visibleColumn;
        this.visibleRow = visibleRow;

        this.subgrid = visibleRow.subgrid;

        this.column = visibleColumn.column; // enumerable so will be copied to cell renderer object

        this.gridCell.x = visibleColumn.activeColumnIndex;
        this.gridCell.y = visibleRow.index;

        this.dataCell.x = this.column && this.column.index;
        this.dataCell.y = visibleRow.rowIndex;
    }

    /**
     * Set up this `CellEvent` instance to point to the cell at the given grid coordinates.
     * @desc If the requested cell is not be visible (due to being scrolled out of view or outside the bounds of the rendered grid), the instance is not reset.
     * @param gridC - Horizontal grid cell coordinate adjusted for horizontal scrolling after fixed columns.
     * @param gridY - Raw vertical grid cell coordinate.
     * @returns Visibility.
     */
    resetGridCY(gridC: number, gridY: number) {
        const vc = this.renderer.getVisibleColumn(gridC);
        if (vc === undefined) {
            return false;
        } else {
            const vr = this.renderer.getVisibleRow(gridY);
            if (vr === undefined) {
                return false;
            } else {
                this.reset(vc, vr);
                return true;
            }
        }
    }

    /**
     * Set up this `CellEvent` instance to point to the cell at the given grid coordinates.
     * @desc If the requested cell is not be visible (due to being scrolled out of view or outside the bounds of the rendered grid), the instance is not reset.
     * @param gridX - Raw horizontal grid cell coordinate.
     * @param gridY - Raw vertical grid cell coordinate.
     * @returns Visibility.
     */
    resetGridXY(gridX: number, gridY: number) {
        const vc = this.renderer.visibleColumns[gridX];
        if (vc === undefined) {
            return false;
        } else {
            const vr = this.renderer.getVisibleRow(gridY);
            if (vr === undefined) {
                return false;
            } else {
                this.reset(vc, vr);
                return true;
            }
        }
    }

    /**
     * @summary Set up this `CellEvent` instance to point to the cell at the given data coordinates.
     * @desc If the requested cell is not be visible (due to being scrolled out of view), the instance is not reset.
     * @param dataX - Horizontal data cell coordinate.
     * @param dataY - Vertical data cell coordinate.
     * @returns Visibility.
     */
    resetDataXY(dataX: number, dataY: number, subgrid: Subgrid) {
        const vc = this.renderer.getVisibleDataColumn(dataX);
        if (vc === undefined) {
            return false;
        } else {
            const vr = this.renderer.getVisibleDataRow(dataY, subgrid);
            if (vr === undefined) {
                return false;
            } else {
                this.reset(vc, vr);
                return true;
            }
        }
    }

    /**
     * Set up this `CellEvent` instance to point to the cell at the given grid column and data row coordinates.
     * @desc If the requested cell is not be visible (due to being scrolled out of view or outside the bounds of the rendered grid), the instance is not reset.
     * @param gridX - Horizontal grid cell coordinate (adjusted for horizontal scrolling after fixed columns).
     * @param dataY - Vertical data cell coordinate.
     * @param subgrid
     * @param useAllCells - Search in all rows and columns instead of only rendered ones.
     * @returns True if cell was reset.
     */
    resetGridXDataY(gridX: number, dataY: number, subgrid: SubgridInterface, useAllCells?: boolean) {
        if (useAllCells) {
            // When expanding selections larger than the viewport, the origin/corner
            // points may not be rendered and would normally fail to reset cell's position.
            // Mock column and row objects for this.reset() to use:
            const vc = {
                column: this.grid.getAllColumn(gridX), // pick any valid column (gridX will always index a valid column)
                activeColumnIndex: gridX,
                index: -1,
                left: -1,
                rightPlus1: -1,
                top: -1,
                bottom: -1,
                width: -1,
            };
            const vr: Renderer.VisibleRow = {
                rowIndex: dataY,
                index: -1,
                subgrid,
                top: -1,
                bottom: -1,
                height: -1,
            };
            this.reset(vc, vr);
            return true;
        } else {
            const vc = this.renderer.getVisibleColumn(gridX);
            if (vc === undefined) {
                return false;
            } else {
                const vr = this.renderer.getVisibleDataRow(dataY, subgrid);
                if (vr === undefined) {
                    return false;
                } else {
                    this.reset(vc, vr);
                    return true;
                }
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
        return this.subgrid.getValue(this.column, this.dataCell.y);
    }
    set value(value: DataModel.DataValue) {
        this.subgrid.setValue(this.column, this.dataCell.y, value);
    }

    /**
     * The bounds of the cell.
     */
    get bounds(): RenderedCell.Bounds {
        if (this._bounds === undefined) {
            this._bounds = {
                x: this.visibleColumn.left,
                y: this.visibleRow.top,
                width: this.visibleColumn.width,
                height: this.visibleRow.height
            }
        }
        return this._bounds;
    }

    get columnProperties() {
        let cp = this._columnProperties;
        if (!cp) {
            cp = this.column.properties;
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

    //     cellEvent.resetGridXY(this.visibleColumn.index, this.visibleRow.index);

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

    get mousePointInClickRect() {
        const clickRect = this.clickRect; // ?? this.properties.clickRect;
        if (clickRect === undefined) {
            return true;
        // } else if (typeof clickRect.contains === 'function') {
        //     return clickRect.contains(this.mousePoint);
        } else {
            return (
                clickRect.x <= this.mousePoint.x && this.mousePoint.x < clickRect.x + clickRect.width &&
                clickRect.y <= this.mousePoint.y && this.mousePoint.y < clickRect.y + clickRect.height
            );
        }
    }

    /**
     * "Visible" means scrolled into view.
     */
    get isRowVisible() {
        return !!this.visibleRow;
    }
    /**
     * "Visible" means scrolled into view.
     */
    get isColumnVisible() {
        return !!this.visibleColumn;
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
     * A data column is any column that is not the row number column or the tree column.
     */
    get isDataColumn() {
        return true; // this.gridCell.x >= 0;
    }

    /**
     * A data cell is a cell in both a data row and a data column.
     */
    get isDataCell() {
        return this.isMainRow && this.isDataColumn;
    }

    get isRowHovered() {
        const hovered =
            this.grid.canvas.hasMouse &&
            this.isMainRow &&
            (this.grid.hoverGridCell !== undefined) &&
            (this.grid.hoverGridCell.y === this.gridCell.y);
        return hovered;
    }

    get isColumnHovered() {
        const hovered =
            this.grid.canvas.hasMouse &&
            this.isDataColumn &&
            (this.grid.hoverGridCell !== undefined) &&
            (this.grid.hoverGridCell.x === this.gridCell.x);
        return hovered;
    }

    get isCellHovered() {
        return this.isRowHovered && this.isColumnHovered;
    }

    get isRowFixed() {
        return this.isMainRow && this.dataCell.y < this.grid.properties.fixedRowCount;
    }

    get isColumnFixed() {
        return this.isDataColumn && this.gridCell.x < this.grid.properties.fixedColumnCount;
    }

    get isCellFixed() {
        return this.isRowFixed && this.isColumnFixed;
    }

    get isHeaderRow() {
        return this.subgrid.isHeader;
    }

    get isHeaderCell() {
        return this.isHeaderRow && this.isDataColumn;
    }

    get isFilterRow() {
        return this.subgrid.isFilter;
    }

    get isFilterCell() {
        return this.isFilterRow && this.isDataColumn;
    }

    get isSummaryRow() {
        return this.subgrid.isSummary;
    }

    get isSummaryCell() {
        return this.isSummaryRow && this.isDataColumn;
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
}

export namespace RenderedCell {
    export interface Bounds extends RectangleInterface {
    }
}
