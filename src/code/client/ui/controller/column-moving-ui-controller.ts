import { RevAssertError, RevSchemaField, RevUnreachableCaseError } from '../../../common/internal-api';
import { RevMouse } from '../../components/mouse/mouse';
import { RevLinedHoverCell } from '../../interfaces/data/lined-hover-cell';
import { RevViewLayoutColumn } from '../../interfaces/dataless/view-layout-column';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings } from '../../settings/internal-api';
import { RevUiController } from './ui-controller';

/** @internal */
const enum MoveLocationId { Before, After }
/** @internal */
const enum DragActionTypeId { Move, Scroll, None }

/** @internal */
interface Action {
    type: DragActionTypeId;
}

/** @internal */
interface MoveAction<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends Action {
    type: DragActionTypeId.Move;
    location: MoveLocationId;
    source: RevViewLayoutColumn<BCS, SF>;
    target: RevViewLayoutColumn<BCS, SF>;
}

/** @internal */
interface ScrollAction<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends Action {
    type: DragActionTypeId.Scroll;
    toRight: boolean;
    mouseOffGrid: boolean; // only considers left and right off grid
    source: RevViewLayoutColumn<BCS, SF>;
}

/** @internal */
interface NoAction extends Action {
    type: DragActionTypeId.None;
}

/** @internal */
type ColumnDragAction<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> = MoveAction<BCS, SF> | ScrollAction<BCS, SF> | NoAction

/** @internal */
export class RevColumnMovingUiController<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevUiController<BGS, BCS, SF> {
    readonly typeName = RevColumnMovingUiController.typeName;

    private _dragOverlay: HTMLCanvasElement | undefined;
    private _dragColumn: RevViewLayoutColumn<BCS, SF> | undefined;
    private _scrolling = false;
    private _scrollVelocity = 0;

    override handlePointerDragStart(event: DragEvent, hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        if (!this.gridSettings.columnsReorderable) {
            return super.handlePointerDragStart(event, hoverCell);
        } else {
            if (hoverCell === null) {
                hoverCell = this.tryGetHoverCellFromMouseEvent(event);
            }

            if (hoverCell === undefined || RevLinedHoverCell.isMouseOverLine(hoverCell)) {
                return super.handlePointerDragStart(event, hoverCell);
            } else {
                const viewCell = hoverCell.viewCell;
                if (viewCell.isColumnFixed || !viewCell.isHeaderOrRowFixed) {
                    return super.handlePointerDragStart(event, hoverCell);
                } else {
                    this.setMouseDragging(true)
                    this.reindexBehavior.stash();

                    this._dragOverlay = document.createElement('canvas');
                    this._dragOverlay.style.position = 'absolute';
                    this._dragOverlay.style.pointerEvents = 'none';
                    this._dragOverlay.style.top = '0px';
                    this._dragOverlay.style.left = '0px';
                    this._dragOverlay.style.display = 'none';

                    this.hostElement.appendChild(this._dragOverlay);

                    this._dragColumn = viewCell.viewLayoutColumn;
                    this._dragOverlay.width = this.canvas.flooredWidth;
                    this._dragOverlay.height = this.canvas.flooredHeight;
                    this._dragOverlay.style.display = '';

                    return {
                        started: true,
                        hoverCell,
                    }
                }
            }
        }
    }

    override handlePointerDragEnd(event: PointerEvent, cell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        const dragColumn = this._dragColumn;
        if (dragColumn === undefined) {
            return super.handlePointerDragEnd(event, cell);
        } else {
            const dragOverlay = this._dragOverlay;
            if (dragOverlay === undefined) {
                throw new RevAssertError('CMUBHPDE13166');
            } else {
                const dragAction = this.getDragAction(event, dragColumn);

                this.endGridScrolling();
                this.endDragColumn(dragAction);
                this.reindexBehavior.unstash(true);
                this.hostElement.removeChild(dragOverlay);
                // requestAnimationFrame(() => this.render(undefined));
                this.setMouseDragging(false);
            }
            return cell;
        }
    }

