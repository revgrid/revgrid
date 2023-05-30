
import { HoverCell } from '../../interfaces/data/hover-cell';
import { Column, ColumnWidth } from '../../interfaces/schema/column';
import { EventBehavior } from '../component/event-behavior';
import { UiBehavior } from './ui-behavior';

/** @internal */
export class ColumnResizingUiBehavior extends UiBehavior {

    readonly typeName = ColumnResizingUiBehavior.typeName;

    private _dragColumn: Column | undefined;

    /**
     * the pixel location of the where the drag was initiated
     */
    private _dragStart = -1;

    /**
     * the starting width/height of the row/column we are dragging
     */
    private _dragStartWidth = -1;

    private _inPlaceAdjacentStartWidth: number;
    private _inPlaceAdjacentColumn: Column | undefined;

    override handlePointerDrag(event: PointerEvent, cell: HoverCell | null | undefined) {
        if (this._dragColumn === undefined) {
            return super.handlePointerDrag(event, cell);
        } else {
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
        }
    }

    override handlePointerDragStart(event: DragEvent, cell: HoverCell | null | undefined): EventBehavior.UiPointerDragStartResult {
        if (cell === undefined) {
            cell = this.tryGetHoverCellFromMouseEvent(event);
        }

        if (cell === null) {
            return super.handlePointerDragStart(event, cell);
        } else {
            const canvasOffsetX = event.offsetX;
            if (!cell.isHeaderOrRowFixed) {
                return super.handlePointerDragStart(event, cell);
            } else {
                const nearGridLine = this.calculateNearGridLine(canvasOffsetX, cell);
                if (nearGridLine === ColumnResizingUiBehavior.NearGridLine.neither) {
                    return super.handlePointerDragStart(event, cell);
                } else {
                    const viewLayoutColumnCount = this.viewLayout.columns.length;
                    let vc = cell.viewLayoutColumn;
                    let vcIndex = vc.index;

                    const gridRightBottomAligned = this.gridSettings.gridRightAligned;
                    if (!gridRightBottomAligned) {
                        if (nearGridLine === ColumnResizingUiBehavior.NearGridLine.left) {
                            vcIndex--;
                            if (vcIndex < 0) {
                                // can't drag left-most column boundary
                                return super.handlePointerDragStart(event, cell);
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
                                // can't drag right-most column boundary
                                return super.handlePointerDragStart(event, cell);
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
                        let column: Column | undefined;

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
                    this.mouse.setOperationCursor(this.gridSettings.columnMoveActiveCursorName);
                    return {
                        started: true,
                        cell,
                    }
                }
            }
        }
    }

    override handlePointerDragEnd(event: PointerEvent, cell: HoverCell | null | undefined) {
        if (this._dragColumn === undefined) {
            return super.handlePointerDragEnd(event, cell);
        } else {
            this.mouse.setOperationCursor(undefined);
            this._dragColumn = undefined;

            event.stopPropagation();
            return cell;
        }
    }

    override handlePointerMove(event: PointerEvent, cell: HoverCell | null | undefined) {
        if (this._dragColumn === undefined) {
            cell = super.handlePointerMove(event, cell);

            if (cell === undefined) {
                cell = this.tryGetHoverCellFromMouseEvent(event);
            }

            const canvasOffsetX = event.offsetX;
            if (
                cell !== null &&
                cell.isHeader &&
                this.calculateNearGridLine(canvasOffsetX, cell) !== ColumnResizingUiBehavior.NearGridLine.neither
            ) {
                this.sharedState.locationCursorName = this.gridSettings.columnResizeDragPossibleCursorName;
            }
        }
        return super.handlePointerMove(event, cell);
    }

    override handleDblClick(event: MouseEvent, cell: HoverCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (cell === null) {
            return super.handleDblClick(event, cell);
        } else {
            if (!cell.isHeaderOrRowFixed) {
                return super.handleDblClick(event, cell);
            } else {
                const canvasOffsetX = event.offsetX;
                const nearGridLine = this.calculateNearGridLine(canvasOffsetX, cell);
                if (nearGridLine === ColumnResizingUiBehavior.NearGridLine.neither) {
                    return super.handleDblClick(event, cell);
                } else {
                    let viewLayoutColumn = cell.viewLayoutColumn;
                    if (nearGridLine === ColumnResizingUiBehavior.NearGridLine.right) {
                        // always work on the column to the right of the near grid line
                        const columnIndex = viewLayoutColumn.index + 1;
                        // columnIndex cannot be for last column as right grid line of last column cannot be near grid line
                        viewLayoutColumn = this.viewLayout.columns[columnIndex + 1];
                    }
                    const column = viewLayoutColumn.column;
                    if (column.setWidthToAutoSizing()) {
                        this.viewLayout.invalidateAll(true);
                    }
                    return cell;
                }
            }
        }
    }

    private calculateNearGridLine(canvasOffsetX: number, cell: HoverCell) {
        const cellBounds = cell.bounds;
        const cellLeft = cellBounds.x;
        const cellLeftOffset = canvasOffsetX - cellLeft;
        if (!this.gridSettings.gridRightAligned) {
            // try left
            if (cellLeftOffset < ColumnResizingUiBehavior.NearGridLine.tolerance) {
                if (cell.viewLayoutColumn.index !== 0) { // cannot select left of first visible column
                    return ColumnResizingUiBehavior.NearGridLine.left;
                }
            }
            // try right
            const cellRightOffsetPlus1 = cellLeft + cellBounds.width - canvasOffsetX;
            if (cellRightOffsetPlus1 <= ColumnResizingUiBehavior.NearGridLine.tolerance) {
                return ColumnResizingUiBehavior.NearGridLine.right;
            } else {
                return ColumnResizingUiBehavior.NearGridLine.neither;
            }
        } else {
            // try left
            if (cellLeftOffset < ColumnResizingUiBehavior.NearGridLine.tolerance) {
                return ColumnResizingUiBehavior.NearGridLine.left;
            }
            // try right
            const cellRightPlus1 = cellLeft + cellBounds.width;
            const cellRightOffsetPlus1 = cellRightPlus1 - ColumnResizingUiBehavior.NearGridLine.tolerance;
            if (cellRightOffsetPlus1 >= ColumnResizingUiBehavior.NearGridLine.tolerance) {
                if (cell.viewLayoutColumn.index !== this.viewLayout.columns.length) { // cannot select right of last visible column
                    return ColumnResizingUiBehavior.NearGridLine.right;
                }
            }
            return ColumnResizingUiBehavior.NearGridLine.neither;
        }
    }
}

/** @internal */
export namespace ColumnResizingUiBehavior {
    export const typeName = 'columnresizing';

    export namespace NearGridLine {
        export const left = true;
        export const right = false;
        export const neither = undefined;
        export const tolerance = 3; // pixels
    }
}
