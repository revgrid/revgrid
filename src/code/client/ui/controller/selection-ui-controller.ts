
import { Focus } from '../../components/focus/focus';
import { Mouse } from '../../components/mouse/mouse';
import { LinedHoverCell } from '../../interfaces/data/hover-cell';
import { Subgrid } from '../../interfaces/data/subgrid';
import { ViewCell } from '../../interfaces/data/view-cell';
import { SchemaField } from '../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { GridSettings } from '../../interfaces/settings/grid-settings';
import { ModifierKey } from '../../types-utils/modifier-key';
import { RevAssertError, RevUnreachableCaseError } from '../../types-utils/revgrid-error';
import { SelectionAreaTypeId } from '../../types-utils/selection-area-type';
import { StartLength } from '../../types-utils/start-length';
import { UiController } from './ui-controller';

/** @internal */
export class SelectionUiController<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> extends UiController<BGS, BCS, SF> {

    readonly typeName = SelectionUiController.typeName;

    /** @internal */
    private _activeDragType: Mouse.DragTypeEnum | undefined;
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

    override handlePointerDown(event: PointerEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        if (hoverCell === null) {
            hoverCell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (hoverCell === undefined || LinedHoverCell.isMouseOverLine(hoverCell)) {
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

    override handleClick(event: MouseEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined): LinedHoverCell<BCS, SF> | null | undefined {
        if (hoverCell === null) {
            hoverCell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (hoverCell === undefined || LinedHoverCell.isMouseOverLine(hoverCell)) {
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
                if (!viewCell.isHeaderOrRowFixed || !this.mainSubgrid.selectable) {
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

    override handlePointerDragStart(event: DragEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        let dragAllowed: boolean;
        if (!this.focusSelectBehavior.isMouseAddToggleExtendSelectionAreaAllowed(event)) {
            dragAllowed = false;
        } else {
            const gridSettings = this.gridSettings;
            dragAllowed = (
                gridSettings.mouseAddToggleExtendSelectionAreaDragModifierKey === undefined ||
                ModifierKey.isDownInEvent(this.gridSettings.mouseAddToggleExtendSelectionAreaDragModifierKey, event)
            );
        }

        if (!dragAllowed) {
            return super.handlePointerDragStart(event, hoverCell);
        } else {
            if (hoverCell === null) {
                hoverCell = this.tryGetHoverCellFromMouseEvent(event);
            }
            if (hoverCell === undefined || LinedHoverCell.isMouseOverLine(hoverCell)) {
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

    override handlePointerDrag(event: PointerEvent, cell: LinedHoverCell<BCS, SF> | null | undefined) {
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

    override handlePointerDragEnd(event: PointerEvent, cell: LinedHoverCell<BCS, SF> | null | undefined): LinedHoverCell<BCS, SF> | null | undefined {
        if (this._activeDragType === undefined) {
            return super.handlePointerDragEnd(event, cell);
        } else {
            this.cancelStepScroll();
            this.setActiveDragType(undefined);
            return cell;
        }
    }

    override handleKeyDown(event: KeyboardEvent, fromEditor: boolean) {
        if (Focus.isNavActionKeyboardKey(event.key)) {
            if (GridSettings.isExtendLastSelectionAreaModifierKeyDownInEvent(this.gridSettings, event)) {
                if (this.focusSelectBehavior.tryExtendLastSelectionAreaAsCloseAsPossibleToFocus()) {
                    this.pingAutoScroll();
                }
            } else {
                this.focusSelectBehavior.tryOnlySelectFocusedCell();
            }
        }
        super.handleKeyDown(event, fromEditor);
    }

    private trySelectInScrollableMain(
        event: MouseEvent,
        viewCell: ViewCell<BCS, SF>,
        forceAddToggleToBeAdd: boolean,
    ) {
        const allowedAreaTypeId = this.selection.calculateMouseMainSelectAllowedAreaTypeId();
        switch (allowedAreaTypeId) {
            case undefined: return false;
            case SelectionAreaTypeId.rectangle: return this.trySelectRectangleFromCell(event, viewCell, forceAddToggleToBeAdd);
            case SelectionAreaTypeId.row: return this.trySelectRowsFromCell(event, viewCell, forceAddToggleToBeAdd);
            case SelectionAreaTypeId.column: return this.trySelectColumnsFromCell(event, viewCell, forceAddToggleToBeAdd);
            default:
                throw new RevUnreachableCaseError('SUCTSISM', allowedAreaTypeId);
        }
    }

    private trySelectRectangleFromCell(event: MouseEvent, cell: ViewCell<BCS, SF>, forceAddToggleToBeAdd: boolean) {
        const gridSettings = this.gridSettings;

        const subgrid = cell.subgrid;
        const activeColumnIndex = cell.viewLayoutColumn.activeColumnIndex;
        const subgridRowIndex = cell.viewLayoutRow.subgridRowIndex;
        const selection = this.selection;
        const mouseAddToggleExtendSelectionAreaAllowed = this.focusSelectBehavior.isMouseAddToggleExtendSelectionAreaAllowed(event);
        const addToggleModifier = mouseAddToggleExtendSelectionAreaAllowed && GridSettings.isAddToggleSelectionAreaModifierKeyDownInEvent(gridSettings, event);
        const extendModifier = mouseAddToggleExtendSelectionAreaAllowed && GridSettings.isExtendLastSelectionAreaModifierKeyDownInEvent(gridSettings, event);
        const lastArea = this.selection.lastArea;

        if (extendModifier && !addToggleModifier) {
            if (lastArea !== undefined && lastArea.areaTypeId === SelectionAreaTypeId.rectangle) {
                const origin = lastArea.inclusiveFirst;
                const startLengthX = StartLength.createExclusiveFromFirstLast(origin.x, activeColumnIndex);
                const startLengthY = StartLength.createExclusiveFromFirstLast(origin.y, subgridRowIndex);
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

    private trySelectColumnsFromCell(event: MouseEvent, cell: ViewCell<BCS, SF>, forceAddToggleToBeAdd: boolean) {
        const gridSettings = this.gridSettings;
        const allowed = gridSettings.mouseColumnSelectionEnabled &&
        (
            gridSettings.mouseColumnSelectionModifierKey === undefined ||
            ModifierKey.isDownInEvent(gridSettings.mouseColumnSelectionModifierKey, event)
        );

        if (!allowed) {
            return false;
        } else {
            const activeColumnIndex = cell.viewLayoutColumn.activeColumnIndex;
            const focusPoint = this.focus.current;
            const subgridRowIndex = focusPoint === undefined ? 0 : focusPoint.y;
            const subgrid = this.focus.subgrid;
            const mouseAddToggleExtendSelectionAreaAllowed = this.focusSelectBehavior.isMouseAddToggleExtendSelectionAreaAllowed(event);
            const addToggleModifier = mouseAddToggleExtendSelectionAreaAllowed && GridSettings.isAddToggleSelectionAreaModifierKeyDownInEvent(gridSettings, event);
            const extendModifier = mouseAddToggleExtendSelectionAreaAllowed && GridSettings.isExtendLastSelectionAreaModifierKeyDownInEvent(gridSettings, event);
            const lastArea = this.selection.lastArea;

            const focusSelectionBehavior = this.focusSelectBehavior;
            if (extendModifier && !addToggleModifier) {
                if (lastArea !== undefined && lastArea.areaTypeId === SelectionAreaTypeId.column) {
                    const origin = lastArea.inclusiveFirst;
                    const startLengthX = StartLength.createExclusiveFromFirstLast(origin.x, activeColumnIndex);
                    const startLengthY = StartLength.createExclusiveFromFirstLast(origin.y, subgridRowIndex);
                    this.selection.replaceLastAreaWithColumns(
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

    private trySelectRowsFromCell(event: MouseEvent, cell: ViewCell<BCS, SF>, forceAddToggleToBeAdd: boolean) {
        const gridSettings = this.gridSettings;
        const allowed = gridSettings.mouseRowSelectionEnabled &&
        (
            gridSettings.mouseRowSelectionModifierKey === undefined ||
            ModifierKey.isDownInEvent(gridSettings.mouseRowSelectionModifierKey, event)
        );

        if (!allowed) {
            return false;
        } else {
            const subgridRowIndex = cell.viewLayoutRow.subgridRowIndex;
            const subgrid = this.focus.subgrid;
            const focusPoint = this.focus.current;
            const cellActiveColumnIndex = focusPoint === undefined ? 0 : focusPoint.x;
            const mouseAddToggleExtendSelectionAreaAllowed = this.focusSelectBehavior.isMouseAddToggleExtendSelectionAreaAllowed(event);
            const addToggleModifier = mouseAddToggleExtendSelectionAreaAllowed && GridSettings.isAddToggleSelectionAreaModifierKeyDownInEvent(gridSettings, event);
            const extendModifier = mouseAddToggleExtendSelectionAreaAllowed && GridSettings.isExtendLastSelectionAreaModifierKeyDownInEvent(gridSettings, event);
            const lastArea = this.selection.lastArea;

            const focusSelectionBehavior = this.focusSelectBehavior;
            if (extendModifier && !addToggleModifier) {
                if (lastArea !== undefined && lastArea.areaTypeId === SelectionAreaTypeId.row) {
                    const origin = lastArea.inclusiveFirst;
                    const startLengthX = StartLength.createExclusiveFromFirstLast(origin.x, cellActiveColumnIndex);
                    const startLengthY = StartLength.createExclusiveFromFirstLast(origin.y, subgridRowIndex);
                    this.selection.replaceLastAreaWithRows(
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
    private tryUpdateLastSelectionArea(cell: ViewCell<BCS, SF>) {
        const selection = this.selection;
        const lastArea = selection.lastArea;
        if (lastArea === undefined) {
            throw new RevAssertError('SUBULSA54455');
        } else {
            const subgrid = cell.subgrid;
            // let updatePossible: boolean;

            // switch (lastArea.areaType) {
            //     case SelectionAreaType.Rectangle: {
            //         updatePossible =
            //             this.isCellAndLastAreaColumnFixedSame(cell, lastArea) &&
            //             this.isCellAndLastAreaRowFixedSame(cell, lastArea) &&
            //             subgrid === selection.subgrid
            //         break;
            //     }
            //     case SelectionAreaType.Column: {
            //         updatePossible = this.isCellAndLastAreaColumnFixedSame(cell, lastArea);
            //         break;
            //     }
            //     case SelectionAreaType.Row: {
            //         updatePossible =
            //             this.isCellAndLastAreaColumnFixedSame(cell, lastArea) &&
            //             this.isCellAndLastAreaRowFixedSame(cell, lastArea) &&
            //             subgrid === selection.subgrid
            //         break;
            //     }
            // }
            const lastAreaFirstX = lastArea.inclusiveFirst.x;
            const lastAreaFirstXColumnFixed = lastAreaFirstX < this.gridSettings.fixedColumnCount;
            if (cell.isColumnFixed === lastAreaFirstXColumnFixed) {
                const lastAreaFirstY = lastArea.inclusiveFirst.y;
                const lastAreaFirstYRowFixed = lastAreaFirstY < this.gridSettings.fixedRowCount;
                if (cell.isRowFixed === lastAreaFirstYRowFixed) {
                    if (lastArea.areaTypeId === SelectionAreaTypeId.column || subgrid === selection.subgrid) {
                        const origin = lastArea.inclusiveFirst;
                        const xExclusiveStartLength = StartLength.createExclusiveFromFirstLast(origin.x, cell.viewLayoutColumn.activeColumnIndex);
                        const yExclusiveStartLength = StartLength.createExclusiveFromFirstLast(origin.y, cell.viewLayoutRow.subgridRowIndex);
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

    // private isCellAndLastAreaColumnFixedSame(cell: ViewCell, lastArea: LastSelectionArea) {
    //     const lastAreaFirstX = lastArea.inclusiveFirst.x;
    //     const lastAreaFirstXColumnFixed = lastAreaFirstX < this.gridSettings.fixedColumnCount;
    //     return cell.isColumnFixed === lastAreaFirstXColumnFixed;
    // }

    // private isCellAndLastAreaRowFixedSame(cell: ViewCell, lastArea: LastSelectionArea) {
    //     const lastAreaFirstY = lastArea.inclusiveFirst.y;
    //     const lastAreaFirstYRowFixed = lastAreaFirstY < this.gridSettings.fixedRowCount;
    //     return cell.isRowFixed === lastAreaFirstYRowFixed;
    // }

    /**
     * this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
     */
    private checkStepScrollDrag(canvasOffsetX: number, canvasOffsetY: number) {
        const scrollableBounds = this.viewLayout.scrollableCanvasBounds;
        if (scrollableBounds === undefined || !this.gridSettings.scrollingEnabled) {
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

                    const cell = this.viewLayout.findScrollableCellClosestToCanvasOffset(canvasOffsetX, canvasOffsetY);
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
            SelectionUiController.scheduleStepScrollDragTickInterval
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
            stepped = this.focusScrollBehavior.tryStepScrollColumn(directionCanvasOffsetX);
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
            stepped = this.focusScrollBehavior.tryStepScrollRow(directionCanvasOffsetY);
        } else {
            stepped = true; // dummy step
        }
        return stepped;
    }

    private onlySelectCell(originX: number, originY: number, subgrid: Subgrid<BCS, SF>) {
        let lastActiveColumnIndex = this.columnsManager.activeColumnCount - 1;
        let lastSubgridRowIndex = subgrid.getRowCount() - 1;

        let focusLinked: boolean;
        if (subgrid !== this.focus.subgrid) {
            focusLinked = false;
        } else {
            if (!this.gridSettings.scrollingEnabled) {
                const lastVisibleScrollableActiveColumnIndex = this.viewLayout.lastScrollableActiveColumnIndex;
                const lastVisibleScrollableSubgridRowIndex = this.viewLayout.lastScrollableRowSubgridRowIndex;

                if (lastVisibleScrollableActiveColumnIndex !== undefined) {
                    lastActiveColumnIndex = Math.min(lastActiveColumnIndex, lastVisibleScrollableActiveColumnIndex);
                }
                if (lastVisibleScrollableSubgridRowIndex !== undefined) {
                    lastSubgridRowIndex = Math.min(lastSubgridRowIndex, lastVisibleScrollableSubgridRowIndex);
                }
            }

            const focusPoint = this.focus.current;
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

        this.selection.beginChange();
        this.selection.onlySelectCell(originX, originY, subgrid);
        if (focusLinked) {
            this.selection.flagFocusLinked();
        }
        this.selection.endChange();
    }

    private getDragTypeFromSelectionLastArea() {
        const lastArea = this.selection.lastArea;
        if (lastArea === undefined) {
            return undefined;
        } else {
            switch (lastArea.areaTypeId) {
                case SelectionAreaTypeId.all:
                    throw new RevAssertError('SUCGDTFSLA44377');
                case SelectionAreaTypeId.rectangle: return Mouse.DragTypeEnum.LastRectangleSelectionAreaExtending;
                case SelectionAreaTypeId.column: return Mouse.DragTypeEnum.LastColumnSelectionAreaExtending;
                case SelectionAreaTypeId.row: return Mouse.DragTypeEnum.LastRowSelectionAreaExtending;
                default:
                    throw new RevUnreachableCaseError('SUBGDTFSLA59598', lastArea.areaTypeId);
            }
        }
    }

    private setActiveDragType(dragType: Mouse.DragTypeEnum | undefined) {
        this._activeDragType = dragType;
        this.mouse.setActiveDragType(dragType);
        if (dragType === undefined) {
            this.mouse.setOperation(undefined, undefined);
        } else {
            this.mouse.setOperation(this.gridSettings.mouseLastSelectionAreaExtendingDragActiveCursorName, this.gridSettings.mouseLastSelectionAreaExtendingDragActiveTitleText);
        }
    }

    // private dragTypesArrayContainsExtendLastSelectionAreaDragType(types: readonly Mouse.DragTypeEnum[]) {
    //     for (const type of types) {
    //         if (this.dragTypeIsExtendLastSelectionArea(type)) {
    //             return true;
    //         }
    //     }
    //     return false;
    // }

    // private dragTypeIsExtendLastSelectionArea(type: Mouse.DragTypeEnum) {
    //     return (
    //         type === Mouse.DragTypeEnum.ExtendLastRectangleSelectionArea ||
    //         type === Mouse.DragTypeEnum.ExtendLastColumnSelectionArea ||
    //         type === Mouse.DragTypeEnum.ExtendLastRowSelectionArea
    //     );
    // }
}

/** @internal */
export namespace SelectionUiController {
    export const typeName = 'selection';

    export const scheduleStepScrollDragTickInterval = 20;
}