    override handlePointerMove(event: PointerEvent, hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        const sharedState = this.sharedState;
        if (sharedState.locationCursorName === undefined) {
            if (this.gridSettings.columnsReorderable) {
                if (hoverCell === null) {
                    hoverCell = this.tryGetHoverCellFromMouseEvent(event);
                }
                if (hoverCell !== undefined && !RevLinedHoverCell.isMouseOverLine(hoverCell)) {
                    const viewCell = hoverCell.viewCell;
                    if (!viewCell.isColumnFixed && viewCell.isHeaderOrRowFixed) {
                        sharedState.locationCursorName = this.gridSettings.columnMoveDragPossibleCursorName;
                        sharedState.locationTitleText = this.gridSettings.columnMoveDragPossibleTitleText;
                    }
                }
            }
        }

        return super.handlePointerMove(event, hoverCell);
    }

    override handlePointerDrag(event: PointerEvent, cell: RevLinedHoverCell<BCS, SF> | null | undefined) {

        // if (event.isColumnFixed) {
        //     super.handleMouseDrag(grid, event);
        //     return;
        // }

        if (this._dragColumn === undefined) {
            return super.handlePointerDrag(event, cell);
        } else {
            const dragAction = this.getDragAction(event, this._dragColumn);

            if (dragAction.type === DragActionTypeId.Scroll) {
                this.scroll(dragAction);
            } else {
                this.endGridScrolling();
            }

            requestAnimationFrame(() => { this.render(dragAction); });
            return cell;
        }
    }

    private scroll(action: ScrollAction<BCS, SF>) {
        this._scrollVelocity = action.toRight ? 1 : -1;

        if (!this._scrolling) {
            this._scrolling = true;
            this.beginGridScrolling(action);
        }
    }

    private endGridScrolling() {
        this._scrolling = false;
        this._scrollVelocity = 0;
    }

    private beginGridScrolling(action: ScrollAction<BCS, SF>) {
        setTimeout(() => {
            if (!this._scrolling) {
                return;
            }

            if (this.viewLayout.scrollColumnsBy(this._scrollVelocity)) {
                this.render(action);
            }

            this.beginGridScrolling(action);
        },
        400);
    }

    private render(dragAction: ColumnDragAction<BCS, SF> | undefined) {
        const dragColumn = this._dragColumn;
        if (dragColumn !== undefined) {
            const dragOverlay = this._dragOverlay;
            if (dragOverlay === undefined) {
                throw new RevAssertError('CMUBR44409');
            } else {
                const dragContext = dragOverlay.getContext('2d', { alpha: true });
                if (dragContext === null) {
                    throw new RevAssertError('CMR18887');
                } else {
                    dragOverlay.width = this.canvas.flooredWidth;
                    dragOverlay.height = this.canvas.flooredHeight;
                    dragContext.clearRect(0, 0, this.canvas.flooredWidth, this.canvas.flooredHeight);

                    if (dragAction !== undefined) {

                        if (dragAction.type == DragActionTypeId.Move) {
                            const indicatorX = dragAction.location === MoveLocationId.Before
                                ? dragAction.target.left
                                : dragAction.target.rightPlus1;
                            dragContext.fillStyle = 'rgba(50, 50, 255, 1)';
                            dragContext.fillRect(indicatorX, 0, 2, this.canvas.flooredHeight);
                        }

                        const dragCol = this.viewLayout.findColumnWithActiveIndex(dragColumn.activeColumnIndex);
                        if (dragCol) {
                            const hideAction = dragAction.type === DragActionTypeId.Scroll && this.gridSettings.columnsReorderableHideable && dragAction.mouseOffGrid;
                            dragContext.fillStyle = hideAction
                                ? 'rgba(255, 50, 50, 0.2)'
                                : 'rgba(50, 50, 255, 0.2)';
                            dragContext.fillRect(dragCol.left, 0, dragCol.width, this.canvas.flooredHeight);
                        }
                    }
                }
            }
        }
    }

    private endDragColumn(dragAction: ColumnDragAction<BCS, SF>) {
        switch (dragAction.type) {
            case DragActionTypeId.Scroll: {
                if (this.gridSettings.columnsReorderableHideable && dragAction.mouseOffGrid) {
                    this.columnsManager.hideActiveColumn(dragAction.source.activeColumnIndex, true);
                }
                break;
            }
            case DragActionTypeId.Move: {
                const fromIndex = dragAction.source.activeColumnIndex;
                let toIndex = dragAction.target.activeColumnIndex;

                if (dragAction.location === MoveLocationId.After) {
                    toIndex++;
                }
                if (toIndex > fromIndex) {
                    toIndex--;
                }

                this.columnsManager.moveActiveColumn(fromIndex, toIndex, true);
                break;
            }
            case DragActionTypeId.None:
                break;
            default:
                throw new RevUnreachableCaseError('CMUBEDC23334', dragAction);
        }
    }

