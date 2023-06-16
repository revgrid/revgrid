import { EventDetail } from '../../interfaces/data/event-detail';
import { LinedHoverCell } from '../../interfaces/data/hover-cell';
import { SchemaServer } from '../../interfaces/schema/schema-server';
import { ViewLayoutColumn } from '../../interfaces/schema/view-layout-column';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { AssertError } from '../../types-utils/revgrid-error';
import { UiBehavior } from './ui-behavior';

/** @internal */
const enum MoveLocation { Before, After }
/** @internal */
const enum DragActionType { Move, Scroll, None }

/** @internal */
interface Action {
    type: DragActionType;
}

/** @internal */
interface MoveAction<BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> extends Action {
    type: DragActionType.Move;
    location: MoveLocation;
    source: ViewLayoutColumn<BCS, SF>;
    target: ViewLayoutColumn<BCS, SF>;
}

/** @internal */
interface ScrollAction<BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> extends Action {
    type: DragActionType.Scroll;
    toRight: boolean;
    mouseOffGrid: boolean; // only considers left and right off grid
    source: ViewLayoutColumn<BCS, SF>;
}

/** @internal */
interface NoAction extends Action {
    type: DragActionType.None;
}

/** @internal */
type ColumnDragAction<BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> = MoveAction<BCS, SF> | ScrollAction<BCS, SF> | NoAction

/** @internal */
export class ColumnMovingUiBehavior<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> extends UiBehavior<BGS, BCS, SF> {
    readonly typeName = ColumnMovingUiBehavior.typeName;

    private _dragOverlay: HTMLCanvasElement | undefined;
    private _dragColumn: ViewLayoutColumn<BCS, SF> | undefined;
    private _scrolling = false;
    private _scrollVelocity = 0;

