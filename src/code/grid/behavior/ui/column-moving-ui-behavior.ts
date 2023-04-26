import { ViewportCell } from '../../cell/viewport-cell';
import { isSecondaryMouseButton } from '../../lib/html-types';
import { AssertError } from '../../lib/revgrid-error';
import { Viewport } from '../../renderer/viewport';
import { UiBehavior } from './ui-behavior';

const enum MoveLocation { Before, After }
const enum DragActionType { Move, Scroll, None }

interface Action {
    type: DragActionType;
}

interface MoveAction extends Action {
    type: DragActionType.Move;
    location: MoveLocation;
    source: Viewport.ViewportColumn;
    target: Viewport.ViewportColumn;
}

interface ScrollAction extends Action {
    type: DragActionType.Scroll;
    toRight: boolean;
    mouseOffGrid: boolean; // only considers left and right off grid
    source: Viewport.ViewportColumn;
}

interface NoAction extends Action {
    type: DragActionType.None;
}

type ColumnDragAction = MoveAction | ScrollAction | NoAction

export class ColumnMovingUiBehavior extends UiBehavior {

    readonly typeName = ColumnMovingUiBehavior.typeName;

    // static GRABBING = ['grabbing', '-moz-grabbing', '-webkit-grabbing']
    static GRABBING = 'grabbing';
    // static GRAB = ['grab', '-moz-grab', '-webkit-grab']
    static GRAB = 'grab';

    private _dragOverlay: HTMLCanvasElement;
    private _dragCol: Viewport.ViewportColumn;
    private _scrolling = false;
    private _scrollVelocity = 0;

    override initializeOn() {
        this.sharedState.columnMovingDragArmed = false;
        this.sharedState.columnMovingDragging = false;

        this._dragOverlay = document.createElement('canvas');
        this._dragOverlay.style.position = 'absolute';
        this._dragOverlay.style.pointerEvents = 'none';
        this._dragOverlay.style.top = '0px';
        this._dragOverlay.style.left = '0px';
        this._dragOverlay.style.display = 'none';

        this.grid.containerHtmlElement.appendChild(this._dragOverlay);

        super.initializeOn();
    }

    override handleMouseDown(event: MouseEvent, cell: ViewportCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetViewportCellFromMouseEvent(event);
        }