    private getDragAction(event: MouseEvent, dragColumn: RevViewLayoutColumn<BCS, SF>): ColumnDragAction<BCS, SF> {
        const viewLayout = this.viewLayout;
        const columns = viewLayout.columns;
        const columnCount = columns.length;
        if (columnCount === 0) {
            return {
                type: DragActionTypeId.None,
            };
        } else {
            const scrollable = viewLayout.horizontalScrollDimension.scrollable;
            const firstScrollableColumnViewLeft = viewLayout.scrollableCanvasLeft;
            const updatedDragColumn = viewLayout.findColumnWithActiveIndex(dragColumn.activeColumnIndex)
            const sourceDragColumn = updatedDragColumn !== undefined ? updatedDragColumn : dragColumn;
            const offsetX = event.offsetX;
            if (offsetX < firstScrollableColumnViewLeft) {
                if (scrollable) {
                    return {
                        type: DragActionTypeId.Scroll,
                        toRight: false,
                        mouseOffGrid: offsetX < 0,
                        source: sourceDragColumn
                    };
                } else {
                    const firstScrollableColumn = this.viewLayout.firstScrollableColumn;
                    if (firstScrollableColumn === undefined) {
                        return {
                            type: DragActionTypeId.None,
                        };
                    } else {
                        if (sourceDragColumn === firstScrollableColumn) {
                            return { type: DragActionTypeId.None }
                        } else {
                            return {
                                type: DragActionTypeId.Move,
                                location: MoveLocationId.Before,
                                source: sourceDragColumn,
                                target: firstScrollableColumn,
                            };
                        }
                    }
                }
            } else {
                const lastColumn = columns[columnCount - 1];
                if (offsetX >= lastColumn.rightPlus1) {
                    if (scrollable) {
                        return {
                            type: DragActionTypeId.Scroll,
                            toRight: true,
                            mouseOffGrid: offsetX >= this.canvas.flooredBounds.width,
                            source: sourceDragColumn
                        };
                    } else {
                        if (sourceDragColumn === lastColumn) {
                            return { type: DragActionTypeId.None }
                        } else {
                            return {
                                type: DragActionTypeId.Move,
                                location: MoveLocationId.After,
                                source: sourceDragColumn,
                                target: lastColumn,
                            };
                        }
                    }
                } else {
                    let overCol = this.viewLayout.findLeftGridLineInclusiveColumnOfCanvasOffset(offsetX);
                    if (overCol === undefined) {
                        // must be in unused space
                        overCol = this.viewLayout.createUnusedSpaceColumn();
                        if (overCol === undefined) {
                            throw new RevAssertError('CMFGDA31311');
                        }
                    }
                    const lower = sourceDragColumn.left - overCol.width / 2;
                    const upper = sourceDragColumn.rightPlus1 + overCol.width / 2;
                    const inMoveRange = updatedDragColumn === undefined || offsetX < lower || offsetX > upper;
                    if (!inMoveRange || overCol.index < 0) {
                        return { type: DragActionTypeId.None }
                    }

                    const location = (offsetX - overCol.left) > overCol.width / 2
                        ? MoveLocationId.After
                        : MoveLocationId.Before;

                    return {
                        type: DragActionTypeId.Move,
                        location,
                        source: sourceDragColumn,
                        target: overCol
                    };
                }
            }
        }
    }

    private setMouseDragging(active: boolean) {
        if (active) {
            this.mouse.setActiveDragType(RevMouse.DragType.columnMoving);
            this.mouse.setOperation(this.gridSettings.columnMoveDragActiveCursorName, this.gridSettings.columnMoveDragActiveTitleText);
        } else {
            this.mouse.setActiveDragType(undefined);
            this.mouse.setOperation(undefined, undefined);
        }
    }
}

/** @internal */
export namespace RevColumnMovingUiController {
    export const typeName = 'columnmoving';
}
