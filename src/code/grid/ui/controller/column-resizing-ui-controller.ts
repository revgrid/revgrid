import { EventBehavior } from '../../behavior/event-behavior';
import { Mouse } from '../../components/mouse/mouse';
import { LinedHoverCell } from '../../interfaces/data/hover-cell';
import { ViewCell } from '../../interfaces/data/view-cell';
import { Column, ColumnAutoSizeableWidth } from '../../interfaces/dataless/column';
import { SchemaField } from '../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { UiController } from './ui-controller';

/** @internal */
export class ColumnResizingUiController<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> extends UiController<BGS, BCS, SF> {

    readonly typeName = ColumnResizingUiController.typeName;

    private _dragColumn: Column<BCS, SF> | undefined;

    /**
     * the pixel location of the where the drag was initiated
     */
    private _dragStart = -1;

    /**
     * the starting width/height of the row/column we are dragging
     */
    private _dragStartWidth = -1;

    private _inPlaceAdjacentStartWidth: number;
    private _inPlaceAdjacentColumn: Column<BCS, SF> | undefined;

    override handlePointerDrag(event: PointerEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        if (this._dragColumn === undefined) {
            return super.handlePointerDrag(event, hoverCell);
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
                this._dragColumn.setWidth(dragWidth, true)
            } else {
                const np = this._inPlaceAdjacentColumn.settings;
                const dp = this._dragColumn.settings;
                if (
                    0 < delta && delta <= (this._inPlaceAdjacentStartWidth - np.minimumColumnWidth) &&
                    (dp.maximumColumnWidth === undefined || dragWidth <= dp.maximumColumnWidth)
                    ||
                    0 > delta && delta >= -(this._dragStartWidth - dp.minimumColumnWidth) &&
                    (np.maximumColumnWidth === undefined || inPlaceAdjacentWidth < np.maximumColumnWidth)
                ) {
                    const columnWidths: ColumnAutoSizeableWidth<BCS, SF>[] = [
                        { column: this._dragColumn, width: dragWidth },
                        { column: this._inPlaceAdjacentColumn, width: inPlaceAdjacentWidth },
                    ];
                    this.columnsManager.setColumnWidths(columnWidths, true);
                }
            }
            return hoverCell;
        }
    }

    override handlePointerDragStart(event: DragEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined): EventBehavior.UiPointerDragStartResult<BCS, SF> {
        if (hoverCell === null) {
            hoverCell = this.tryGetHoverCellFromMouseEvent(event);
        }

        if (hoverCell === undefined) {
            return super.handlePointerDragStart(event, hoverCell);
        } else {
            const viewCell = hoverCell.viewCell;
            const canvasOffsetX = event.offsetX;
            if (!viewCell.isHeaderOrRowFixed) {
                return super.handlePointerDragStart(event, hoverCell);
            } else {
                const nearGridLine = this.calculateNearGridLine(canvasOffsetX, viewCell);
                if (nearGridLine === ColumnResizingUiController.NearGridLine.neither) {
                    return super.handlePointerDragStart(event, hoverCell);
                } else {
                    const viewLayoutColumnCount = this.viewLayout.columns.length;
                    let vc = viewCell.viewLayoutColumn;
                    let vcIndex = vc.index;

                    const gridRightBottomAligned = this.gridSettings.gridRightAligned;
                    if (!gridRightBottomAligned) {
                        if (nearGridLine === ColumnResizingUiController.NearGridLine.left) {
                            vcIndex--;
                            if (vcIndex < 0) {
                                // can't drag left-most column boundary
                                return super.handlePointerDragStart(event, hoverCell);
                            } else {
                                vc = this.viewLayout.columns[vcIndex];
                                this._dragColumn = vc.column;
                                this._dragStartWidth = vc.width;
                            }
                        } else {
                            this._dragColumn = viewCell.viewLayoutColumn.column;
                            this._dragStartWidth = viewCell.bounds.width;
                        }
                    } else {
                        if (canvasOffsetX >= viewCell.bounds.x + viewCell.bounds.width - 3) {
                            vcIndex++;
                            if (vcIndex >= viewLayoutColumnCount) {
                                // can't drag right-most column boundary
                                return super.handlePointerDragStart(event, hoverCell);
                            } else {
                                vc = this.viewLayout.columns[vcIndex];
                                this._dragColumn = vc.column;
                                this._dragStartWidth = vc.width;
                            }
                        } else {
                            this._dragColumn = viewCell.viewLayoutColumn.column;
                            this._dragStartWidth = viewCell.bounds.width;
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
                        let column: Column<BCS, SF> | undefined;

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
                            this._inPlaceAdjacentStartWidth = column.width;
                        } else {
                            this._inPlaceAdjacentColumn = undefined;
                        }
                    } else {
                        this._inPlaceAdjacentColumn = undefined; // in case resizeColumnInPlace was previously on but is now off
                    }
                    this.setMouseDragging(true);
                    return {
                        started: true,
                        hoverCell,
                    }
                }
            }
        }
    }

    override handlePointerDragEnd(event: PointerEvent, cell: LinedHoverCell<BCS, SF> | null | undefined) {
        if (this._dragColumn === undefined) {
            return super.handlePointerDragEnd(event, cell);
        } else {
            this.setMouseDragging(false);
            this._dragColumn = undefined;

            event.stopPropagation();
            return cell;
        }
    }

    override handlePointerMove(event: PointerEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        if (this._dragColumn === undefined) {
            if (this.sharedState.locationCursorName === undefined) {
                if (hoverCell === null) {
                    hoverCell = this.tryGetHoverCellFromMouseEvent(event);
                }
                if (hoverCell !== undefined) {
                    this.checkSetLocation(event, hoverCell.viewCell);
                }
            }
        }
        return super.handlePointerMove(event, hoverCell);
    }

    override handleDblClick(event: MouseEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        if (hoverCell === null) {
            hoverCell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (hoverCell === undefined) {
            return super.handleDblClick(event, hoverCell);
        } else {
            const viewCell = hoverCell.viewCell;
            if (!viewCell.isHeaderOrRowFixed) {
                return super.handleDblClick(event, hoverCell);
            } else {
                const canvasOffsetX = event.offsetX;
                const nearGridLine = this.calculateNearGridLine(canvasOffsetX, viewCell);
                if (nearGridLine === ColumnResizingUiController.NearGridLine.neither) {
                    return super.handleDblClick(event, hoverCell);
                } else {
                    let viewLayoutColumn = viewCell.viewLayoutColumn;
                    if (this.gridSettings.gridRightAligned) {
                        if (nearGridLine === ColumnResizingUiController.NearGridLine.right) {
                            // always work on the column to the right of the near grid line
                            const columnIndex = viewLayoutColumn.index;
                            // columnIndex cannot be for last column as right grid line of last column cannot be near grid line
                            viewLayoutColumn = this.viewLayout.columns[columnIndex + 1];
                        }
                    } else {
                        if (nearGridLine === ColumnResizingUiController.NearGridLine.left) {
                            // always work on the column to the left of the near grid line
                            const columnIndex = viewLayoutColumn.index;
                            // columnIndex cannot be for first column as left grid line of first column cannot be near grid line
                            viewLayoutColumn = this.viewLayout.columns[columnIndex - 1];
                        }
                    }
                    const column = viewLayoutColumn.column;
                    if (event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey) {
                        column.autoSizing = true;
                    } else {
                        const preferredWidth = column.preferredWidth;
                        if (event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
                            if (preferredWidth !== undefined && column.width < preferredWidth) {
                                column.setWidth(preferredWidth, true);
                            }
                        } else {
                            if (preferredWidth === undefined) {
                                column.setAutoWidthSizing(true);
                            } else {
                                column.setWidth(preferredWidth, true);
                            }
                        }
                    }

                    // location may no longer be valid
                    const sharedState = this.sharedState;
                    sharedState.locationCursorName = undefined;
                    sharedState.locationTitleText = undefined;

                    // cell may have changed
                    hoverCell = this.tryGetHoverCellFromMouseEvent(event);
                    if (hoverCell !== undefined) {
                        this.checkSetLocation(event, hoverCell.viewCell);
                    }

                    return hoverCell;
                }
            }
        }
    }

    private calculateNearGridLine(canvasOffsetX: number, cell: ViewCell<BCS, SF>) {
        const cellBounds = cell.bounds;
        const cellLeft = cellBounds.x;
        const cellLeftOffset = canvasOffsetX - cellLeft;
        const cellRightOffset = cellLeft + cellBounds.width - canvasOffsetX - 1;

        const emWidth = this.canvas.gc.getEmWidth();
        const tolerance = Math.ceil(emWidth / 3);
        if (!this.gridSettings.gridRightAligned) {
            if (cellLeftOffset < cellRightOffset && cell.viewLayoutColumn.index !== 0) {
                if (cellLeftOffset < tolerance) {
                    return ColumnResizingUiController.NearGridLine.left;
                } else {
                    // Since cellLeftOffset does not meet tolerance then cellRightOffset will not either.  So no need to check cellRightOffset
                    return ColumnResizingUiController.NearGridLine.neither;
                }
            } else {
                if (cellRightOffset < tolerance) {
                    return ColumnResizingUiController.NearGridLine.right;
                } else {
                    return ColumnResizingUiController.NearGridLine.neither;
                }
            }
        } else {
            const lastViewColumnIndex = this.viewLayout.columns.length - 1;
            if (cellRightOffset < cellLeftOffset && cell.viewLayoutColumn.index !== lastViewColumnIndex) {
                if (cellRightOffset < tolerance) {
                    return ColumnResizingUiController.NearGridLine.right;
                } else {
                    // Since cellRightOffset does not meet tolerance then cellLeftOffset will not either.  So no need to check cellLeftOffset
                    return ColumnResizingUiController.NearGridLine.neither;
                }
            } else {
                if (cellLeftOffset < tolerance) {
                    return ColumnResizingUiController.NearGridLine.left;
                } else {
                    return ColumnResizingUiController.NearGridLine.neither;
                }
            }
        }
    }

    private setMouseDragging(active: boolean) {
        if (active) {
            this.mouse.setActiveDragType(Mouse.DragTypeEnum.ColumnResizing);
            this.mouse.setOperation(this.gridSettings.columnResizeDragActiveCursorName, this.gridSettings.columnResizeDragActiveTitleText);
        } else {
            this.mouse.setActiveDragType(undefined);
            this.mouse.setOperation(undefined, undefined);
        }
    }

    private checkSetLocation(event: MouseEvent, cell: ViewCell<BCS, SF>) {
        const canvasOffsetX = event.offsetX;
        if (
            // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
            cell !== null &&
            cell.isHeader &&
            this.calculateNearGridLine(canvasOffsetX, cell) !== ColumnResizingUiController.NearGridLine.neither
        ) {
            const sharedState = this.sharedState;
            sharedState.locationCursorName = this.gridSettings.columnResizeDragPossibleCursorName;
            sharedState.locationTitleText = this.gridSettings.columnResizeDragPossibleTitleText;
        }
    }
}

/** @internal */
export namespace ColumnResizingUiController {
    export const typeName = 'columnresizing';

    export namespace NearGridLine {
        export const left = true;
        export const right = false;
        export const neither = undefined;
    }
}
