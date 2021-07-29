
import { Column } from '../behaviors/column';
import { Hypergrid } from '../grid/hypergrid';
import { CellEvent } from '../lib/cell-event';
import { Feature } from './feature';

export abstract class ColumnRowResizing extends Feature {
    private dragColumn: Column | undefined;

    /**
     * the pixel location of the where the drag was initiated
     */
    protected dragStart = -1;

    /**
     * the starting width/height of the row/column we are dragging
     */
    dragStartWidth = -1;

    nextStartWidth: number;
    nextColumn: Column;

    /**
     * @desc get the mouse x,y coordinate
     * @param event - the cell event to query
     */
    protected abstract getMouseValue(event: CellEvent): number;

    /**
     * @desc returns the index of which divider I'm over
     */
    protected abstract overAreaDivider(grid: Hypergrid, event: CellEvent): boolean;

    /**
     * @desc return the cursor name
     */
    protected abstract getCursorName(): string;

    override handleMouseDrag(grid: Hypergrid, event: CellEvent) {
        if (this.dragColumn !== undefined) {
            const delta = this.getMouseValue(event) - this.dragStart;
            const dragWidth = this.dragStartWidth + delta;
            const nextWidth = this.nextStartWidth - delta;
            if (!this.nextColumn) { // nextColumn et al instance vars defined when resizeColumnInPlace (by handleMouseDown)
                grid.behavior.setColumnWidth(this.dragColumn, dragWidth);
            } else {
                const np = this.nextColumn.properties;
                const dp = this.dragColumn.properties;
                if (
                    0 < delta && delta <= (this.nextStartWidth - np.minimumColumnWidth) &&
                    (!dp.maximumColumnWidth || dragWidth <= dp.maximumColumnWidth)
                    ||
                    0 > delta && delta >= -(this.dragStartWidth - dp.minimumColumnWidth) &&
                    (!np.maximumColumnWidth || nextWidth < np.maximumColumnWidth)
                ) {
                    grid.behavior.setColumnWidth(this.dragColumn, dragWidth);
                    grid.behavior.setColumnWidth(this.nextColumn, nextWidth);
                }
            }
        } else if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
    }

    override handleMouseDown(grid: Hypergrid, event: CellEvent) {
        if (event.isHeaderRow && this.overAreaDivider(grid, event)) {
            let gridColumnIndex = event.gridCell.x;

            if (event.mousePoint.x <= 3) {
                gridColumnIndex -= 1;
                const vc = grid.renderer.visibleColumns[gridColumnIndex] ||
                    grid.renderer.visibleColumns[gridColumnIndex - 1]; // get row number column if tree column undefined
                if (vc) {
                    this.dragColumn = vc.column;
                    this.dragStartWidth = vc.width;
                } else {
                    return; // can't drag left-most column boundary
                }
            } else {
                this.dragColumn = event.column;
                this.dragStartWidth = event.bounds.width;
            }

            this.dragStart = this.getMouseValue(event);

            if (this.dragColumn.properties.resizeColumnInPlace) {
                gridColumnIndex += 1;
                const vc = grid.renderer.visibleColumns[gridColumnIndex] ??
                    grid.renderer.visibleColumns[gridColumnIndex + 1]; // get first data column if tree column undefined;
                if (vc) {
                    this.nextColumn = vc.column;
                    this.nextStartWidth = this.nextColumn.getWidth();
                } else {
                    this.nextColumn = undefined;
                }
            } else {
                this.nextColumn = undefined; // in case resizeColumnInPlace was previously on but is now off
            }
        } else if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    }

    override handleMouseUp(grid: Hypergrid, event: CellEvent) {
        if (this.dragColumn !== undefined) {
            this.cursor = null;
            this.dragColumn = undefined;

            event.primitiveEvent.stopPropagation();
            //delay here to give other events a chance to be dropped
            grid.behaviorShapeChanged();
        } else if (this.next) {
            this.next.handleMouseUp(grid, event);
        }
    }

    override handleMouseMove(grid: Hypergrid, event: CellEvent | undefined) {
        if (this.dragColumn === undefined) {
            this.cursor = null;

            super.handleMouseMove(grid, event);

            if (event !== undefined) {
                this.cursor = event !== undefined && event.isHeaderRow && this.overAreaDivider(grid, event) ? this.getCursorName() : null;
            }
        }
    }

    override handleDoubleClick(grid: Hypergrid, event: CellEvent) {
        if (event.isHeaderRow && this.overAreaDivider(grid, event)) {
            const column = event.mousePoint.x <= 3
                ? grid.behavior.getActiveColumn(event.gridCell.x - 1)
                : event.column;
            column.properties.columnAutosizing = true;
            column.properties.columnAutosized = false;  // todo: columnAutosizing should be a setter that automatically resets columnAutosized on state change to true
            setTimeout(() => { // do after next render, which measures text now that auto-sizing is on
                grid.autosizeColumn(column);
            });
        } else if (this.next) {
            this.next.handleDoubleClick(grid, event);
        }
    }
}
