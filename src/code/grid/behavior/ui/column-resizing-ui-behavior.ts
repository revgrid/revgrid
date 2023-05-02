
import { ViewportCell } from '../../cell/viewport-cell';
import { ColumnWidth } from '../../column/column';
import { ColumnInterface } from '../../common/column-interface';
import { UiBehavior } from './ui-behavior';

export class ColumnResizingUiBehavior extends UiBehavior {

    readonly typeName = ColumnResizingUiBehavior.typeName;

    private _dragColumn: ColumnInterface | undefined;

    /**
     * the pixel location of the where the drag was initiated
     */
    private _dragStart = -1;

    /**
     * the starting width/height of the row/column we are dragging
     */
    private _dragStartWidth = -1;

    private _inPlaceAdjacentStartWidth: number;
    private _inPlaceAdjacentColumn: ColumnInterface | undefined;

    override handleMouseDrag(event: MouseEvent, cell: ViewportCell | null | undefined) {
        if (this._dragColumn !== undefined) {
            const mouseValue = event.offsetX;
            let delta: number;
            if (this.gridProperties.gridRightAligned) {
                delta = this._dragStart - mouseValue;
            } else {
                delta = mouseValue - this._dragStart;
            }
            const dragWidth = this._dragStartWidth + delta;
            const inPlaceAdjacentWidth = this._inPlaceAdjacentStartWidth - delta;
            if (!this._inPlaceAdjacentColumn) { // nextColumn et al instance vars defined when resizeColumnInPlace (by handleMouseDown)
                this.columnsManager.setActiveColumnWidth(this._dragColumn, dragWidth, true);
            } else {
                const np = this._inPlaceAdjacentColumn.properties;
                const dp = this._dragColumn.properties;
                if (
                    0 < delta && delta <= (this._inPlaceAdjacentStartWidth - np.minimumColumnWidth) &&
                    (!dp.maximumColumnWidth || dragWidth <= dp.maximumColumnWidth)
                    ||
                    0 > delta && delta >= -(this._dragStartWidth - dp.minimumColumnWidth) &&
                    (!np.maximumColumnWidth || inPlaceAdjacentWidth < np.maximumColumnWidth)
                ) {
                    const columnWidths: ColumnWidth[] = [
                        { column: this._dragColumn, width: dragWidth },
                        { column: this._inPlaceAdjacentColumn, width: inPlaceAdjacentWidth },
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
            const canvasOffsetX = event.offsetX;
            if (cell.isHeaderRow && this.overAreaDivider(canvasOffsetX, cell)) {
                const viewportColumnCount = this.viewport.columns.length;
                let vc = cell.visibleColumn;
                let vcIndex = vc.index;

                const gridRightBottomAligned = this.gridProperties.gridRightAligned;
                if (!gridRightBottomAligned) {
                    const cellOffsetX = canvasOffsetX - cell.visibleColumn.left;
                    if (cellOffsetX <= 3) {
                        vcIndex--;
                        if (vcIndex < 0) {
                            return; // can't drag left-most column boundary
                        } else {
                            vc = this.viewport.columns[vcIndex];
                            this._dragColumn = vc.column;
                            this._dragStartWidth = vc.width;
                        }
                    } else {
                        this._dragColumn = cell.visibleColumn.column;
                        this._dragStartWidth = cell.bounds.width;
                    }
                } else {
                    if (canvasOffsetX >= cell.bounds.x + cell.bounds.width - 3) {
                        vcIndex++;
                        if (vcIndex >= viewportColumnCount) {
                            return; // can't drag right-most column boundary
                        } else {
                            vc = this.viewport.columns[vcIndex];
                            this._dragColumn = vc.column;
                            this._dragStartWidth = vc.width;
                        }
                    } else {
                        this._dragColumn = cell.visibleColumn.column;
                        this._dragStartWidth = cell.bounds.width;
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

                this._dragStart = canvasOffsetX;

                if (this._dragColumn.properties.resizeColumnInPlace) {
                    let column: ColumnInterface | undefined;

                    if (!gridRightBottomAligned) {
                        vcIndex++;
                        if (vcIndex < viewportColumnCount) {
                            vc = this.viewport.columns[vcIndex];
                            column = vc.column;
                        }
                    } else {
                        vcIndex--;
                        if (vcIndex >= 0) {
                            vc = this.viewport.columns[vcIndex];
                            column = vc.column;
                        }
                    }

                    if (column) {
                        this._inPlaceAdjacentColumn = column;
                        this._inPlaceAdjacentStartWidth = column.getWidth();
                    } else {
                        this._inPlaceAdjacentColumn = undefined;
                    }
                } else {
                    this._inPlaceAdjacentColumn = undefined; // in case resizeColumnInPlace was previously on but is now off
                }
                this.sharedState.mouseDownUpClickUsedForMoveOrResize = true;
                return cell;
            } else {
                return super.handleMouseDown(event, cell);
            }
        }
    }

    override handleMouseUp(event: MouseEvent, cell: ViewportCell | null | undefined) {
        if (this._dragColumn !== undefined) {
            this.cursor = undefined;
            this._dragColumn = undefined;

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
        if (this._dragColumn === undefined) {
            this.cursor = undefined;

            cell = super.handleMouseMove(event, cell);

            if (cell === undefined) {
                cell = this.tryGetViewportCellFromMouseEvent(event);
            }

            const canvasOffsetX = event.offsetX;
            this.cursor = cell !== null && cell.isHeaderRow && this.overAreaDivider(canvasOffsetX, cell) ? ColumnResizingUiBehavior.cursorName : undefined;
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
            const canvasOffsetX = event.offsetX;
            if (cell.isHeaderRow && this.overAreaDivider(canvasOffsetX, cell)) {
                const mouseClickNearLeft = canvasOffsetX - cell.visibleColumn.left <= 3;
                const column = mouseClickNearLeft
                    ? this.columnsManager.getActiveColumn(cell.visibleColumn.activeColumnIndex - 1)
                    : cell.visibleColumn.column;
                column.setWidthToAutoSizing();
                this.renderer.repaint();
                return cell;
            } else  {
                return super.handleDoubleClick(event, cell);
            }
        }
    }

    private overAreaDivider(canvasOffsetX: number, cell: ViewportCell): boolean {
        if (!this.gridProperties.gridRightAligned) {
            const leftMostActiveColumnIndex = 0;
            return (cell.visibleColumn.activeColumnIndex !== leftMostActiveColumnIndex && canvasOffsetX <= 3) || canvasOffsetX >= cell.bounds.width - 3;
        } else {
            const lastViewportColumnIdx = this.viewport.columns.length - 1;
            if (lastViewportColumnIdx < 0) {
                return false;
            } else {
                const lastVc = this.viewport.columns[lastViewportColumnIdx];
                const lastColumnIndex = lastVc.activeColumnIndex;
                return (canvasOffsetX >= -1 && canvasOffsetX <= 3) || (cell.visibleColumn.activeColumnIndex !== lastColumnIndex && canvasOffsetX >= cell.bounds.width - 3);
            }
        }
    }
}

export namespace ColumnResizingUiBehavior {
    export const typeName = 'columnresizing';

    export const cursorName = 'col-resize';
}
