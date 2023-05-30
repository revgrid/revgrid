import { CanvasManager } from '../../components/canvas/canvas-manager';
import { EventDetail } from '../../components/event/event-detail';
import { HoverCell } from '../../interfaces/data/hover-cell';
import { CellEditor } from '../../interfaces/dataless/cell-editor';
import { KeyboardEventKey } from '../../types-utils/html-types';
import { AssertError, UnreachableCaseError } from '../../types-utils/revgrid-error';
import { HorizontalWheelScrollingAllowed } from '../../types-utils/types';
import { UiBehavior } from './ui-behavior';

/** @internal */
export class FocusScrollUiBehavior extends UiBehavior {
    readonly typeName = FocusScrollUiBehavior.typeName;

    override handlePointerDown(event: PointerEvent, cell: HoverCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (cell !== null) {
            if (cell.subgrid.isMain && !cell.isMouseOverLine()) {
                this.focusScrollBehavior.tryFocusXYAndEnsureInView(cell.viewLayoutColumn.activeColumnIndex, cell.viewLayoutRow.subgridRowIndex, cell);
            }
        }
        return super.handlePointerDown(event, cell);
    }

    override handleDblClick(event: MouseEvent, cell: HoverCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (cell !== null && !cell.isMouseOverLine()) {
            if (this.gridSettings.editOnDoubleClick && cell.subgrid.isMain && !cell.isFixed) {
                this.focus.tryOpenEditor(cell);
            }
        }
        return super.handleDblClick(event, cell);
    }

