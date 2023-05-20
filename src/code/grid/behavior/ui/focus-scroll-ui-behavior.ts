import { CanvasEx } from '../../components/canvas-ex/canvas-ex';
import { CellEditor } from '../../components/cell/cell-editor';
import { ViewCell } from '../../components/cell/view-cell';
import { EventDetail } from '../../components/event/event-detail';
import { KeyboardEventKey } from '../../lib/html-types';
import { AssertError, UnreachableCaseError } from '../../lib/revgrid-error';
import { UiBehavior } from './ui-behavior';

/** @internal */
export class FocusScrollUiBehavior extends UiBehavior {
    readonly typeName = FocusScrollUiBehavior.typeName;

    override handleMouseDown(event: MouseEvent, cell: ViewCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetViewCellFromMouseEvent(event);
        }
        if (cell !== null) {
            if (cell.subgrid.isMain) {
                this.focusScrollBehavior.tryFocusXYAndEnsureInView(cell.viewLayoutColumn.activeColumnIndex, cell.viewLayoutRow.subgridRowIndex, cell);
            }
        }
        return super.handleMouseDown(event, cell);
    }

    override handleDblClick(event: MouseEvent, cell: ViewCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetViewCellFromMouseEvent(event);
        }
        if (cell !== null) {
            if (this.gridSettings.editOnDoubleClick && cell.subgrid.isMain && !cell.isCellFixed) {
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
                case CanvasEx.Keyboard.NavigateKey.left: {
                    consumedByEditor = this.checkDivertToEditor(eventDetail, 'wantLeftArrow');
                    if (!consumedByEditor) {
                        this.focusScrollBehavior.tryMoveFocusLeft();
                    }
                    break;
                }
                case CanvasEx.Keyboard.NavigateKey.right: {
                    consumedByEditor = this.checkDivertToEditor(eventDetail, 'wantRightArrow');
                    if (!consumedByEditor) {
                        this.focusScrollBehavior.tryMoveFocusRight();
                    }
                    break;
                }
                case CanvasEx.Keyboard.NavigateKey.up: {
                    consumedByEditor = this.checkDivertToEditor(eventDetail, 'wantUpArrow');
                    if (!consumedByEditor) {
                        this.focusScrollBehavior.tryMoveFocusUp();
                    }
                    break;
                }
                case CanvasEx.Keyboard.NavigateKey.down: {
                    consumedByEditor = this.checkDivertToEditor(eventDetail, 'wantDownArrow');
                    if (!consumedByEditor) {
                        this.focusScrollBehavior.tryMoveFocusDown();
                    }
                    break;
                }
                case CanvasEx.Keyboard.NavigateKey.pageUp: {
                    // If implementing focus driven paging, then use focusBehavior
                    if (eventDetail.altKey) {
                        this.focusScrollBehavior.tryPageFocusLeft();
                    } else {
                        this.focusScrollBehavior.tryPageFocusUp();
                    }
                    break;
                }
                case CanvasEx.Keyboard.NavigateKey.pageDown: {
                    // If implementing focus driven paging, then use focusBehavior
                    if (eventDetail.altKey) {
                        this.focusScrollBehavior.tryPageFocusRight();
                    } else {
                        this.focusScrollBehavior.tryPageFocusDown();
                    }
                    break;
                }
                case CanvasEx.Keyboard.NavigateKey.home: {
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
                case CanvasEx.Keyboard.NavigateKey.end: {
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
