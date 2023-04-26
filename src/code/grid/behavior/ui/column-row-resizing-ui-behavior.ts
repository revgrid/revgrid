
import { ViewportCell } from '../../cell/viewport-cell';
import { ColumnWidth } from '../../column/column';
import { ColumnInterface } from '../../common/column-interface';
import { UiBehavior } from './ui-behavior';

export abstract class ColumnRowResizingUiBehavior extends UiBehavior {
    private dragColumn: ColumnInterface | undefined;

    /**
     * the pixel location of the where the drag was initiated
     */
    protected dragStart = -1;

    /**
     * the starting width/height of the row/column we are dragging
     */
    dragStartWidth = -1;

    inPlaceAdjacentStartWidth: number;
    inPlaceAdjacentColumn: ColumnInterface | undefined;

    /**
     * @desc get the mouse x,y coordinate
     * @param event - the cell event to query
     */
    protected abstract getMouseOffset(event: MouseEvent): number;

    /**
     * @desc returns the index of which divider I'm over
     */
    protected abstract overAreaDivider(cell: ViewportCell): boolean;

    /**
     * @desc return the cursor name
     */
    protected abstract getCursorName(): string;

    protected abstract getGridRightBottomAligned(): boolean;

    override handleMouseDrag(event: MouseEvent, cell: ViewportCell | null | undefined) {
        if (this.dragColumn !== undefined) {
            const mouseValue = this.getMouseOffset(event);
            let delta: number;
            if (this.getGridRightBottomAligned()) {
                delta = this.dragStart - mouseValue;
            } else {
                delta = mouseValue - this.dragStart;
            }
            const dragWidth = this.dragStartWidth + delta;
            const inPlaceAdjacentWidth = this.inPlaceAdjacentStartWidth - delta;
            if (!this.inPlaceAdjacentColumn) { // nextColumn et al instance vars defined when resizeColumnInPlace (by handleMouseDown)
                this.columnsManager.setActiveColumnWidth(this.dragColumn, dragWidth, true);
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
                    const columnWidths: ColumnWidth[] = [
                        { column: this.dragColumn, width: dragWidth },
                        { column: this.inPlaceAdjacentColumn, width: inPlaceAdjacentWidth },
                    ];
                    this.columnsManager.setColumnWidths(columnWidths, true);
                }
            }
            return cell;
        } else {
            return super.handleMouseDrag(event, cell);
        }
    }

    override handleMouseDown(event: MouseEvent, cell: ViewportCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetViewportCellFromMouseEvent(event);
        }

        if (cell === null) {
            return super.handleMouseDown(event, cell);
        } else {
            if (cell.isHeaderRow && this.overAreaDivider(cell)) {
                const viewportColumnCount = this.viewport.columns.length;
                let vc = cell.visibleColumn;
                let vcIndex = vc.index;

                const gridRightBottomAligned = this.getGridRightBottomAligned();
                if (!gridRightBottomAligned) {
                    if (cell.mousePoint.x <= 3) {
                        vcIndex--;
                        if (vcIndex < 0) {
                            return; // can't drag left-most column boundary
                        } else {
                            vc = this.viewport.columns[vcIndex];
                            this.dragColumn = vc.activeColumn;
                            this.dragStartWidth = vc.width;
                        }
                    } else {
                        this.dragColumn = cell.column;
                        this.dragStartWidth = cell.bounds.width;
                    }
                } else {
                    if (event.offsetX >= cell.bounds.x + cell.bounds.width - 3) {
                        vcIndex++;
                        if (vcIndex >= viewportColumnCount) {
                            return; // can't drag right-most column boundary
                        } else {
                            vc = this.viewport.columns[vcIndex];
                            this.dragColumn = vc.activeColumn;
                            this.dragStartWidth = vc.width;
                        }
                    } else {
                        this.dragColumn = cell.column;
                        this.dragStartWidth = cell.bounds.width;
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

                this.dragStart = this.getMouseOffset(event);

                if (this.dragColumn.properties.resizeColumnInPlace) {
                    let column: ColumnInterface | undefined;

                    if (!gridRightBottomAligned) {
                        vcIndex++;
                        if (vcIndex < viewportColumnCount) {
                            vc = this.viewport.columns[vcIndex];
                            column = vc.activeColumn;
                        }
                    } else {
                        vcIndex--;
                        if (vcIndex >= 0) {
                            vc = this.viewport.columns[vcIndex];
                            column = vc.activeColumn;
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
                this.sharedState.mouseDownUpClickUsedForMoveOrResize = true;
                return cell;
            } else {
                return super.handleMouseDown(event, cell);
            }
        }
    }

    override handleMouseUp(event: MouseEvent, cell: ViewportCell | null | undefined) {
        if (this.dragColumn !== undefined) {
            this.cursor = undefined;
            this.dragColumn = undefined;

            event.stopPropagation();
            //delay here to give other events a chance to be dropped
            // this.behavior.behaviorShapeChanged();
            this.sharedState.mouseDownUpClickUsedForMoveOrResize = true;
            return cell;
        } else {
            return super.handleMouseUp(event, cell);
        }
    }

    override handleMouseMove(event: MouseEvent, cell: ViewportCell | null | undefined) {
        if (this.dragColumn === undefined) {
            this.cursor = undefined;

            cell = super.handleMouseMove(event, cell);

            if (cell === undefined) {
                cell = this.tryGetViewportCellFromMouseEvent(event);
            }

            this.cursor = cell !== null && cell.isHeaderRow && this.overAreaDivider(cell) ? this.getCursorName() : undefined;
        }
        return cell;
    }

    override handleDoubleClick(event: MouseEvent, cell: ViewportCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetViewportCellFromMouseEvent(event);
        }
        if (cell === null) {
            return super.handleDoubleClick(event, cell);
        } else {
            if (cell.isHeaderRow && this.overAreaDivider(cell)) {
                const grid = this.grid;
                const mouseClickNearLeft = event.offsetX - cell.visibleColumn.left <= 3;
                const column = mouseClickNearLeft
                    ? this.columnsManager.getActiveColumn(cell.gridCell.x - 1)
                    : cell.column;
                column.properties.columnAutosizing = true;
                column.properties.columnAutosized = false;  // todo: columnAutosizing should be a setter that automatically resets columnAutosized on state change to true
                setTimeout(() => { // do after next render, which measures text now that auto-sizing is on
                    grid.autosizeColumn(column);
                });
                return cell;
            } else  {
                return super.handleDoubleClick(event, cell);
            }
        }
    }
}
