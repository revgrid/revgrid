
import { CanvasEx } from '../../components/canvas-ex/canvas-ex';
import { ViewCell } from '../../components/cell/view-cell';
import { EventDetail } from '../../components/event/event-detail';
import { GridSettings } from '../../interfaces/grid-settings';
import { SubgridInterface } from '../../interfaces/subgrid-interface';
import { isSecondaryMouseButton } from '../../lib/html-types';
import { Point } from '../../lib/point';
import { AssertError } from '../../lib/revgrid-error';
import { SelectionArea } from '../../lib/selection-area';
import { StartLength } from '../../lib/start-length';
import { UiBehavior } from './ui-behavior';

export class CellSelectionUiBehavior extends UiBehavior {

    readonly typeName = CellSelectionUiBehavior.typeName;

    private _extendSelectOrigin: CellSelectionUiBehavior.ExtendSelectOrigin | undefined;

    /**
     * a millisecond value representing the previous time an autoscroll started
     */
    private _sbLastAuto = 0;

    /**
     * a millisecond value representing the time the current autoscroll started
     */
    private _sbAutoStart = 0;
    private _dragging: boolean;
    private _stepScrollDragTimeoutHandle: ReturnType<typeof setTimeout> | undefined;

    override handleMouseUp(event: MouseEvent, cell: ViewCell | null | undefined) {
        if (this._dragging) {
            this._dragging = false;
            this.cancelScheduledStepScrollDrag();
        }
        return super.handleMouseUp(event, cell);
    }

