import { Focus } from '../../components/focus/focus';
import { Scroller } from '../../components/scroller/scroller';
import { LinedHoverCell } from '../../interfaces/data/hover-cell';
import { ViewCell } from '../../interfaces/data/view-cell';
import { SchemaField } from '../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { GridSettings } from '../../interfaces/settings/grid-settings';
import { AssertError, UnreachableCaseError } from '../../types-utils/revgrid-error';
import { HorizontalWheelScrollingAllowed } from '../../types-utils/types';
import { UiController } from './ui-controller';

/** @internal */
export class FocusScrollUiController<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> extends UiController<BGS, BCS, SF> {
    readonly typeName = FocusScrollUiController.typeName;

    override handlePointerDown(event: PointerEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        if (hoverCell === null) {
            hoverCell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (hoverCell !== undefined && !LinedHoverCell.isMouseOverLine(hoverCell)) {
            const viewCell = hoverCell.viewCell;
            if (viewCell.subgrid === this.focus.subgrid) {
                if (!this.willSelectionBeExtended(event, viewCell)) {
                    this.focusScrollBehavior.tryFocusXYAndEnsureInView(viewCell.viewLayoutColumn.activeColumnIndex, viewCell.viewLayoutRow.subgridRowIndex, viewCell);
                }
            }
        }
        return super.handlePointerDown(event, hoverCell);
    }

    override handlePointerMove(event: PointerEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        if (hoverCell === null) {
            hoverCell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (hoverCell !== undefined && !LinedHoverCell.isMouseOverLine(hoverCell)) {
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


    override handleClick(event: MouseEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        if (hoverCell === null) {
            hoverCell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (hoverCell === undefined || LinedHoverCell.isMouseOverLine(hoverCell)) {
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

    override handleDblClick(event: MouseEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        if (hoverCell === null) {
            hoverCell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (hoverCell === undefined || LinedHoverCell.isMouseOverLine(hoverCell)) {
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
            const key = event.key as Focus.ActionKeyboardKey;
            switch (key) {
                case Focus.ActionKeyboardKey.ArrowLeft:
                    this.focusScrollBehavior.tryMoveFocusLeft();
                    break;
                case Focus.ActionKeyboardKey.ArrowRight:
                    this.focusScrollBehavior.tryMoveFocusRight();
                    break;
                case Focus.ActionKeyboardKey.ArrowUp:
                    this.focusScrollBehavior.tryMoveFocusUp();
                    break;
                case Focus.ActionKeyboardKey.ArrowDown:
                    this.focusScrollBehavior.tryMoveFocusDown();
                    break;
                case Focus.ActionKeyboardKey.PageUp:
                    // If implementing focus driven paging, then use focusBehavior
                    if (event.altKey) {
                        this.focusScrollBehavior.tryPageFocusLeft();
                    } else {
                        this.focusScrollBehavior.tryPageFocusUp();
                    }
                    break;
                case Focus.ActionKeyboardKey.PageDown:
                    // If implementing focus driven paging, then use focusBehavior
                    if (event.altKey) {
                        this.focusScrollBehavior.tryPageFocusRight();
                    } else {
                        this.focusScrollBehavior.tryPageFocusDown();
                    }
                    break;
                case Focus.ActionKeyboardKey.Home:
                    if (event.ctrlKey) {
                        this.focusScrollBehavior.tryFocusTop();
                    } else {
                        this.focusScrollBehavior.tryFocusFirstColumn();
                    }
                    break;
                case Focus.ActionKeyboardKey.End:
                    if (event.ctrlKey) {
                        this.focusScrollBehavior.tryFocusBottom();
                    } else {
                        this.focusScrollBehavior.tryFocusLastColumn();
                    }
                    break;
                case Focus.ActionKeyboardKey.Tab:
                    this.focusScrollBehavior.tryMoveFocusRight();
                    break;
                case Focus.ActionKeyboardKey.Enter:
                case Focus.ActionKeyboardKey.Escape:
                    break;
                default:
                    key satisfies never;
            }
            super.handleKeyDown(event, fromEditor);
        }
    }

    override handleWheelMove(event: WheelEvent, cell: LinedHoverCell<BCS, SF> | null | undefined) {
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

    override handleHorizontalScrollerAction(action: Scroller.Action) {
        switch (action.type) {
            case Scroller.Action.TypeEnum.StepForward:
                this.focusScrollBehavior.tryScrollRight();
                break;
            case Scroller.Action.TypeEnum.StepBack:
                this.focusScrollBehavior.tryScrollLeft();
                break;
            case Scroller.Action.TypeEnum.PageForward:
                this.focusScrollBehavior.tryScrollPageRight();
                break;
            case Scroller.Action.TypeEnum.PageBack:
                this.focusScrollBehavior.tryScrollPageLeft();
                break;
            case Scroller.Action.TypeEnum.newViewportStart: {
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


    override handleVerticalScrollerAction(action: Scroller.Action) {
        switch (action.type) {
            case Scroller.Action.TypeEnum.StepForward:
                this.focusScrollBehavior.tryScrollDown();
                break;
            case Scroller.Action.TypeEnum.StepBack:
                this.focusScrollBehavior.tryScrollUp();
                break;
            case Scroller.Action.TypeEnum.PageForward:
                this.focusScrollBehavior.tryScrollPageDown();
                break;
            case Scroller.Action.TypeEnum.PageBack:
                this.focusScrollBehavior.tryScrollPageUp();
                break;
            case Scroller.Action.TypeEnum.newViewportStart: {
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

    private willSelectionBeExtended(event: MouseEvent, viewCell: ViewCell<BCS, SF>) {
        if (!this.focusSelectBehavior.isMouseAddToggleExtendSelectionAreaAllowed(event)) {
            return false;
        } else {
            const gridSettings = this.gridSettings;
            if (
                GridSettings.isAddToggleSelectionAreaModifierKeyDownInEvent(gridSettings, event) ||
                !GridSettings.isExtendLastSelectionAreaModifierKeyDownInEvent(gridSettings, event)
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
export namespace FocusScrollUiController {
    export const typeName = 'focusscroll';
}
