import { RevAssertError, RevHorizontalWheelScrollingAllowedId, RevSchemaField, RevUnreachableCaseError } from '../../../common';
import { RevFocus } from '../../components/focus/focus';
import { RevScroller } from '../../components/scroller/scroller';
import { RevLinedHoverCell } from '../../interfaces/lined-hover-cell';
import { RevViewCell } from '../../interfaces/view-cell';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevGridSettings } from '../../settings/internal-api';
import { RevUiController } from './ui-controller';

/** @internal */
export class RevFocusScrollUiController<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevUiController<BGS, BCS, SF> {
    readonly typeName = RevFocusScrollUiController.typeName;

    override handlePointerDown(event: PointerEvent, hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        if (hoverCell === null) {
            hoverCell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (hoverCell !== undefined && !RevLinedHoverCell.isMouseOverLine(hoverCell)) {
            const viewCell = hoverCell.viewCell;
            if (viewCell.subgrid === this._focus.subgrid) {
                if (!this.willSelectionBeExtended(event, viewCell)) {
                    this._focusScrollBehavior.tryFocusXYAndEnsureInView(viewCell.viewLayoutColumn.activeColumnIndex, viewCell.viewLayoutRow.subgridRowIndex, viewCell);
                }
            }
        }
        return super.handlePointerDown(event, hoverCell);
    }

    override handlePointerMove(event: PointerEvent, hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        if (hoverCell === null) {
            hoverCell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (hoverCell !== undefined && !RevLinedHoverCell.isMouseOverLine(hoverCell)) {
            const viewCell = hoverCell.viewCell;
            if (viewCell === this._focus.cell) {
                const editorPointerLocationInfo = this._focus.checkEditorProcessPointerMoveEvent(event, viewCell);
                if (editorPointerLocationInfo !== undefined) {
                    const sharedState = this._sharedState;

                    const editorCursorName = editorPointerLocationInfo.locationCursorName;
                    if (editorCursorName !== undefined && sharedState.locationCursorName === undefined) {
                        sharedState.locationCursorName = editorCursorName;
                    }

                    const locationTitleText = editorPointerLocationInfo.locationTitleText;
                    if (locationTitleText !== undefined && sharedState.locationTitleText === undefined) {
                        sharedState.locationTitleText = locationTitleText;
                    }
                }
            }
        }
        return super.handlePointerMove(event, hoverCell);
    }


    override handleClick(event: MouseEvent, hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        if (hoverCell === null) {
            hoverCell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (hoverCell === undefined || RevLinedHoverCell.isMouseOverLine(hoverCell)) {
            return super.handleClick(event, hoverCell);
        } else {
            const viewCell = hoverCell.viewCell;
            if (viewCell !== this._focus.cell) {
                return super.handleClick(event, hoverCell);
            } else {
                if (!this._focus.checkEditorWantsClickEvent(event, viewCell)) {
                    return super.handleClick(event, hoverCell);
                } else {
                    return hoverCell;
                }
            }
        }
    }

    override handleDblClick(event: MouseEvent, hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        if (hoverCell === null) {
            hoverCell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (hoverCell === undefined || RevLinedHoverCell.isMouseOverLine(hoverCell)) {
            return super.handleDblClick(event, hoverCell);
        } else {
            const viewCell = hoverCell.viewCell;
            if (viewCell !== this._focus.cell) {
                // not a focusable cell
                return super.handleDblClick(event, hoverCell);
            } else {
                if (viewCell.columnSettings.editOnDoubleClick && viewCell.subgrid.isMain && !viewCell.isFixed) {
                    this._focus.tryOpenEditor(viewCell);
                    return hoverCell;
                } else {
                    return super.handleDblClick(event, hoverCell);
                }
            }
        }
    }

    /**
     * @param event - the event details
     */
    override handleKeyDown(event: KeyboardEvent, fromEditor: boolean) {
        if (!this._focus.checkEditorWantsKeyDownEvent(event, fromEditor)) {
            const key = event.key as RevFocus.ActionKeyboardKey;
            switch (key) {
                case RevFocus.ActionKeyboardKey.arrowLeft:
                    this._focusScrollBehavior.tryMoveFocusLeft();
                    break;
                case RevFocus.ActionKeyboardKey.arrowRight:
                    this._focusScrollBehavior.tryMoveFocusRight();
                    break;
                case RevFocus.ActionKeyboardKey.arrowUp:
                    this._focusScrollBehavior.tryMoveFocusUp();
                    break;
                case RevFocus.ActionKeyboardKey.arrowDown:
                    this._focusScrollBehavior.tryMoveFocusDown();
                    break;
                case RevFocus.ActionKeyboardKey.pageUp:
                    // If implementing focus driven paging, then use focusBehavior
                    if (event.altKey) {
                        this._focusScrollBehavior.tryPageFocusLeft();
                    } else {
                        this._focusScrollBehavior.tryPageFocusUp();
                    }
                    break;
                case RevFocus.ActionKeyboardKey.pageDown:
                    // If implementing focus driven paging, then use focusBehavior
                    if (event.altKey) {
                        this._focusScrollBehavior.tryPageFocusRight();
                    } else {
                        this._focusScrollBehavior.tryPageFocusDown();
                    }
                    break;
                case RevFocus.ActionKeyboardKey.home:
                    if (event.ctrlKey) {
                        this._focusScrollBehavior.tryFocusTop();
                    } else {
                        this._focusScrollBehavior.tryFocusFirstColumn();
                    }
                    break;
                case RevFocus.ActionKeyboardKey.end:
                    if (event.ctrlKey) {
                        this._focusScrollBehavior.tryFocusBottom();
                    } else {
                        this._focusScrollBehavior.tryFocusLastColumn();
                    }
                    break;
                case RevFocus.ActionKeyboardKey.tab:
                    this._focusScrollBehavior.tryMoveFocusRight();
                    break;
                case RevFocus.ActionKeyboardKey.enter:
                case RevFocus.ActionKeyboardKey.escape:
                    break;
                default:
                    key satisfies never;
            }
            super.handleKeyDown(event, fromEditor);
        }
    }

    override handleWheelMove(event: WheelEvent, cell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        const gridSettings = this._gridSettings;
        if (gridSettings.scrollingEnabled) {
            const viewLayout = this._viewLayout;

            if (viewLayout.horizontalScrollDimension.scrollable && this.isHorizontalWheelScrollingAllowed(event)) {
                const deltaX = event.deltaX;
                if (deltaX !== 0) {
                    if (gridSettings.scrollHorizontallySmoothly) {
                        this._viewLayout.scrollHorizontalViewportBy(deltaX * gridSettings.wheelHFactor);
                    } else {
                        this._viewLayout.scrollColumnsBy(Math.sign(deltaX) * gridSettings.wheelHFactor);
                    }
                }
            }

            if (viewLayout.verticalScrollDimension.scrollable) {
                const deltaY = event.deltaY;
                if (deltaY !== 0) {
                    this._viewLayout.scrollRowsBy(Math.sign(deltaY) * gridSettings.wheelVFactor); // Update when Vertical scrolling improved
                }
            }
        }
        return cell;
    }

    override handleHorizontalScrollerAction(action: RevScroller.Action) {
        switch (action.type) {
            case RevScroller.Action.TypeId.StepForward:
                this._focusScrollBehavior.tryScrollRight();
                break;
            case RevScroller.Action.TypeId.StepBack:
                this._focusScrollBehavior.tryScrollLeft();
                break;
            case RevScroller.Action.TypeId.PageForward:
                this._focusScrollBehavior.tryScrollPageRight();
                break;
            case RevScroller.Action.TypeId.PageBack:
                this._focusScrollBehavior.tryScrollPageLeft();
                break;
            case RevScroller.Action.TypeId.newViewportStart: {
                const viewportStart = action.viewportStart;
                if (viewportStart === undefined) {
                    throw new RevAssertError('FUBPHSAV53009')
                } else {
                    this._viewLayout.setHorizontalViewportStart(viewportStart);
                }
                break;
            }
            default:
                throw new RevUnreachableCaseError('FUBPHSAU53009', action.type);
        }
    }


    override handleVerticalScrollerAction(action: RevScroller.Action) {
        switch (action.type) {
            case RevScroller.Action.TypeId.StepForward:
                this._focusScrollBehavior.tryScrollDown();
                break;
            case RevScroller.Action.TypeId.StepBack:
                this._focusScrollBehavior.tryScrollUp();
                break;
            case RevScroller.Action.TypeId.PageForward:
                this._focusScrollBehavior.tryScrollPageDown();
                break;
            case RevScroller.Action.TypeId.PageBack:
                this._focusScrollBehavior.tryScrollPageUp();
                break;
            case RevScroller.Action.TypeId.newViewportStart: {
                const viewportStart = action.viewportStart;
                if (viewportStart === undefined) {
                    throw new RevAssertError('FUBPHSAV53009')
                } else {
                    this._viewLayout.setVerticalViewportStart(viewportStart);
                }
                break;
            }
            default:
                throw new RevUnreachableCaseError('FUBPHSAU53009', action.type);
        }
    }

    private isHorizontalWheelScrollingAllowed(event: WheelEvent) {
        const gridSettings = this._gridSettings;
        switch (gridSettings.horizontalWheelScrollingAllowed) {
            case RevHorizontalWheelScrollingAllowedId.Never: return false;
            case RevHorizontalWheelScrollingAllowedId.Always: return true;
            case RevHorizontalWheelScrollingAllowedId.CtrlKeyDown: return event.ctrlKey;
            default: throw new RevUnreachableCaseError('TSIHWCA82007', gridSettings.horizontalWheelScrollingAllowed);
        }
    }

    private willSelectionBeExtended(event: MouseEvent, viewCell: RevViewCell<BCS, SF>) {
        if (!this._focusSelectBehavior.isMouseAddToggleExtendSelectionAreaAllowed(event)) {
            return false;
        } else {
            const gridSettings = this._gridSettings;
            if (
                RevGridSettings.isAddToggleSelectionAreaModifierKeyDownInEvent(gridSettings, event) ||
                !RevGridSettings.isExtendLastSelectionAreaModifierKeyDownInEvent(gridSettings, event)
            ) {
                return false;
            } else {
                const allowedAreaTypeId = this._selection.calculateMouseMainSelectAllowedAreaTypeId();
                return allowedAreaTypeId !== undefined;
            }
        }
    }
}

/** @internal */
export namespace RevFocusScrollUiController {
    export const typeName = 'focusscroll';
}