    override handlePointerDragStart(event: DragEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        if (!this.gridSettings.columnsReorderable) {
            return super.handlePointerDragStart(event, hoverCell);
        } else {
            if (hoverCell === undefined) {
                hoverCell = this.tryGetHoverCellFromMouseEvent(event);
            }

            if (hoverCell === null || LinedHoverCell.isMouseOverLine(hoverCell)) {
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

                    this.containerHtmlElement.appendChild(this._dragOverlay);

                    this._dragColumn = viewCell.viewLayoutColumn;
                    this._dragOverlay.width = this.canvasManager.flooredContainerWidth;
                    this._dragOverlay.height = this.canvasManager.flooredContainerHeight;
                    this._dragOverlay.style.display = '';

                    return {
                        started: true,
                        hoverCell,
                    }
                }
            }
        }
    }

    override handlePointerDragEnd(event: PointerEvent, cell: LinedHoverCell<BCS, SF> | null | undefined) {
        const dragColumn = this._dragColumn;
        if (dragColumn === undefined) {
            return super.handlePointerDragEnd(event, cell);
        } else {
            const dragOverlay = this._dragOverlay;
            if (dragOverlay === undefined) {
                throw new AssertError('CMUBHPDE13166');
            } else {
                const dragAction = this.getDragAction(event, dragColumn);

                this.endGridScrolling();
                this.endDragColumn(dragAction);
                this.reindexBehavior.unstash();
                this.containerHtmlElement.removeChild(dragOverlay);
                // requestAnimationFrame(() => this.render(undefined));
                this.setMouseDragging(false);
            }
            return cell;
        }
    }

    override handlePointerMove(event: PointerEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        const sharedState = this.sharedState;
        if (sharedState.locationCursorName === undefined) {
            if (this.gridSettings.columnsReorderable) {
                if (hoverCell === undefined) {
                    hoverCell = this.tryGetHoverCellFromMouseEvent(event);
                }
                if (hoverCell !== null && !LinedHoverCell.isMouseOverLine(hoverCell)) {
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

    override handlePointerDrag(event: PointerEvent, cell: LinedHoverCell<BCS, SF> | null | undefined) {

        // if (event.isColumnFixed) {
        //     super.handleMouseDrag(grid, event);
        //     return;
        // }

        if (this._dragColumn === undefined) {
            return super.handlePointerDrag(event, cell);
        } else {
            const dragAction = this.getDragAction(event, this._dragColumn);

            if (dragAction.type === DragActionType.Scroll) {
                this.scroll(dragAction);
            } else {
                this.endGridScrolling();
            }

            requestAnimationFrame(() => this.render(dragAction));
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
                throw new AssertError('CMUBR44409');
            } else {
                const dragContext = dragOverlay.getContext('2d', { alpha: true });
                if (dragContext === null) {
                    throw new AssertError('CMR18887');
                } else {
                    dragOverlay.width = this.canvasManager.flooredContainerWidth;
                    dragOverlay.height = this.canvasManager.flooredContainerHeight;
                    dragContext.clearRect(0, 0, this.canvasManager.flooredContainerWidth, this.canvasManager.flooredContainerHeight);

                    if (dragAction !== undefined) {

                        if (dragAction.type == DragActionType.Move) {
                            const indicatorX = dragAction.location === MoveLocation.Before
                                ? dragAction.target.left
                                : dragAction.target.rightPlus1;
                            dragContext.fillStyle = 'rgba(50, 50, 255, 1)';
                            dragContext.fillRect(indicatorX, 0, 2, this.canvasManager.flooredContainerHeight);
                        }

                        const dragCol = this.viewLayout.findColumnWithActiveIndex(dragColumn.activeColumnIndex);
                        if (dragCol) {
                            const hideAction = dragAction.type === DragActionType.Scroll && this.gridSettings.columnsReorderableHideable && dragAction.mouseOffGrid;
                            dragContext.fillStyle = hideAction
                                ? 'rgba(255, 50, 50, 0.2)'
                                : 'rgba(50, 50, 255, 0.2)';
                            dragContext.fillRect(dragCol.left, 0, dragCol.width, this.canvasManager.flooredContainerHeight);
                        }
                    }
                }
            }
        }
    }

    private endDragColumn(dragAction: ColumnDragAction<BCS, SF>) {
        switch (dragAction.type) {
            case DragActionType.Scroll:
                if (this.gridSettings.columnsReorderableHideable && dragAction.mouseOffGrid) {
                    this.columnsManager.hideActiveColumn(dragAction.source.activeColumnIndex);
                }
                break;
            case DragActionType.Move:
                if (dragAction.location === MoveLocation.Before) {
                    this.columnsManager.moveColumnBefore(dragAction.source.activeColumnIndex, dragAction.target.activeColumnIndex, true);
                } else {
                    this.columnsManager.moveColumnAfter(dragAction.source.activeColumnIndex, dragAction.target.activeColumnIndex, true);
                }
                break;
        }
        this.eventBehavior.processColumnsChangedEvent();
    }

    private getDragAction(event: MouseEvent, dragColumn: ViewLayoutColumn<BCS, SF>): ColumnDragAction<BCS, SF> {
        const firstScrollableColumnViewLeft = this.viewLayout.scrollableCanvasLeft;
        if (firstScrollableColumnViewLeft === undefined) {
            return {
                type: DragActionType.None
            };
        } else {
            const updatedDragColumn = this.viewLayout.findColumnWithActiveIndex(dragColumn.activeColumnIndex)
            const sourceDragColumn = updatedDragColumn !== undefined ? updatedDragColumn : dragColumn;
            const offsetX = event.offsetX;
            if (offsetX < firstScrollableColumnViewLeft) {
                return {
                    type: DragActionType.Scroll,
                    toRight: false,
                    mouseOffGrid: offsetX < 0,
                    source: sourceDragColumn
                };
            } else {
                const gridWidth = this.canvasManager.bounds.width;
                if (offsetX >= gridWidth) {
                    return {
                        type: DragActionType.Scroll,
                        toRight: true,
                        mouseOffGrid: true,
                        source: sourceDragColumn
                    };
                } else {
                    let overCol = this.viewLayout.findLeftGridLineInclusiveColumnOfCanvasOffset(offsetX);
                    if (overCol === undefined) {
                        // must be in unused space
                        overCol = this.viewLayout.createUnusedSpaceColumn();
                        if (overCol === undefined) {
                            throw new AssertError('CMFGDA31311');
                        }
                    }
                    const lower = sourceDragColumn.left - overCol.width / 2;
                    const upper = sourceDragColumn.rightPlus1 + overCol.width / 2;
                    const inMoveRange = updatedDragColumn === undefined || offsetX < lower || offsetX > upper;
                    if (!inMoveRange || overCol.index < 0) {
                        return { type: DragActionType.None }
                    }

                    const location = (offsetX - overCol.left) > overCol.width / 2
                        ? MoveLocation.After
                        : MoveLocation.Before;

                    return {
                        type: DragActionType.Move,
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
            this.mouse.setActiveDragType(EventDetail.DragTypeEnum.ColumnMoving);
            this.mouse.setOperation(this.gridSettings.columnMoveDragActiveCursorName, this.gridSettings.columnMoveDragActiveTitleText);
        } else {
            this.mouse.setActiveDragType(undefined);
            this.mouse.setOperation(undefined, undefined);
        }
    }
}

/** @internal */
export namespace ColumnMovingUiBehavior {
    export const typeName = 'columnmoving';
}