    /**
     * @param eventDetail - the event details
     */
    override handleKeyDown(eventDetail: EventDetail.Keyboard) {
        const navigateKey = eventDetail.revgrid_navigateKey;
        let consumedByEditor = false;
        if (navigateKey !== undefined) {
            switch (navigateKey) {
                case CanvasManager.Keyboard.NavigateKey.left: {
                    consumedByEditor = this.checkDivertToEditor(eventDetail, 'wantLeftArrow');
                    if (!consumedByEditor) {
                        this.focusScrollBehavior.tryMoveFocusLeft();
                    }
                    break;
                }
                case CanvasManager.Keyboard.NavigateKey.right: {
                    consumedByEditor = this.checkDivertToEditor(eventDetail, 'wantRightArrow');
                    if (!consumedByEditor) {
                        this.focusScrollBehavior.tryMoveFocusRight();
                    }
                    break;
                }
                case CanvasManager.Keyboard.NavigateKey.up: {
                    consumedByEditor = this.checkDivertToEditor(eventDetail, 'wantUpArrow');
                    if (!consumedByEditor) {
                        this.focusScrollBehavior.tryMoveFocusUp();
                    }
                    break;
                }
                case CanvasManager.Keyboard.NavigateKey.down: {
                    consumedByEditor = this.checkDivertToEditor(eventDetail, 'wantDownArrow');
                    if (!consumedByEditor) {
                        this.focusScrollBehavior.tryMoveFocusDown();
                    }
                    break;
                }
                case CanvasManager.Keyboard.NavigateKey.pageUp: {
                    // If implementing focus driven paging, then use focusBehavior
                    if (eventDetail.altKey) {
                        this.focusScrollBehavior.tryPageFocusLeft();
                    } else {
                        this.focusScrollBehavior.tryPageFocusUp();
                    }
                    break;
                }
                case CanvasManager.Keyboard.NavigateKey.pageDown: {
                    // If implementing focus driven paging, then use focusBehavior
                    if (eventDetail.altKey) {
                        this.focusScrollBehavior.tryPageFocusRight();
                    } else {
                        this.focusScrollBehavior.tryPageFocusDown();
                    }
                    break;
                }
                case CanvasManager.Keyboard.NavigateKey.home: {
                    consumedByEditor = this.checkDivertToEditor(eventDetail, 'wantHome');
                    if (!consumedByEditor) {
                        if (eventDetail.ctrlKey) {
                            this.focusScrollBehavior.moveFocusTop();
                        } else {
                            this.focusScrollBehavior.moveFocusFirstColumn();
                        }
                    }
                    break;
                }
                case CanvasManager.Keyboard.NavigateKey.end: {
                    consumedByEditor = this.checkDivertToEditor(eventDetail, 'wantEnd');
                    if (!consumedByEditor) {
                        if (eventDetail.ctrlKey) {
                            this.focusScrollBehavior.moveFocusBottom();
                        } else {
                            this.focusScrollBehavior.moveFocusLastColumn();
                        }
                    }
                    break;
                }
                default:
                    throw new UnreachableCaseError('FUBHKD33233', navigateKey);
            }
        } else {
            const key = eventDetail.key;
            switch (key) {
                case KeyboardEventKey.Tab: {
                    consumedByEditor = this.checkDivertToEditor(eventDetail, 'wantTab');
                    if (!consumedByEditor) {
                        this.focusScrollBehavior.tryMoveFocusLeft();
                    }
                    break;
                }
                case KeyboardEventKey.Return: {
                    consumedByEditor = this.checkDivertToEditor(eventDetail, 'wantReturn');
                    if (!consumedByEditor) {
                        this.focusScrollBehavior.tryMoveFocusDown();
                    }
                    break;
                }
                case KeyboardEventKey.Escape: {
                    consumedByEditor = this.checkDivertToEditor(eventDetail, 'wantEscape');
                    if (!consumedByEditor) {
                        this.focus.closeEditor(true);
                    }
                    break;
                }
                default: {
                    if (key === this.gridSettings.editKey) {
                        this.focus.tryOpenEditor(undefined);
                        consumedByEditor = true;
                    } else {
                        if (this.gridSettings.editOnKeydown) {
                            consumedByEditor = this.focus.tryOpenEditorWithKey(key);
                        }
                    }
                }
            }
        }

        if (!consumedByEditor) {
            super.handleKeyDown(eventDetail);
        }

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

    override handleWheelMove(event: WheelEvent, cell: HoverCell | null | undefined) {
        const gridSettings = this.gridSettings;
        if (gridSettings.scrollingEnabled) {
            const deltaX = event.deltaX;
            const deltaY = event.deltaY;

            if (deltaX) {
                if (this.isHorizontalWheelScrollingAllowed(event)) {
                    if (gridSettings.scrollHorizontallySmoothly) {
                        this.viewLayout.scrollHorizontalViewportBy(deltaX);
                    } else {
                        this.viewLayout.scrollColumnsBy(Math.sign(deltaX));
                    }
                }
            }
            if (deltaY) {
                this.viewLayout.scrollRowsBy(Math.sign(deltaY)); // Update when Vertical scrolling improved
                // grid.scrollVBy(Math.sign(deltaY));
            }
        }
        return cell;
    }

    override handleHorizontalScrollerAction(action: EventDetail.ScrollerAction) {
        switch (action.type) {
            case EventDetail.ScrollerAction.Type.StepForward:
                this.focusScrollBehavior.tryScrollRight();
                break;
            case EventDetail.ScrollerAction.Type.StepBack:
                this.focusScrollBehavior.tryScrollLeft();
                break;
            case EventDetail.ScrollerAction.Type.PageForward:
                this.focusScrollBehavior.tryScrollPageRight();
                break;
            case EventDetail.ScrollerAction.Type.PageBack:
                this.focusScrollBehavior.tryScrollPageLeft();
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
                this.focusScrollBehavior.tryScrollDown();
                break;
            case EventDetail.ScrollerAction.Type.StepBack:
                this.focusScrollBehavior.tryScrollUp();
                break;
            case EventDetail.ScrollerAction.Type.PageForward:
                this.focusScrollBehavior.tryScrollPageDown();
                break;
            case EventDetail.ScrollerAction.Type.PageBack:
                this.focusScrollBehavior.tryScrollPageUp();
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

    private isHorizontalWheelScrollingAllowed(event: WheelEvent) {
        const gridSettings = this.gridSettings;
        switch (gridSettings.horizontalWheelScrollingAllowed) {
            case HorizontalWheelScrollingAllowed.Never: return false;
            case HorizontalWheelScrollingAllowed.Always: return true;
            case HorizontalWheelScrollingAllowed.CtrlKeyDown: return event.ctrlKey;
            default: throw new UnreachableCaseError('TSIHWCA82007', gridSettings.horizontalWheelScrollingAllowed);
        }
    }

    private checkDivertToEditor(eventDetail: EventDetail.Keyboard, wantProperty: keyof CellEditor): boolean {
        const editor = this.focus.editor;
        if (editor !== undefined && editor[wantProperty] && editor.keyDown !== undefined) {
            editor.keyDown(eventDetail);
            return true;
        } else {
            return false;
        }
    }
}

/** @internal */
export namespace FocusScrollUiBehavior {
    export const typeName = 'focusscroll';
}
