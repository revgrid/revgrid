
import { ViewCell } from '../../components/cell/view-cell';
import { ColumnWidth } from '../../components/column/column';
import { ColumnInterface } from '../../interfaces/column-interface';
import { UiBehavior } from './ui-behavior';

/** @internal */
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

    override handlePointerDrag(event: PointerEvent, cell: ViewCell | null | undefined) {
        if (this._dragColumn !== undefined) {
            const mouseValue = event.offsetX;
            let delta: number;
            if (this.gridSettings.gridRightAligned) {
                delta = this._dragStart - mouseValue;
            } else {
                delta = mouseValue - this._dragStart;
            }
            const dragWidth = this._dragStartWidth + delta;
            const inPlaceAdjacentWidth = this._inPlaceAdjacentStartWidth - delta;
            if (!this._inPlaceAdjacentColumn) { // nextColumn et al instance vars defined when resizeColumnInPlace (by handleMouseDown)
                this.columnsManager.setActiveColumnWidth(this._dragColumn, dragWidth, true);
            } else {
                const np = this._inPlaceAdjacentColumn.settings;
                const dp = this._dragColumn.settings;
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
            return super.handlePointerDrag(event, cell);
        }
    }

    override handlePointerDown(event: PointerEvent, cell: ViewCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetViewCellFromMouseEvent(event);
        }

        if (cell === null) {
            return super.handlePointerDown(event, cell);
        } else {
            const canvasOffsetX = event.offsetX;
            if (cell.isHeader && this.overAreaDivider(canvasOffsetX, cell)) {
                const viewLayoutColumnCount = this.viewLayout.columns.length;
                let vc = cell.viewLayoutColumn;
                let vcIndex = vc.index;

                const gridRightBottomAligned = this.gridSettings.gridRightAligned;
                if (!gridRightBottomAligned) {
                    const cellOffsetX = canvasOffsetX - cell.viewLayoutColumn.left;
                    if (cellOffsetX <= 3) {
                        vcIndex--;
                        if (vcIndex < 0) {
                            return; // can't drag left-most column boundary
                        } else {
                            vc = this.viewLayout.columns[vcIndex];
                            this._dragColumn = vc.column;
                            this._dragStartWidth = vc.width;
                        }
                    } else {
                        this._dragColumn = cell.viewLayoutColumn.column;
                        this._dragStartWidth = cell.bounds.width;
                    }
                } else {
                    if (canvasOffsetX >= cell.bounds.x + cell.bounds.width - 3) {
                        vcIndex++;
                        if (vcIndex >= viewLayoutColumnCount) {
                            return; // can't drag right-most column boundary
                        } else {
                            vc = this.viewLayout.columns[vcIndex];
                            this._dragColumn = vc.column;
                            this._dragStartWidth = vc.width;
                        }
                    } else {
                        this._dragColumn = cell.viewLayoutColumn.column;
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

                if (this._dragColumn.settings.resizeColumnInPlace) {
                    let column: ColumnInterface | undefined;

                    if (!gridRightBottomAligned) {
                        vcIndex++;
                        if (vcIndex < viewLayoutColumnCount) {
                            vc = this.viewLayout.columns[vcIndex];
                            column = vc.column;
                        }
                    } else {
                        vcIndex--;
                        if (vcIndex >= 0) {
                            vc = this.viewLayout.columns[vcIndex];
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
                return super.handlePointerDown(event, cell);
            }
        }
    }

    override handlePointerUpCancel(event: PointerEvent, cell: ViewCell | null | undefined) {
        if (this._dragColumn !== undefined) {
            this.cursor = undefined;
            this._dragColumn = undefined;

            event.stopPropagation();
            //delay here to give other events a chance to be dropped
            // this.behavior.behaviorShapeChanged();
            this.sharedState.mouseDownUpClickUsedForMoveOrResize = true;
            return cell;
        } else {
            return super.handlePointerUpCancel(event, cell);
        }
    }

    override handlePointerMove(event: PointerEvent, cell: ViewCell | null | undefined) {
        if (this._dragColumn === undefined) {
            this.cursor = undefined;

            cell = super.handlePointerMove(event, cell);

            if (cell === undefined) {
                cell = this.tryGetViewCellFromMouseEvent(event);
            }

            const canvasOffsetX = event.offsetX;
            this.cursor = cell !== null && cell.isHeader && this.overAreaDivider(canvasOffsetX, cell) ? ColumnResizingUiBehavior.cursorName : undefined;
        }
        return cell;
    }

    override handleDblClick(event: MouseEvent, cell: ViewCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetViewCellFromMouseEvent(event);
        }
        if (cell === null) {
            return super.handleDblClick(event, cell);
        } else {
            const canvasOffsetX = event.offsetX;
            if (cell.isHeader && this.overAreaDivider(canvasOffsetX, cell)) {
                const mouseClickNearLeft = canvasOffsetX - cell.viewLayoutColumn.left <= 3;
                const column = mouseClickNearLeft
                    ? this.columnsManager.getActiveColumn(cell.viewLayoutColumn.activeColumnIndex - 1)
                    : cell.viewLayoutColumn.column;
                column.setWidthToAutoSizing();
                this.viewLayout.invalidateAll(true);
                return cell;
            } else  {
                return super.handleDblClick(event, cell);
            }
        }
    }

    private overAreaDivider(canvasOffsetX: number, cell: ViewCell): boolean {
        if (!this.gridSettings.gridRightAligned) {
            const leftMostActiveColumnIndex = 0;
            return (cell.viewLayoutColumn.activeColumnIndex !== leftMostActiveColumnIndex && canvasOffsetX <= 3) || canvasOffsetX >= cell.bounds.width - 3;
        } else {
            const lastViewLayoutColumnIdx = this.viewLayout.columns.length - 1;
            if (lastViewLayoutColumnIdx < 0) {
                return false;
            } else {
                const lastVc = this.viewLayout.columns[lastViewLayoutColumnIdx];
                const lastColumnIndex = lastVc.activeColumnIndex;
                return (canvasOffsetX >= -1 && canvasOffsetX <= 3) || (cell.viewLayoutColumn.activeColumnIndex !== lastColumnIndex && canvasOffsetX >= cell.bounds.width - 3);
            }
        }
    }
}

/** @internal */
export namespace ColumnResizingUiBehavior {
    export const typeName = 'columnresizing';

    export const cursorName = 'col-resize';
}
