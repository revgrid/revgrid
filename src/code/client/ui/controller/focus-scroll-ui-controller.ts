import { RevFocus } from '../../components/focus/focus';
import { RevScroller } from '../../components/scroller/scroller';
import { RevLinedHoverCell } from '../../interfaces/data/lined-hover-cell';
import { RevViewCell } from '../../interfaces/data/view-cell';
import { RevSchemaField } from '../../interfaces/schema/schema-field';
import { RevBehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { RevBehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { RevGridSettings } from '../../interfaces/settings/grid-settings';
import { RevAssertError, RevUnreachableCaseError } from '../../types-utils/revgrid-error';
import { RevHorizontalWheelScrollingAllowed } from '../../types-utils/types';
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
            if (viewCell.subgrid === this.focus.subgrid) {
                if (!this.willSelectionBeExtended(event, viewCell)) {
                    this.focusScrollBehavior.tryFocusXYAndEnsureInView(viewCell.viewLayoutColumn.activeColumnIndex, viewCell.viewLayoutRow.subgridRowIndex, viewCell);
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
            if (viewCell === this.focus.cell) {
                const editorPointerLocationInfo = this.focus.checkEditorProcessPointerMoveEvent(event, viewCell);
                if (editorPointerLocationInfo !== undefined) {
                    const sharedState = this.sharedState;

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
            if (viewCell !== this.focus.cell) {
                return super.handleClick(event, hoverCell);
            } else {
                if (!this.focus.checkEditorWantsClickEvent(event, viewCell)) {
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
            if (viewCell !== this.focus.cell) {
                // not a focusable cell
                return super.handleDblClick(event, hoverCell);
            } else {
                if (viewCell.columnSettings.editOnDoubleClick && viewCell.subgrid.isMain && !viewCell.isFixed) {
                    this.focus.tryOpenEditor(viewCell);
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
        if (!this.focus.checkEditorWantsKeyDownEvent(event, fromEditor)) {
            const key = event.key as RevFocus.ActionKeyboardKey;
            switch (key) {
                case RevFocus.ActionKeyboardKey.ArrowLeft:
                    this.focusScrollBehavior.tryMoveFocusLeft();
                    break;
                case RevFocus.ActionKeyboardKey.ArrowRight:
                    this.focusScrollBehavior.tryMoveFocusRight();
                    break;
                case RevFocus.ActionKeyboardKey.ArrowUp:
                    this.focusScrollBehavior.tryMoveFocusUp();
                    break;
                case RevFocus.ActionKeyboardKey.ArrowDown:
                    this.focusScrollBehavior.tryMoveFocusDown();
                    break;
                case RevFocus.ActionKeyboardKey.PageUp:
                    // If implementing focus driven paging, then use focusBehavior
                    if (event.altKey) {
                        this.focusScrollBehavior.tryPageFocusLeft();
                    } else {
                        this.focusScrollBehavior.tryPageFocusUp();
                    }
                    break;
                case RevFocus.ActionKeyboardKey.PageDown:
                    // If implementing focus driven paging, then use focusBehavior
                    if (event.altKey) {
                        this.focusScrollBehavior.tryPageFocusRight();
                    } else {
                        this.focusScrollBehavior.tryPageFocusDown();
                    }
                    break;
                case RevFocus.ActionKeyboardKey.Home:
                    if (event.ctrlKey) {
                        this.focusScrollBehavior.tryFocusTop();
                    } else {
                        this.focusScrollBehavior.tryFocusFirstColumn();
                    }
                    break;
                case RevFocus.ActionKeyboardKey.End:
                    if (event.ctrlKey) {
                        this.focusScrollBehavior.tryFocusBottom();
                    } else {
                        this.focusScrollBehavior.tryFocusLastColumn();
                    }
                    break;
                case RevFocus.ActionKeyboardKey.Tab:
                    this.focusScrollBehavior.tryMoveFocusRight();
                    break;
                case RevFocus.ActionKeyboardKey.Enter:
                case RevFocus.ActionKeyboardKey.Escape:
                    break;
                default:
                    key satisfies never;
            }
            super.handleKeyDown(event, fromEditor);
        }
    }

    override handleWheelMove(event: WheelEvent, cell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        const gridSettings = this.gridSettings;
        if (gridSettings.scrollingEnabled) {
            const viewLayout = this.viewLayout;

            if (viewLayout.horizontalScrollDimension.scrollable && this.isHorizontalWheelScrollingAllowed(event)) {
                const deltaX = event.deltaX;
                if (deltaX !== 0) {
                    if (gridSettings.scrollHorizontallySmoothly) {
                        this.viewLayout.scrollHorizontalViewportBy(deltaX * gridSettings.wheelHFactor);
                    } else {
                        this.viewLayout.scrollColumnsBy(Math.sign(deltaX) * gridSettings.wheelHFactor);
                    }
                }
            }

            if (viewLayout.verticalScrollDimension.scrollable) {
                const deltaY = event.deltaY;
                if (deltaY !== 0) {
                    this.viewLayout.scrollRowsBy(Math.sign(deltaY) * gridSettings.wheelVFactor); // Update when Vertical scrolling improved
                }
            }
        }
        return cell;
    }

    override handleHorizontalScrollerAction(action: RevScroller.Action) {
        switch (action.type) {
            case RevScroller.Action.TypeId.StepForward:
                this.focusScrollBehavior.tryScrollRight();
                break;
            case RevScroller.Action.TypeId.StepBack:
                this.focusScrollBehavior.tryScrollLeft();
                break;
            case RevScroller.Action.TypeId.PageForward:
                this.focusScrollBehavior.tryScrollPageRight();
                break;
            case RevScroller.Action.TypeId.PageBack:
                this.focusScrollBehavior.tryScrollPageLeft();
                break;
            case RevScroller.Action.TypeId.newViewportStart: {
                const viewportStart = action.viewportStart;
                if (viewportStart === undefined) {
                    throw new RevAssertError('FUBPHSAV53009')
                } else {
                    this.viewLayout.setHorizontalViewportStart(viewportStart);
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
                this.focusScrollBehavior.tryScrollDown();
                break;
            case RevScroller.Action.TypeId.StepBack:
                this.focusScrollBehavior.tryScrollUp();
                break;
            case RevScroller.Action.TypeId.PageForward:
                this.focusScrollBehavior.tryScrollPageDown();
                break;
            case RevScroller.Action.TypeId.PageBack:
                this.focusScrollBehavior.tryScrollPageUp();
                break;
            case RevScroller.Action.TypeId.newViewportStart: {
                const viewportStart = action.viewportStart;
                if (viewportStart === undefined) {
                    throw new RevAssertError('FUBPHSAV53009')
                } else {
                    this.viewLayout.setVerticalViewportStart(viewportStart);
                }
                break;
            }
            default:
                throw new RevUnreachableCaseError('FUBPHSAU53009', action.type);
        }
    }

    private isHorizontalWheelScrollingAllowed(event: WheelEvent) {
        const gridSettings = this.gridSettings;
        switch (gridSettings.horizontalWheelScrollingAllowed) {
            case RevHorizontalWheelScrollingAllowed.Never: return false;
            case RevHorizontalWheelScrollingAllowed.Always: return true;
            case RevHorizontalWheelScrollingAllowed.CtrlKeyDown: return event.ctrlKey;
            default: throw new RevUnreachableCaseError('TSIHWCA82007', gridSettings.horizontalWheelScrollingAllowed);
        }
    }

    private willSelectionBeExtended(event: MouseEvent, viewCell: RevViewCell<BCS, SF>) {
        if (!this.focusSelectBehavior.isMouseAddToggleExtendSelectionAreaAllowed(event)) {
            return false;
        } else {
            const gridSettings = this.gridSettings;
            if (
                RevGridSettings.isAddToggleSelectionAreaModifierKeyDownInEvent(gridSettings, event) ||
                !RevGridSettings.isExtendLastSelectionAreaModifierKeyDownInEvent(gridSettings, event)
            ) {
                return false;
            } else {
                const allowedAreaTypeId = this.selection.calculateMouseMainSelectAllowedAreaTypeId();
                return allowedAreaTypeId !== undefined;
            }
        }
    }
}

/** @internal */
export namespace RevFocusScrollUiController {
    export const typeName = 'focusscroll';
}