        if (cell === null) {
            return super.handleMouseDown(event, cell);
        } else {
            const grid = this.grid;
            const ctrlKeyDown = event.ctrlKey;
            if (
                ctrlKeyDown &&
                grid.properties.columnsReorderable &&
                !isSecondaryMouseButton(event) &&
                !cell.isColumnFixed &&
                cell.isHeaderCell
            ) {
                this.sharedState.columnMovingDragArmed = true;
                this.cursor = ColumnMovingUiBehavior.GRABBING;
                this.selection.requestStashSelection();
                this.sharedState.mouseDownUpClickUsedForMoveOrResize = true;
            }
            return super.handleMouseDown(event, cell);
        }
    }

    override handleMouseUp(event: MouseEvent, cell: ViewportCell | null | undefined) {
        if (this.sharedState.columnMovingDragging) {
            const dragAction = this.getDragAction(event);

            this.endGridScrolling();
            this.endDragColumn(dragAction);
            this.selection.requestUnstashSelection();
            this.cursor = undefined;
            // End Column Drag
            setTimeout(() => {
                this.attachChain();
                // This is fired so the hover feature
                //  can update the hovered column
                const next = this.next;
                if (next !== undefined) {
                    next.handleMouseMove(event, undefined);
                }
            }, 50);
            this.sharedState.columnMovingDragging = false;
            this.sharedState.mouseDownUpClickUsedForMoveOrResize = true;
        }
        this.sharedState.columnMovingDragArmed = false;
        this._dragOverlay.style.display = 'none';
        requestAnimationFrame(() => this.render(undefined));
        return super.handleMouseUp(event, cell);
    }

    override handleMouseMove(event: MouseEvent, cell: ViewportCell | null | undefined) {
        if (
            event !== undefined &&
            event.ctrlKey &&
            this.gridProperties.columnsReorderable &&
            !this.sharedState.columnMovingDragging
        ) {
            if (cell === undefined) {
                cell = this.tryGetViewportCellFromMouseEvent(event);
            }
            if (cell !== null && !cell.isColumnFixed && cell.isHeaderCell) {
                this.cursor = ColumnMovingUiBehavior.GRAB;
            } else {
                this.cursor = undefined;
            }
        } else {
            this.cursor = undefined;
        }

        if (this.sharedState.columnMovingDragging) {
            this.cursor = ColumnMovingUiBehavior.GRABBING;
            return cell;
        } else {
            return super.handleMouseMove(event, cell);
        }
    }

    override handleMouseDrag(event: MouseEvent, cell: ViewportCell | null | undefined) {

        // if (event.isColumnFixed) {
        //     super.handleMouseDrag(grid, event);
        //     return;
        // }

        if (!this.sharedState.columnMovingDragArmed) {
            return super.handleMouseDrag(event, cell);
        } else {
            if (cell === undefined) {
                cell = this.tryGetViewportCellFromMouseEvent(event);
            }
            if (cell !== null) {
                if (!this.sharedState.columnMovingDragging) {
                    this._dragCol = cell.visibleColumn;
                    this._dragOverlay.width = this.canvasEx.width;
                    this._dragOverlay.height = this.canvasEx.height;
                    this._dragOverlay.style.display = '';
                    this.sharedState.columnMovingDragging = true;
                    this.detachChain();
                } else {
                    const dragAction = this.getDragAction(event);

                    if (dragAction.type === DragActionType.Scroll) {
                        this.scroll(dragAction);
                    } else {
                        this.endGridScrolling();
                    }

                    requestAnimationFrame(() => this.render(dragAction));
                }
            }
            return cell;
        }
    }

    private scroll(action: ScrollAction) {
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

    private beginGridScrolling(action: ScrollAction) {
        setTimeout(() => {
            if (!this._scrolling) {
                return;
            }

            if (this.scrollBehavior.scrollColumnsBy(this._scrollVelocity)) {
                this.render(action);
            }

            this.beginGridScrolling(action);
        },
        400);
    }

    private render(dragAction: ColumnDragAction | undefined) {
        const grid = this.grid;

        const dragContext = this._dragOverlay.getContext('2d', { alpha: true });
        if (dragContext === null) {
            throw new AssertError('CMR18887');
        } else {
            this._dragOverlay.width = grid.canvasEx.width;
            this._dragOverlay.height = grid.canvasEx.height;
            dragContext.clearRect(0, 0, grid.canvasEx.width, grid.canvasEx.height);

            if (dragAction !== undefined) {

                if (dragAction.type == DragActionType.Move) {
                    const indicatorX = dragAction.location === MoveLocation.Before
                        ? dragAction.target.left
                        : dragAction.target.rightPlus1;
                    dragContext.fillStyle = 'rgba(50, 50, 255, 1)';
                    dragContext.fillRect(indicatorX, 0, 2, grid.canvasEx.height);
                }

                const dragCol = grid.viewport.tryGetColumnWithActiveIndex(this._dragCol.activeColumnIndex);
                if (dragCol) {
                    const hideAction = dragAction.type === DragActionType.Scroll && grid.properties.columnsReorderableHideable && dragAction.mouseOffGrid;
                    dragContext.fillStyle = hideAction
                        ? 'rgba(255, 50, 50, 0.2)'
                        : 'rgba(50, 50, 255, 0.2)';
                    dragContext.fillRect(dragCol.left, 0, dragCol.width, grid.canvasEx.height);
                }
            }
        }
    }

    private endDragColumn(dragAction: ColumnDragAction) {
        const grid = this.grid;
        switch (dragAction.type) {
            case DragActionType.Scroll:
                if (grid.properties.columnsReorderableHideable && dragAction.mouseOffGrid) {
                    grid.hideActiveColumn(dragAction.source.activeColumnIndex);
                }
                break;
            case DragActionType.Move:
                if (dragAction.location === MoveLocation.Before) {
                    grid.moveColumnBefore(dragAction.source.activeColumnIndex, dragAction.target.activeColumnIndex, true);
                } else {
                    grid.moveColumnAfter(dragAction.source.activeColumnIndex, dragAction.target.activeColumnIndex, true);
                }
                break;
        }
        grid.fireSyntheticOnColumnsChangedEvent();
    }

    private getDragAction(event: MouseEvent): ColumnDragAction {
        const firstScrollableColumnViewLeft = this.viewport.firstScrollableColumnViewLeft;
        if (firstScrollableColumnViewLeft === undefined) {
            return {
                type: DragActionType.None
            };
        } else {
            const updatedDragCol = this.viewport.tryGetColumnWithActiveIndex(this._dragCol.activeColumnIndex)
            const dragCol = updatedDragCol ? updatedDragCol : this._dragCol;
            const offsetX = event.offsetX;
            if (offsetX < firstScrollableColumnViewLeft) {
                return {
                    type: DragActionType.Scroll,
                    toRight: false,
                    mouseOffGrid: offsetX < 0,
                    source: dragCol
                };
            } else {
                const gridWidth = this.canvasEx.bounds.width;
                if (offsetX >= gridWidth) {
                    return {
                        type: DragActionType.Scroll,
                        toRight: true,
                        mouseOffGrid: true,
                        source: dragCol
                    };
                } else {
                    let overCol = this.viewport.findLeftGridLineInclusiveColumnFromOffset(offsetX);
                    if (overCol === undefined) {
                        // must be in unused space
                        overCol = this.viewport.createUnusedSpaceColumn();
                        if (overCol === undefined) {
                            throw new AssertError('CMFGDA31311');
                        }
                    }
                    const lower = dragCol.left - overCol.width / 2;
                    const upper = dragCol.rightPlus1 + overCol.width / 2;
                    const inMoveRange = updatedDragCol === undefined || offsetX < lower || offsetX > upper;
                    if (!inMoveRange || overCol.index < 0) {
                        return { type: DragActionType.None }
                    }

                    const location = (offsetX - overCol.left) > overCol.width / 2
                        ? MoveLocation.After
                        : MoveLocation.Before;

                    return {
                        type: DragActionType.Move,
                        location,
                        source: dragCol,
                        target: overCol
                    };

                }
            }
        }
    }
}

export namespace ColumnMovingUiBehavior {
    export const typeName = 'columnmoving';
}