    override handleMouseDown(event: MouseEvent, cell: ViewCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetViewCellFromMouseEvent(event);
        }
        if (cell === null) {
            return super.handleMouseDown(event, cell);
        } else {
            const subgrid = cell.subgrid;
            const isSelectable = subgrid.selectable && this.cellPropertiesBehavior.getCellProperty(cell.visibleColumn.column, cell.visibleRow.subgridRowIndex, 'cellSelection', subgrid);

            if (!isSelectable || isSecondaryMouseButton(event)) {
                return super.handleMouseDown(event, cell);
            } else {
                const activeColumnIndex = cell.visibleColumn.activeColumnIndex;
                const subgridRowIndex = cell.visibleRow.subgridRowIndex;
                this._dragging = true;
                const focusSelectionBehavior = this.selectionBehavior;
                let areaTypeSpecifier: SelectionArea.TypeSpecifier;
                if (GridSettings.isSecondarySelectionAreaTypeSpecifierModifierKeyDownInMouseEvent(this.gridSettings, event)) {
                    areaTypeSpecifier = SelectionArea.TypeSpecifier.Secondary;
                } else {
                    areaTypeSpecifier = SelectionArea.TypeSpecifier.Primary;
                }
                const addToggleModifier = GridSettings.isAddToggleSelectionAreaModifierKeyDownInMouseEvent(this.gridSettings, event);
                const extendModifier = GridSettings.isExtendLastSelectionAreaModifierKeyDownInMouseEvent(this.gridSettings, event);
                if (extendModifier) {
                    if (addToggleModifier) {
                        this.selectOnlyCell(activeColumnIndex, subgridRowIndex, subgrid, areaTypeSpecifier);
                    } else {
                        focusSelectionBehavior.replaceLastArea(activeColumnIndex, subgridRowIndex, 1, 1, subgrid, areaTypeSpecifier);
                    }
                } else {
                    if (addToggleModifier) {
                        let added: boolean;
                        if (this.gridSettings.addToggleSelectionAreaModifierKeyDoesToggle) {
                            added = focusSelectionBehavior.selectToggleCell(activeColumnIndex, subgridRowIndex, subgrid, areaTypeSpecifier);
                        } else {
                            focusSelectionBehavior.selectAddCell(activeColumnIndex, subgridRowIndex, subgrid, areaTypeSpecifier);
                            added = true;
                        }
                        if (added) {
                            this._extendSelectOrigin = {
                                subgrid,
                                point: {
                                    x: activeColumnIndex,
                                    y: subgridRowIndex,
                                }
                            }
                        }
                    } else {
                        this.selectOnlyCell(activeColumnIndex, subgridRowIndex, subgrid, areaTypeSpecifier);
                    }
                }

                return cell;
            }
        }
    }

    override handleMouseDrag(event: MouseEvent, cell: ViewCell | null | undefined) {
        if (!this._dragging || !this.gridSettings.mouseCellSelection || isSecondaryMouseButton(event)) {
            return super.handleMouseDrag(event, cell);
        } else {
            this.cancelScheduledStepScrollDrag();
            const stepScrolled = this.checkStepScrollDrag(event.offsetX, event.offsetY);
            if (stepScrolled) {
                return cell;
            } else {
                if (cell === undefined) {
                    cell = this.tryGetViewCellFromMouseEvent(event);
                }
                if (cell !== null) {
                    this.updateLastSelectionArea(cell);
                }
                return cell;
            }
        }
    }

    /**
     * @param eventDetail - the event details
     */
    override handleKeyDown(eventDetail: EventDetail.Keyboard) {
        const navKey = eventDetail.revgrid_navigateKey;// grid.generateNavKey(eventDetail)
        if (navKey === undefined) {
            super.handleKeyDown(eventDetail);
        } else {
            switch (navKey) {
                case CanvasEx.Keyboard.NavigateKey.left:
                case CanvasEx.Keyboard.NavigateKey.right:
                case CanvasEx.Keyboard.NavigateKey.up:
                case CanvasEx.Keyboard.NavigateKey.down: {
                    // STEP 1: Move the selection
                    if (eventDetail.shiftKey) {
                        this.moveShiftSelect();
                    } else {
                        this.selectionBehavior.selectOnlyFocusedCell(SelectionArea.TypeSpecifier.Primary);
                    }

                    // const grid = this.grid;
                    // // STEP 2: Open the cell editor at the new position if `editable` AND edited cell had `editOnNextCell`
                    // let cell = this.focusBehavior.getFocusedViewCell(true);
                    // if (cell !== undefined) {
                    //     if (cell.columnProperties.editOnNextCell) {
                    //         this.viewLayout.compute(false); // moving selection may have auto-scrolled
                    //         cell = this.focusBehavior.getFocusedViewCell(false); // new cell
                    //         if (cell !== undefined) {
                    //             grid.editAt(cell); // succeeds only if `editable`
                    //         }
                    //     }
                    // }

                    // // STEP 3: If editor not opened on new cell, take focus
                    // if (!grid.cellEditor) {
                    //     grid.takeFocus();
                    // }
                    break;
                }
                default:
                    super.handleKeyDown(eventDetail);
            }
        }
    }

    /**
     * @desc Handle a mousedrag selection.
     * @param keys - array of the keys that are currently pressed down
     */
    private updateLastSelectionArea(cell: ViewCell) {
        const extendSelectOrigin = this._extendSelectOrigin;
        if (extendSelectOrigin === undefined) {
            throw new AssertError('CSFHMDCS54455');
        } else {
            const subgrid = cell.subgrid;
            if (subgrid === extendSelectOrigin.subgrid) {
                const lastCellX = cell.visibleColumn.activeColumnIndex;
                const lastCellY = cell.visibleRow.subgridRowIndex;

                const xExclusiveStartLength = StartLength.createExclusiveFromFirstLast(lastCellX, extendSelectOrigin.point.x);
                const yExclusiveStartLength = StartLength.createExclusiveFromFirstLast(lastCellY, extendSelectOrigin.point.y);
                const focusSelectionBehavior = this.selectionBehavior;
                focusSelectionBehavior.replaceLastAreaWithRectangle(
                    xExclusiveStartLength.start, yExclusiveStartLength.start,
                    xExclusiveStartLength.length, yExclusiveStartLength.length,
                    subgrid,
                );
            }
        }
    }

    /**
     * @desc this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
     */
    private checkStepScrollDrag(canvasOffsetX: number, canvasOffsetY: number) {
        const scrollableBounds = this.viewLayout.scrollableCanvasBounds;
        if (this.gridSettings.scrollingEnabled && scrollableBounds !== undefined && scrollableBounds.containsXY(canvasOffsetX, canvasOffsetY)) {
            this.cancelScheduledStepScrollDrag();
            return false;
        } else {
            const stepScrolled = this.scrollBehavior.stepScroll(canvasOffsetX, canvasOffsetY);
            if (!stepScrolled) {
                return false;
            } else {
                this.scheduleStepScrollDrag(canvasOffsetX, canvasOffsetY);

                const cell = this.viewLayout.findScrollableCellClosestToOffset(canvasOffsetX, canvasOffsetY);
                if (cell !== undefined) {
                    this.updateLastSelectionArea(cell); // update the selection
                }
                return true;
            }
        }
    }

    private handleDOWNSHIFT() {
        this.moveShiftSelect();
    }

    private handleUPSHIFT() {
        this.moveShiftSelect();
    }

    private handleLEFTSHIFT() {
        this.moveShiftSelect();
    }

    private handleRIGHTSHIFT() {
        this.moveShiftSelect();
    }

    private handleDOWN(event: KeyboardEvent) {
        this.selectionBehavior.selectOnlyFocusedCell(SelectionArea.TypeSpecifier.Primary);
    }

    private handleUP(event: KeyboardEvent) {
        this.selectionBehavior.selectOnlyFocusedCell(SelectionArea.TypeSpecifier.Primary);
    }

    private handleLEFT() {
        this.selectionBehavior.selectOnlyFocusedCell(SelectionArea.TypeSpecifier.Primary);
    }

    private handleRIGHT() {
        this.selectionBehavior.selectOnlyFocusedCell(SelectionArea.TypeSpecifier.Primary);
    }

    /**
     * @desc If we are holding down the same navigation key, accelerate the increment we scroll
     */
    private getAutoScrollAcceleration() {
        const elapsed = this.getAutoScrollDuration() / 2000;
        const count = Math.max(1, Math.floor(elapsed * elapsed * elapsed * elapsed));
        return count;
    }

    /**
     * @desc set the start time to right now when we initiate an auto scroll
     */
    private setAutoScrollStartTime() {
        this._sbAutoStart = Date.now();
    }

    /**
     * @desc update the autoscroll start time if we haven't autoscrolled within the last 500ms otherwise update the current autoscroll time
     */
    private pingAutoScroll() {
        const now = Date.now();
        if (now - this._sbLastAuto > 500) {
            this.setAutoScrollStartTime();
        }
        this._sbLastAuto = Date.now();
    }

    /**
     * @desc answer how long we have been auto scrolling
     */
    private getAutoScrollDuration() {
        if (Date.now() - this._sbLastAuto > 500) {
            return 0;
        }
        return Date.now() - this._sbAutoStart;
    }

    /**
     * @desc Augment the most recent selection extent by (offsetX,offsetY) and scroll if necessary.
     * @param offsetX - x coordinate to start at
     * @param offsetY - y coordinate to start at
     */
    private moveShiftSelect() {
        const focusPoint = this.focus.currentSubgridPoint;
        if (focusPoint === undefined) {
            throw new AssertError('CSFMSS34440');
        } else {
            const activeColumnIndex = focusPoint.x;
            const subgridRowIndex = focusPoint.y;

            let newX: number | undefined = focusPoint.x;
            let newY: number | undefined = focusPoint.y;

            if (!this.gridSettings.scrollingEnabled) {
                newX = this.viewLayout.limitActiveColumnIndexToView(newX);
                newY = this.viewLayout.limitRowIndexToView(newY);
            }

            if (newX !== undefined && newY !== undefined) {
                const focusSelectionBehavior = this.selectionBehavior;
                focusSelectionBehavior.replaceLastAreaWithRows(activeColumnIndex, subgridRowIndex, newX, newY, this.focus.subgrid);

                if (this.scrollBehavior.ensureRowIsMaximallyVisible(newX)) {
                    this.pingAutoScroll();
                }

                this.renderer.repaint();
            }
        }
    }

    private scheduleStepScrollDrag(canvasOffsetX: number, canvasOffsetY: number) {
        this.scrollBehavior.setScrollingActive(true);
        this._stepScrollDragTimeoutHandle = setTimeout(() => this.checkStepScrollDrag(canvasOffsetX, canvasOffsetY), 25);
    }

    private cancelScheduledStepScrollDrag() {
        if (this._stepScrollDragTimeoutHandle !== undefined) {
            clearTimeout(this._stepScrollDragTimeoutHandle);
            this._stepScrollDragTimeoutHandle = undefined;
        }
        this.scrollBehavior.setScrollingActive(false);
    }

    private selectOnlyCell(originX: number, originY: number, subgrid: SubgridInterface, areaTypeSpecifier: SelectionArea.TypeSpecifier) {
        let lastActiveColumnIndex = this.columnsManager.activeColumnCount - 1;
        let lastSubgridRowIndex = subgrid.getRowCount() - 1;

        if (subgrid === this.focus.subgrid && !this.gridSettings.scrollingEnabled) {
            const lastVisibleScrollableActiveColumnIndex = this.viewLayout.lastScrollableActiveColumnIndex;
            const lastVisableScrollableSubgridRowIndex = this.viewLayout.lastScrollableSubgridRowIndex;

            if (lastVisibleScrollableActiveColumnIndex !== undefined) {
                lastActiveColumnIndex = Math.min(lastActiveColumnIndex, lastVisibleScrollableActiveColumnIndex);
            }
            if (lastVisableScrollableSubgridRowIndex !== undefined) {
                lastSubgridRowIndex = Math.min(lastSubgridRowIndex, lastVisableScrollableSubgridRowIndex);
            }
        }

        originX = Math.min(lastActiveColumnIndex, Math.max(0, originX));
        originY = Math.min(lastSubgridRowIndex, Math.max(0, originY));

        this.selectionBehavior.selectOnlyCell(originX, originY, subgrid, areaTypeSpecifier);

        this._extendSelectOrigin = {
            subgrid,
            point: {
                x: originX,
                y: originY,
            }
        }
    }
}

export namespace CellSelectionUiBehavior {
    export const typeName = 'cellselection';

    export interface ExtendSelectOrigin {
        readonly subgrid: SubgridInterface;
        readonly point: Point;
    }

    export const enum MouseDownAction {
        Only,
        Extend,
        AddDelete,
    }
}
