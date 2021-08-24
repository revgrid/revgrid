
import { Column } from '../column/column';
import { Hypegrid } from '../grid/hypegrid';
import { CellEvent } from '../renderer/cell-event';
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

    inPlaceAdjacentStartWidth: number;
    inPlaceAdjacentColumn: Column;

    /**
     * @desc get the mouse x,y coordinate
     * @param event - the cell event to query
     */
    protected abstract getMouseValue(event: CellEvent): number;

    /**
     * @desc returns the index of which divider I'm over
     */
    protected abstract overAreaDivider(grid: Hypegrid, event: CellEvent): boolean;

    /**
     * @desc return the cursor name
     */
    protected abstract getCursorName(): string;

    protected abstract getGridRightBottomAligned(grid: Hypegrid): boolean;

    override handleMouseDrag(grid: Hypegrid, event: CellEvent) {
        if (this.dragColumn !== undefined) {
            const mouseValue = this.getMouseValue(event);
            let delta: number;
            if (this.getGridRightBottomAligned(grid)) {
                delta = this.dragStart - mouseValue;
            } else {
                delta = mouseValue - this.dragStart;
            }
            const dragWidth = this.dragStartWidth + delta;
            const inPlaceAdjacentWidth = this.inPlaceAdjacentStartWidth - delta;
            if (!this.inPlaceAdjacentColumn) { // nextColumn et al instance vars defined when resizeColumnInPlace (by handleMouseDown)
                grid.behavior.setColumnWidth(this.dragColumn, dragWidth);
            } else {
                const np = this.inPlaceAdjacentColumn.properties;
                const dp = this.dragColumn.properties;
                if (
                    0 < delta && delta <= (this.inPlaceAdjacentStartWidth - np.minimumColumnWidth) &&
                    (!dp.maximumColumnWidth || dragWidth <= dp.maximumColumnWidth)
                    ||
                    0 > delta && delta >= -(this.dragStartWidth - dp.minimumColumnWidth) &&
                    (!np.maximumColumnWidth || inPlaceAdjacentWidth < np.maximumColumnWidth)
                ) {
                    grid.behavior.setColumnWidth(this.dragColumn, dragWidth);
                    grid.behavior.setColumnWidth(this.inPlaceAdjacentColumn, inPlaceAdjacentWidth);
                }
            }
        } else if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
    }

    override handleMouseDown(grid: Hypegrid, event: CellEvent) {
        if (event.isHeaderRow && this.overAreaDivider(grid, event)) {
            const visibleColumnCount = grid.renderer.visibleColumns.length;
            let vc = event.visibleColumn;
            let vcIndex = vc.index;

            const gridRightBottomAligned = this.getGridRightBottomAligned(grid);
            if (!gridRightBottomAligned) {
                if (event.mousePoint.x <= 3) {
                    vcIndex--;
                    if (vcIndex < 0) {
                        return; // can't drag left-most column boundary
                    } else {
                        vc = grid.renderer.visibleColumns[vcIndex];
                        this.dragColumn = vc.column;
                        this.dragStartWidth = vc.width;
                    }
                } else {
                    this.dragColumn = event.column;
                    this.dragStartWidth = event.bounds.width;
                }
            } else {
                if (event.mousePoint.x >= event.bounds.width - 3) {
                    vcIndex++;
                    if (vcIndex >= visibleColumnCount) {
                        return; // can't drag right-most column boundary
                    } else {
                        vc = grid.renderer.visibleColumns[vcIndex];
                        this.dragColumn = vc.column;
                        this.dragStartWidth = vc.width;
                    }
                } else {
                    this.dragColumn = event.column;
                    this.dragStartWidth = event.bounds.width;
                }
            }




            // let gridColumnIndex = event.gridCell.x;

            // const gridRightBottomAligned = this.getGridRightBottomAligned(grid);
            // if (!gridRightBottomAligned) {
            //     if (event.mousePoint.x <= 3) {
            //         gridColumnIndex -= 1;
            //         if (gridColumnIndex === grid.behavior.treeColumnIndex) {
            //             gridColumnIndex--; // get row number column if tree column undefined
            //         }
            //         const vc = grid.renderer.visibleColumns[gridColumnIndex];
            //         if (vc) {
            //             this.dragColumn = vc.column;
            //             this.dragStartWidth = vc.width;
            //         } else {
            //             return; // can't drag left-most column boundary
            //         }
            //     } else {
            //         this.dragColumn = event.column;
            //         this.dragStartWidth = event.bounds.width;
            //     }
            // } else {
            //     if (event.mousePoint.x >= event.bounds.width - 3) {
            //         gridColumnIndex += 1;
            //         if (gridColumnIndex === grid.behavior.treeColumnIndex) {
            //             gridColumnIndex++; // get first data column if tree column undefined
            //         }
            //         const vc = grid.renderer.visibleColumns[gridColumnIndex];
            //         if (vc) {
            //             this.dragColumn = vc.column;
            //             this.dragStartWidth = vc.width;
            //         } else {
            //             return; // can't drag right-most column boundary
            //         }
            //     } else {
            //         this.dragColumn = event.column;
            //         this.dragStartWidth = event.bounds.width;
            //     }
            // }

            this.dragStart = this.getMouseValue(event);

            if (this.dragColumn.properties.resizeColumnInPlace) {
                let column: Column | undefined;

                if (!gridRightBottomAligned) {
                    vcIndex++;
                    if (vcIndex < visibleColumnCount) {
                        vc = grid.renderer.visibleColumns[vcIndex];
                        column = vc.column;
                    }
                } else {
                    vcIndex--;
                    if (vcIndex >= 0) {
                        vc = grid.renderer.visibleColumns[vcIndex];
                        column = vc.column;
                    }
                }

                if (column) {
                    this.inPlaceAdjacentColumn = column;
                    this.inPlaceAdjacentStartWidth = column.getWidth();
                } else {
                    this.inPlaceAdjacentColumn = undefined;
                }
            } else {
                this.inPlaceAdjacentColumn = undefined; // in case resizeColumnInPlace was previously on but is now off
            }
        } else {
            super.handleMouseDown(grid, event);
        }
    }

    override handleMouseUp(grid: Hypegrid, event: CellEvent) {
        if (this.dragColumn !== undefined) {
            this.cursor = null;
            this.dragColumn = undefined;

            event.primitiveEvent.stopPropagation();
            //delay here to give other events a chance to be dropped
            grid.behaviorShapeChanged();
        } else {
            super.handleMouseUp(grid, event);
        }
    }

    override handleMouseMove(grid: Hypegrid, event: CellEvent | undefined) {
        if (this.dragColumn === undefined) {
            this.cursor = null;

            super.handleMouseMove(grid, event);

            if (event !== undefined) {
                this.cursor = event !== undefined && event.isHeaderRow && this.overAreaDivider(grid, event) ? this.getCursorName() : null;
            }
        }
    }

    override handleDoubleClick(grid: Hypegrid, event: CellEvent) {
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
