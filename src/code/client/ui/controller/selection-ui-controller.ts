
import { RevAssertError, RevModifierKey, RevSchemaField, RevSelectionAreaTypeId, RevStartLength, RevUnreachableCaseError } from '../../../common';
import { RevFocus } from '../../components/focus/focus';
import { RevMouse } from '../../components/mouse/mouse';
import { RevLinedHoverCell } from '../../interfaces/lined-hover-cell';
import { RevSubgrid } from '../../interfaces/subgrid';
import { RevViewCell } from '../../interfaces/view-cell';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevGridSettings } from '../../settings';
import { RevUiController } from './ui-controller';

/** @internal */
export class RevSelectionUiController<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevUiController<BGS, BCS, SF> {

    readonly typeName = RevSelectionUiController.typeName;

    /** @internal */
    private _activeDragType: RevMouse.DragType | undefined;
    /**
     * a millisecond value representing the previous time an autoscroll started
     * Probably not used
     */
    private _sbLastAuto = 0;

    /**
     * a millisecond value representing the time the current autoscroll started
     * Probably not used
     */
    private _sbAutoStart = 0;
    private _stepScrollDragTickTimeoutHandle: ReturnType<typeof setTimeout> | undefined;
    private _firstStepScrollDragTime: number | undefined;
    private _lastColumnStepScrollDragTime: number | undefined;
    private _lastRowStepScrollDragTime: number | undefined;

