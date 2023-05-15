import { CanvasEx } from '../../components/canvas-ex/canvas-ex';
import { ViewCell } from '../../components/cell/view-cell';
import { EventDetail } from '../../components/event/event-detail';
import { AssertError, UnreachableCaseError } from '../../lib/revgrid-error';
import { UiBehavior } from './ui-behavior';

/** @internal */
export class FocusUiBehavior extends UiBehavior {
    readonly typeName = FocusUiBehavior.typeName;

    override handleMouseDown(event: MouseEvent, cell: ViewCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetViewCellFromMouseEvent(event);
        }
        if (cell !== null) {
            if (cell.subgrid.isMain) {
                this.focus.setXY(cell.visibleColumn.activeColumnIndex, cell.visibleRow.subgridRowIndex);
            }
        }
        return super.handleMouseDown(event, cell);
    }

    /**
     * @param eventDetail - the event details
     */
    override handleKeyDown(eventDetail: EventDetail.Keyboard) {
        const navigateKey = eventDetail.revgrid_navigateKey;
        if (navigateKey !== undefined) {
            switch (navigateKey) {
                case CanvasEx.Keyboard.NavigateKey.left:
                    this.focusBehavior.tryMoveFocusLeft();
                    break;
                case CanvasEx.Keyboard.NavigateKey.right:
                    this.focusBehavior.tryMoveFocusRight();
                    break;
                case CanvasEx.Keyboard.NavigateKey.up:
                    this.focusBehavior.tryMoveFocusUp();
                    break;
                case CanvasEx.Keyboard.NavigateKey.down:
                    this.focusBehavior.tryMoveFocusDown();
                    break;
                case CanvasEx.Keyboard.NavigateKey.pageUp:
                    // If implementing focus driven paging, then use focusBehavior
                    if (eventDetail.altKey) {
                        this.focusBehavior.tryPageFocusLeft();
                    } else {
                        this.focusBehavior.tryPageFocusUp();
                    }
                    break;
                case CanvasEx.Keyboard.NavigateKey.pageDown:
                    // If implementing focus driven paging, then use focusBehavior
                    if (eventDetail.altKey) {
                        this.focusBehavior.tryPageFocusRight();
                    } else {
                        this.focusBehavior.tryPageFocusDown();
                    }
                    break;
                case CanvasEx.Keyboard.NavigateKey.home:
                    if (eventDetail.ctrlKey) {
                        this.focusBehavior.tryMoveFocusTop();
                    } else {
                        this.focusBehavior.tryMoveFocusFirstColumn();
                    }
                    break;
                case CanvasEx.Keyboard.NavigateKey.end:
                    if (eventDetail.ctrlKey) {
                        this.focusBehavior.tryMoveFocusBottom();
                    } else {
                        this.focusBehavior.tryMoveFocusLastColumn();
                    }
                    break;
                default:
                    throw new UnreachableCaseError('FUBHKD33233', navigateKey);
            }
        }
        super.handleKeyDown(eventDetail);

        // // STEP 1: Move the selection
        // if (handler) {
        //     handler.call(this, eventDetail.primitiveEvent);

        //     // STEP 2: Open the cell editor at the new position if `editable` AND edited cell had `editOnNextCell`
        //     let cellEvent = grid.getFocusedCellEvent(true);
        //     if (cellEvent !== undefined) {
        //         if (cellEvent.columnProperties.editOnNextCell) {
        //             grid.viewport.computeCellsBounds(); // moving selection may have auto-scrolled
        //             cellEvent = grid.getFocusedCellEvent(false); // new cell
        //             if (cellEvent !== undefined) {
        //                 grid.editAt(cellEvent); // succeeds only if `editable`
        //             }
        //         }
        //     }

        //     // STEP 3: If editor not opened on new cell, take focus
        //     if (!grid.cellEditor) {
        //         grid.takeFocus();
        //     }
        // } else {
        //     super.handleKeyDown(eventDetail);
        // }
    }

    override handleHorizontalScrollerAction(action: EventDetail.ScrollerAction) {
        switch (action.type) {
            case EventDetail.ScrollerAction.Type.StepForward:
                this.focusBehavior.tryMoveFocusRight();
                break;
            case EventDetail.ScrollerAction.Type.StepBack:
                this.focusBehavior.tryMoveFocusLeft();
                break;
            case EventDetail.ScrollerAction.Type.PageForward:
                this.focusBehavior.tryPageFocusRight();
                break;
            case EventDetail.ScrollerAction.Type.PageBack:
                this.focusBehavior.tryPageFocusLeft();
                break;
            case EventDetail.ScrollerAction.Type.newViewportStart: {
                const viewportStart = action.viewportStart;
                if (viewportStart === undefined) {
                    throw new AssertError('FUBPHSAV53009')
                } else {
                    this.viewLayout.setHorizontalViewportStart(viewportStart);
                }
                break;
            }
            default:
                throw new UnreachableCaseError('FUBPHSAU53009', action.type);
        }
    }


    override handleVerticalScrollerAction(action: EventDetail.ScrollerAction) {
        switch (action.type) {
            case EventDetail.ScrollerAction.Type.StepForward:
                this.focusBehavior.tryMoveFocusDown();
                break;
            case EventDetail.ScrollerAction.Type.StepBack:
                this.focusBehavior.tryMoveFocusUp();
                break;
            case EventDetail.ScrollerAction.Type.PageForward:
                this.focusBehavior.tryPageFocusDown();
                break;
            case EventDetail.ScrollerAction.Type.PageBack:
                this.focusBehavior.tryPageFocusUp();
                break;
            case EventDetail.ScrollerAction.Type.newViewportStart: {
                const viewportStart = action.viewportStart;
                if (viewportStart === undefined) {
                    throw new AssertError('FUBPHSAV53009')
                } else {
                    this.viewLayout.setVerticalViewportStart(viewportStart);
                }
                break;
            }
            default:
                throw new UnreachableCaseError('FUBPHSAU53009', action.type);
        }
    }
}

/** @internal */
export namespace FocusUiBehavior {
    export const typeName = 'focus';
}