    override handlePointerDown(event: PointerEvent, hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        if (hoverCell === null) {
            hoverCell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (hoverCell === undefined || RevLinedHoverCell.isMouseOverLine(hoverCell)) {
            return super.handlePointerDown(event, hoverCell);
        } else {
            const viewCell = hoverCell.viewCell;
            const subgrid = viewCell.subgrid;
            const isSelectable = subgrid.selectable; // && this.cellPropertiesBehavior.getCellProperty(cell.viewLayout.column, cell.viewLayoutRow.subgridRowIndex, 'cellSelection', subgrid);

            if (!isSelectable) {
                return super.handlePointerDown(event, hoverCell);
            } else {
                if (!viewCell.isScrollable) {
                    return super.handlePointerDown(event, hoverCell);
                } else {
                    const selectSucceeded = this.trySelectInScrollableMain(event, viewCell, false);
                    if (!selectSucceeded) {
                        return super.handlePointerDown(event, hoverCell);
                    } else {
                        return hoverCell;
                    }
                }
            }
        }
    }

    override handleClick(event: MouseEvent, hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined): RevLinedHoverCell<BCS, SF> | null | undefined {
        if (hoverCell === null) {
            hoverCell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (hoverCell === undefined || RevLinedHoverCell.isMouseOverLine(hoverCell)) {
            return super.handleClick(event, hoverCell);
        } else {
            // Only check for Fixed Column or Fixed Row select here.  Rectangle select is checked for in Pointer Down
            let selectSucceeded: boolean;
            const viewCell = hoverCell.viewCell;
            if (viewCell.isColumnFixed) {
                if (!viewCell.subgrid.selectable) {
                    selectSucceeded = false;
                } else {
                    selectSucceeded = this.trySelectRowsFromCell(event, viewCell, false);
                }
            } else {
                if (!viewCell.isHeaderOrRowFixed || !this._mainSubgrid.selectable) {
                    selectSucceeded = false;
                } else {
                    selectSucceeded = this.trySelectColumnsFromCell(event, viewCell, false);
                }
            }

            if (!selectSucceeded) {
                return super.handleClick(event, hoverCell);
            } else {
                return hoverCell;
            }
        }
    }

    override handlePointerDragStart(event: DragEvent, hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        let dragAllowed: boolean;
        if (!this._focusSelectBehavior.isMouseAddToggleExtendSelectionAreaAllowed(event)) {
            dragAllowed = false;
        } else {
            const gridSettings = this._gridSettings;
            dragAllowed = (
                gridSettings.mouseAddToggleExtendSelectionAreaDragModifierKey === undefined ||
                RevModifierKey.isDownInEvent(this._gridSettings.mouseAddToggleExtendSelectionAreaDragModifierKey, event)
            );
        }

        if (!dragAllowed) {
            return super.handlePointerDragStart(event, hoverCell);
        } else {
            if (hoverCell === null) {
                hoverCell = this.tryGetHoverCellFromMouseEvent(event);
            }
            if (hoverCell === undefined || RevLinedHoverCell.isMouseOverLine(hoverCell)) {
                return super.handlePointerDragStart(event, hoverCell);
            } else {
                const viewCell = hoverCell.viewCell;

                let selectSucceeded: boolean;
                if (viewCell.isHeaderOrRowFixed) {
                    selectSucceeded = this.trySelectColumnsFromCell(event, viewCell, true);
                } else {
                    if (viewCell.isColumnFixed) {
                        selectSucceeded = this.trySelectRowsFromCell(event, viewCell, true);
                    } else {
                        if (viewCell.isMain) {
                            selectSucceeded = this.trySelectInScrollableMain(event, viewCell, true)
                        } else {
                            selectSucceeded = false;
                        }
                    }
                }

                if (!selectSucceeded) {
                    return super.handlePointerDragStart(event, hoverCell);
                } else {
                    const dragType = this.getDragTypeFromSelectionLastArea();
                    if (dragType === undefined) {
                        return super.handlePointerDragStart(event, hoverCell);
                    } else {
                        this.setActiveDragType(dragType);
                        return {
                            started: true,
                            hoverCell,
                        };
                    }
                }
            }
        }
    }

    override handlePointerDrag(event: PointerEvent, cell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        if (this._activeDragType === undefined) {
            return super.handlePointerDrag(event, cell);
        } else {
            this.cancelScheduledStepScrollDrag();
            const stepScrolled = this.checkStepScrollDrag(event.offsetX, event.offsetY);
            if (stepScrolled) {
                return cell;
            } else {
                if (cell === null) {
                    cell = this.tryGetHoverCellFromMouseEvent(event);
                }
                if (cell !== undefined) {
                    this.tryUpdateLastSelectionArea(cell.viewCell);
                }
                return cell;
            }
        }
    }

    override handlePointerDragEnd(event: PointerEvent, cell: RevLinedHoverCell<BCS, SF> | null | undefined): RevLinedHoverCell<BCS, SF> | null | undefined {
        if (this._activeDragType === undefined) {
            return super.handlePointerDragEnd(event, cell);
        } else {
            this.cancelStepScroll();
            this.setActiveDragType(undefined);
            return cell;
        }
    }

    override handleKeyDown(event: KeyboardEvent, fromEditor: boolean) {
        if (RevFocus.isNavActionKeyboardKey(event.key as RevFocus.ActionKeyboardKey)) {
            if (RevGridSettings.isExtendLastSelectionAreaModifierKeyDownInEvent(this._gridSettings, event)) {
                if (this._focusSelectBehavior.tryExtendLastSelectionAreaAsCloseAsPossibleToFocus()) {
                    this.pingAutoScroll();
                }
            } else {
                this._focusSelectBehavior.tryOnlySelectFocusedCell();
            }
        }
        super.handleKeyDown(event, fromEditor);
    }

    private trySelectInScrollableMain(
        event: MouseEvent,
        viewCell: RevViewCell<BCS, SF>,
        forceAddToggleToBeAdd: boolean,
    ) {
        const allowedAreaTypeId = this._selection.calculateMouseMainSelectAllowedAreaTypeId();
        switch (allowedAreaTypeId) {
            case undefined: return false;
            case RevSelectionAreaTypeId.rectangle: return this.trySelectRectangleFromCell(event, viewCell, forceAddToggleToBeAdd);
            case RevSelectionAreaTypeId.row: return this.trySelectRowsFromCell(event, viewCell, forceAddToggleToBeAdd);
            case RevSelectionAreaTypeId.column: return this.trySelectColumnsFromCell(event, viewCell, forceAddToggleToBeAdd);
            default:
                throw new RevUnreachableCaseError('SUCTSISM', allowedAreaTypeId);
        }
    }

    private trySelectRectangleFromCell(event: MouseEvent, cell: RevViewCell<BCS, SF>, forceAddToggleToBeAdd: boolean) {
        const gridSettings = this._gridSettings;

        const subgrid = cell.subgrid;
        const activeColumnIndex = cell.viewLayoutColumn.activeColumnIndex;
        const subgridRowIndex = cell.viewLayoutRow.subgridRowIndex;
        const selection = this._selection;
        const mouseAddToggleExtendSelectionAreaAllowed = this._focusSelectBehavior.isMouseAddToggleExtendSelectionAreaAllowed(event);
        const addToggleModifier = mouseAddToggleExtendSelectionAreaAllowed && RevGridSettings.isAddToggleSelectionAreaModifierKeyDownInEvent(gridSettings, event);
        const extendModifier = mouseAddToggleExtendSelectionAreaAllowed && RevGridSettings.isExtendLastSelectionAreaModifierKeyDownInEvent(gridSettings, event);
        const lastArea = this._selection.lastArea;

        if (extendModifier && !addToggleModifier) {
            if (lastArea !== undefined && lastArea.areaTypeId === RevSelectionAreaTypeId.rectangle) {
                const origin = lastArea.inclusiveFirst;
                const startLengthX = RevStartLength.createExclusiveFromFirstLast(origin.x, activeColumnIndex);
                const startLengthY = RevStartLength.createExclusiveFromFirstLast(origin.y, subgridRowIndex);
                selection.replaceLastAreaWithRectangle(
                    startLengthX.start,
                    startLengthY.start,
                    startLengthX.length,
                    startLengthY.length,
                    subgrid,
                );
            } else {
                selection.selectCell(activeColumnIndex, subgridRowIndex, subgrid);
            }
        } else {
            if (addToggleModifier && !extendModifier) {
                if (gridSettings.addToggleSelectionAreaModifierKeyDoesToggle && !forceAddToggleToBeAdd) {
                    selection.toggleSelectCell(activeColumnIndex, subgridRowIndex, subgrid);
                } else {
                    selection.selectCell(activeColumnIndex, subgridRowIndex, subgrid);
                }
            } else {
                this.onlySelectCell(activeColumnIndex, subgridRowIndex, subgrid);
            }
        }

        return true;
    }

    private trySelectColumnsFromCell(event: MouseEvent, cell: RevViewCell<BCS, SF>, forceAddToggleToBeAdd: boolean) {
        const gridSettings = this._gridSettings;
        const allowed = gridSettings.mouseColumnSelectionEnabled &&
        (
            gridSettings.mouseColumnSelectionModifierKey === undefined ||
            RevModifierKey.isDownInEvent(gridSettings.mouseColumnSelectionModifierKey, event)
        );

        if (!allowed) {
            return false;
        } else {
            const activeColumnIndex = cell.viewLayoutColumn.activeColumnIndex;
            const focusPoint = this._focus.current;
            const subgridRowIndex = focusPoint === undefined ? 0 : focusPoint.y;
            const subgrid = this._focus.subgrid;
            const mouseAddToggleExtendSelectionAreaAllowed = this._focusSelectBehavior.isMouseAddToggleExtendSelectionAreaAllowed(event);
            const addToggleModifier = mouseAddToggleExtendSelectionAreaAllowed && RevGridSettings.isAddToggleSelectionAreaModifierKeyDownInEvent(gridSettings, event);
            const extendModifier = mouseAddToggleExtendSelectionAreaAllowed && RevGridSettings.isExtendLastSelectionAreaModifierKeyDownInEvent(gridSettings, event);
            const lastArea = this._selection.lastArea;

            const focusSelectionBehavior = this._focusSelectBehavior;
            if (extendModifier && !addToggleModifier) {
                if (lastArea !== undefined && lastArea.areaTypeId === RevSelectionAreaTypeId.column) {
                    const origin = lastArea.inclusiveFirst;
                    const startLengthX = RevStartLength.createExclusiveFromFirstLast(origin.x, activeColumnIndex);
                    const startLengthY = RevStartLength.createExclusiveFromFirstLast(origin.y, subgridRowIndex);
                    this._selection.replaceLastAreaWithColumns(
                        startLengthX.start,
                        startLengthY.start,
                        startLengthX.length,
                        startLengthY.length,
                        subgrid
                    );
                } else {
                    focusSelectionBehavior.selectColumn(activeColumnIndex);
                }
            } else {
                if (addToggleModifier && !extendModifier) {
                    if (gridSettings.addToggleSelectionAreaModifierKeyDoesToggle && !forceAddToggleToBeAdd) {
                        focusSelectionBehavior.toggleSelectColumn(activeColumnIndex);
                    } else {
                        focusSelectionBehavior.selectColumn(activeColumnIndex);
                    }
                } else {
                    focusSelectionBehavior.onlySelectColumn(activeColumnIndex);
                }
            }

            return true;
        }
    }

    private trySelectRowsFromCell(event: MouseEvent, cell: RevViewCell<BCS, SF>, forceAddToggleToBeAdd: boolean) {
        const gridSettings = this._gridSettings;
        const allowed = gridSettings.mouseRowSelectionEnabled &&
        (
            gridSettings.mouseRowSelectionModifierKey === undefined ||
            RevModifierKey.isDownInEvent(gridSettings.mouseRowSelectionModifierKey, event)
        );

        if (!allowed) {
            return false;
        } else {
            const subgridRowIndex = cell.viewLayoutRow.subgridRowIndex;
            const subgrid = this._focus.subgrid;
            const focusPoint = this._focus.current;
            const cellActiveColumnIndex = focusPoint === undefined ? 0 : focusPoint.x;
            const mouseAddToggleExtendSelectionAreaAllowed = this._focusSelectBehavior.isMouseAddToggleExtendSelectionAreaAllowed(event);
            const addToggleModifier = mouseAddToggleExtendSelectionAreaAllowed && RevGridSettings.isAddToggleSelectionAreaModifierKeyDownInEvent(gridSettings, event);
            const extendModifier = mouseAddToggleExtendSelectionAreaAllowed && RevGridSettings.isExtendLastSelectionAreaModifierKeyDownInEvent(gridSettings, event);
            const lastArea = this._selection.lastArea;

            const focusSelectionBehavior = this._focusSelectBehavior;
            if (extendModifier && !addToggleModifier) {
                if (lastArea !== undefined && lastArea.areaTypeId === RevSelectionAreaTypeId.row) {
                    const origin = lastArea.inclusiveFirst;
                    const startLengthX = RevStartLength.createExclusiveFromFirstLast(origin.x, cellActiveColumnIndex);
                    const startLengthY = RevStartLength.createExclusiveFromFirstLast(origin.y, subgridRowIndex);
                    this._selection.replaceLastAreaWithRows(
                        startLengthX.start,
                        startLengthY.start,
                        startLengthX.length,
                        startLengthY.length,
                        subgrid
                    );
                } else {
                    focusSelectionBehavior.selectRow(subgridRowIndex, subgrid);
                }
            } else {
                if (addToggleModifier && !extendModifier) {
                    if (gridSettings.addToggleSelectionAreaModifierKeyDoesToggle && !forceAddToggleToBeAdd) {
                        focusSelectionBehavior.toggleSelectRow(subgridRowIndex, subgrid);
                    } else {
                        focusSelectionBehavior.selectRow(subgridRowIndex, subgrid);
                    }
                } else {
                    focusSelectionBehavior.onlySelectRow(subgridRowIndex, subgrid);
                }
            }

            return true;
        }
    }

    /**
     * Handle a mousedrag selection.
     * @param keys - array of the keys that are currently pressed down
     */
    private tryUpdateLastSelectionArea(cell: RevViewCell<BCS, SF>) {
        const selection = this._selection;
        const lastArea = selection.lastArea;
        if (lastArea === undefined) {
            throw new RevAssertError('SUBULSA54455');
        } else {
            const subgrid = cell.subgrid;
            // let updatePossible: boolean;

            // switch (lastArea.areaType) {
            //     case RevSelectionAreaType.Rectangle: {
            //         updatePossible =
            //             this.isCellAndLastAreaColumnFixedSame(cell, lastArea) &&
            //             this.isCellAndLastAreaRowFixedSame(cell, lastArea) &&
            //             subgrid === selection.subgrid
            //         break;
            //     }
            //     case RevSelectionAreaType.Column: {
            //         updatePossible = this.isCellAndLastAreaColumnFixedSame(cell, lastArea);
            //         break;
            //     }
            //     case RevSelectionAreaType.Row: {
            //         updatePossible =
            //             this.isCellAndLastAreaColumnFixedSame(cell, lastArea) &&
            //             this.isCellAndLastAreaRowFixedSame(cell, lastArea) &&
            //             subgrid === selection.subgrid
            //         break;
            //     }
            // }
            const lastAreaFirstX = lastArea.inclusiveFirst.x;
            const lastAreaFirstXColumnFixed = lastAreaFirstX < this._gridSettings.fixedColumnCount;
            if (cell.isColumnFixed === lastAreaFirstXColumnFixed) {
                const lastAreaFirstY = lastArea.inclusiveFirst.y;
                const lastAreaFirstYRowFixed = lastAreaFirstY < this._gridSettings.fixedRowCount;
                if (cell.isRowFixed === lastAreaFirstYRowFixed) {
                    if (lastArea.areaTypeId === RevSelectionAreaTypeId.column || subgrid === selection.subgrid) {
                        const origin = lastArea.inclusiveFirst;
                        const xExclusiveStartLength = RevStartLength.createExclusiveFromFirstLast(origin.x, cell.viewLayoutColumn.activeColumnIndex);
                        const yExclusiveStartLength = RevStartLength.createExclusiveFromFirstLast(origin.y, cell.viewLayoutRow.subgridRowIndex);
                        selection.replaceLastArea(
                            lastArea.areaTypeId,
                            xExclusiveStartLength.start,
                            yExclusiveStartLength.start,
                            xExclusiveStartLength.length,
                            yExclusiveStartLength.length,
                            subgrid,
                        );
                    }
                }
            }
        }
    }

    // private isCellAndLastAreaColumnFixedSame(cell: RevViewCell, lastArea: LastSelectionArea) {
    //     const lastAreaFirstX = lastArea.inclusiveFirst.x;
    //     const lastAreaFirstXColumnFixed = lastAreaFirstX < this.gridSettings.fixedColumnCount;
    //     return cell.isColumnFixed === lastAreaFirstXColumnFixed;
    // }

    // private isCellAndLastAreaRowFixedSame(cell: RevViewCell, lastArea: LastSelectionArea) {
    //     const lastAreaFirstY = lastArea.inclusiveFirst.y;
    //     const lastAreaFirstYRowFixed = lastAreaFirstY < this.gridSettings.fixedRowCount;
    //     return cell.isRowFixed === lastAreaFirstYRowFixed;
    // }

    /**
     * this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
     */
    private checkStepScrollDrag(canvasOffsetX: number, canvasOffsetY: number) {
        const scrollableBounds = this._viewLayout.scrollableCanvasBounds;
        if (scrollableBounds === undefined || !this._gridSettings.scrollingEnabled) {
            this.cancelStepScroll();
            return false;
        } else {
            const xInScrollableBounds = scrollableBounds.containsX(canvasOffsetX);
            const yInScrollableBounds = scrollableBounds.containsY(canvasOffsetY);
            if (xInScrollableBounds && yInScrollableBounds) {
                this.cancelStepScroll();
                return false;
            } else {
                if (this._firstStepScrollDragTime === undefined) {
                    this._firstStepScrollDragTime = performance.now();
                }
                const firstStepScrollDragTime = this._firstStepScrollDragTime;

                let stepScrolled = false;
                if (!xInScrollableBounds) {
                    stepScrolled = this.checkStepScrollColumn(canvasOffsetX, firstStepScrollDragTime);
                }

                if (!yInScrollableBounds) {
                    if (this.checkStepScrollRow(canvasOffsetY, firstStepScrollDragTime)) {
                        stepScrolled = true;
                    }
                }

                if (!stepScrolled) {
                    this.cancelStepScroll();
                    return false;
                } else {
                    this.scheduleStepScrollDragTick(canvasOffsetX, canvasOffsetY);

                    const cell = this._viewLayout.findScrollableCellClosestToCanvasOffset(canvasOffsetX, canvasOffsetY);
                    if (cell !== undefined) {
                        this.tryUpdateLastSelectionArea(cell); // update the selection
                    }
                    return true;
                }
            }
        }
    }

    /**
     * If we are holding down the same navigation key, accelerate the increment we scroll
     */
    private getAutoScrollAcceleration() {
        const elapsed = this.getAutoScrollDuration() / 2000;
        const count = Math.max(1, Math.floor(elapsed * elapsed * elapsed * elapsed));
        return count;
    }

    /**
     * set the start time to right now when we initiate an auto scroll
     */
    private setAutoScrollStartTime() {
        this._sbAutoStart = Date.now();
    }

    /**
     * update the autoscroll start time if we haven't autoscrolled within the last 500ms otherwise update the current autoscroll time
     */
    private pingAutoScroll() {
        const now = Date.now();
        if (now - this._sbLastAuto > 500) {
            this.setAutoScrollStartTime();
        }
        this._sbLastAuto = Date.now();
    }

    /**
     * answer how long we have been auto scrolling
     */
    private getAutoScrollDuration() {
        if (Date.now() - this._sbLastAuto > 500) {
            return 0;
        }
        return Date.now() - this._sbAutoStart;
    }

    private scheduleStepScrollDragTick(canvasOffsetX: number, canvasOffsetY: number) {
        this._stepScrollDragTickTimeoutHandle = setTimeout(
            () => {
                this._stepScrollDragTickTimeoutHandle = undefined;
                this.checkStepScrollDrag(canvasOffsetX, canvasOffsetY)
            },
            RevSelectionUiController.scheduleStepScrollDragTickInterval
        );
    }

    private cancelScheduledStepScrollDrag() {
        if (this._stepScrollDragTickTimeoutHandle !== undefined) {
            clearTimeout(this._stepScrollDragTickTimeoutHandle);
            this._stepScrollDragTickTimeoutHandle = undefined;
        }
    }

    private cancelStepScroll() {
        this.cancelScheduledStepScrollDrag();
        this._firstStepScrollDragTime = undefined;
        this._lastColumnStepScrollDragTime = undefined;
        this._lastRowStepScrollDragTime = undefined;
    }

    private checkStepScrollColumn(directionCanvasOffsetX: number, firstStepScrollDragTime: number) {
        const nowTime = performance.now();
        let actualStep: boolean;
        if (this._lastColumnStepScrollDragTime === undefined) {
            actualStep = true;
        } else {
            const steppingTime = nowTime - firstStepScrollDragTime;
            let stepInterval: number;
            if (steppingTime >= 4000 ) {
                stepInterval = 150;
            } else {
                if (steppingTime >= 3000 ) {
                    stepInterval = 250;
                } else {
                    if (steppingTime >= 2200) {
                        stepInterval = 400;
                    } else {
                        if (steppingTime >= 1200) {
                            stepInterval = 500;
                        } else {
                            stepInterval = 600;
                        }
                    }
                }
            }
            const nextStepTime = this._lastColumnStepScrollDragTime + stepInterval;
            actualStep = nowTime >= nextStepTime;
        }

        let stepped: boolean;
        if (actualStep) {
            this._lastColumnStepScrollDragTime = nowTime;
            stepped = this._focusScrollBehavior.tryStepScrollColumn(directionCanvasOffsetX);
        } else {
            stepped = true; // dummy step
        }
        return stepped;
    }

    private checkStepScrollRow(directionCanvasOffsetY: number, firstStepScrollDragTime: number) {
        const nowTime = performance.now();
        let actualStep: boolean;
        if (this._lastRowStepScrollDragTime === undefined) {
            actualStep = true;
        } else {
            const steppingTime = nowTime - firstStepScrollDragTime;
            let stepInterval: number;
            if (steppingTime >= 3500 ) {
                stepInterval = 35;
            } else {
                if (steppingTime >= 2800 ) {
                    stepInterval = 50;
                } else {
                    if (steppingTime >= 2000 ) {
                        stepInterval = 90;
                    } else {
                        if (steppingTime >= 1100) {
                            stepInterval = 130;
                        } else {
                            if (steppingTime >= 500) {
                                stepInterval = 200;
                            } else {
                                stepInterval = 250;
                            }
                        }
                    }
                }
            }
            const nextStepTime = this._lastRowStepScrollDragTime + stepInterval;
            actualStep = nowTime >= nextStepTime;
        }

        let stepped: boolean;
        if (actualStep) {
            this._lastRowStepScrollDragTime = nowTime;
            stepped = this._focusScrollBehavior.tryStepScrollRow(directionCanvasOffsetY);
        } else {
            stepped = true; // dummy step
        }
        return stepped;
    }

    private onlySelectCell(originX: number, originY: number, subgrid: RevSubgrid<BCS, SF>) {
        let lastActiveColumnIndex = this._columnsManager.activeColumnCount - 1;
        let lastSubgridRowIndex = subgrid.getRowCount() - 1;

        let focusLinked: boolean;
        if (subgrid !== this._focus.subgrid) {
            focusLinked = false;
        } else {
            if (!this._gridSettings.scrollingEnabled) {
                const lastVisibleScrollableActiveColumnIndex = this._viewLayout.lastScrollableActiveColumnIndex;
                const lastVisibleScrollableSubgridRowIndex = this._viewLayout.lastScrollableRowSubgridRowIndex;

                if (lastVisibleScrollableActiveColumnIndex !== undefined) {
                    lastActiveColumnIndex = Math.min(lastActiveColumnIndex, lastVisibleScrollableActiveColumnIndex);
                }
                if (lastVisibleScrollableSubgridRowIndex !== undefined) {
                    lastSubgridRowIndex = Math.min(lastSubgridRowIndex, lastVisibleScrollableSubgridRowIndex);
                }
            }

            const focusPoint = this._focus.current;
            if (focusPoint === undefined) {
                focusLinked = false;
            } else {
                const focusActiveColumnIndex = focusPoint.x;
                if (focusActiveColumnIndex !== originX) {
                    focusLinked = false;
                } else {
                    const focusSubgridRowIndex = focusPoint.y;
                    focusLinked = focusSubgridRowIndex === originY;
                }
            }
        }

        originX = Math.min(lastActiveColumnIndex, Math.max(0, originX));
        originY = Math.min(lastSubgridRowIndex, Math.max(0, originY));

        this._selection.beginChange();
        this._selection.onlySelectCell(originX, originY, subgrid);
        if (focusLinked) {
            this._selection.flagFocusLinked();
        }
        this._selection.endChange();
    }

    private getDragTypeFromSelectionLastArea() {
        const lastArea = this._selection.lastArea;
        if (lastArea === undefined) {
            return undefined;
        } else {
            switch (lastArea.areaTypeId) {
                case RevSelectionAreaTypeId.all:
                    throw new RevAssertError('SUCGDTFSLA44377');
                case RevSelectionAreaTypeId.rectangle: return RevMouse.DragType.lastRectangleSelectionAreaExtending;
                case RevSelectionAreaTypeId.column: return RevMouse.DragType.lastColumnSelectionAreaExtending;
                case RevSelectionAreaTypeId.row: return RevMouse.DragType.lastRowSelectionAreaExtending;
                default:
                    throw new RevUnreachableCaseError('SUBGDTFSLA59598', lastArea.areaTypeId);
            }
        }
    }

    private setActiveDragType(dragType: RevMouse.DragType | undefined) {
        this._activeDragType = dragType;
        this._mouse.setActiveDragType(dragType);
        if (dragType === undefined) {
            this._mouse.setOperation(undefined, undefined);
        } else {
            this._mouse.setOperation(this._gridSettings.mouseLastSelectionAreaExtendingDragActiveCursorName, this._gridSettings.mouseLastSelectionAreaExtendingDragActiveTitleText);
        }
    }

    // private dragTypesArrayContainsExtendLastSelectionAreaDragType(types: readonly RevMouse.DragTypeEnum[]) {
    //     for (const type of types) {
    //         if (this.dragTypeIsExtendLastSelectionArea(type)) {
    //             return true;
    //         }
    //     }
    //     return false;
    // }

    // private dragTypeIsExtendLastSelectionArea(type: RevMouse.DragTypeEnum) {
    //     return (
    //         type === RevMouse.DragTypeEnum.ExtendLastRectangleSelectionArea ||
    //         type === RevMouse.DragTypeEnum.ExtendLastColumnSelectionArea ||
    //         type === RevMouse.DragTypeEnum.ExtendLastRowSelectionArea
    //     );
    // }
}

/** @internal */
export namespace RevSelectionUiController {
    export const typeName = 'selection';

    export const scheduleStepScrollDragTickInterval = 20;
}
