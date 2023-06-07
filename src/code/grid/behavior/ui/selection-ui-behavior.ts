
import { EventDetail } from '../../components/event/event-detail';
import { LinedHoverCell } from '../../interfaces/data/hover-cell';
import { Subgrid } from '../../interfaces/data/subgrid';
import { ViewCell } from '../../interfaces/data/view-cell';
import { SchemaServer } from '../../interfaces/schema/schema-server';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { GridSettings } from '../../interfaces/settings/grid-settings';
import { isSecondaryMouseButton } from '../../types-utils/html-types';
import { Point } from '../../types-utils/point';
import { AssertError, UnreachableCaseError } from '../../types-utils/revgrid-error';
import { StartLength } from '../../types-utils/start-length';
import { SelectionAreaType, SelectionAreaTypeSpecifier } from '../../types-utils/types';
import { UiBehavior } from './ui-behavior';

/** @internal */
export class SelectionUiBehavior<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SC extends SchemaServer.Column<BCS>> extends UiBehavior<BGS, BCS, SC> {

    readonly typeName = SelectionUiBehavior.typeName;

    /** @internal */
    private _activeDragType: EventDetail.DragTypeEnum | undefined;
    /**
     * a millisecond value representing the previous time an autoscroll started
     */
    private _sbLastAuto = 0;

    /**
     * a millisecond value representing the time the current autoscroll started
     */
    private _sbAutoStart = 0;
    private _stepScrollDragTickTimeoutHandle: ReturnType<typeof setTimeout> | undefined;
    private _firstStepScrollDragTime: number | undefined;
    private _lastColumnStepScrollDragTime: number | undefined;
    private _lastRowStepScrollDragTime: number | undefined;

    override handlePointerDown(event: PointerEvent, hoverCell: LinedHoverCell<BCS, SC> | null | undefined) {
        if (!event.altKey || isSecondaryMouseButton(event)) {
            this.selection.clear();
            return super.handlePointerDown(event, hoverCell);
        } else {
            if (hoverCell === undefined) {
                hoverCell = this.tryGetHoverCellFromMouseEvent(event);
            }
            if (hoverCell === null || LinedHoverCell.isMouseOverLine(hoverCell)) {
                return super.handlePointerDown(event, hoverCell);
            } else {
                const viewCell = hoverCell.viewCell;
                const subgrid = viewCell.subgrid;
                const isSelectable = subgrid.selectable; // && this.cellPropertiesBehavior.getCellProperty(cell.viewLayout.column, cell.viewLayoutRow.subgridRowIndex, 'cellSelection', subgrid);

                if (!isSelectable) {
                    return super.handlePointerDown(event, hoverCell);
                } else {
                    let selectSucceeded: boolean;
                    if (!viewCell.isScrollable) {
                        return super.handlePointerDown(event, hoverCell);
                    } else {
                        selectSucceeded = this.trySelectFromMouseDownInScrollableMain(event, viewCell);
                        if (!selectSucceeded) {
                            return super.handlePointerDown(event, hoverCell);
                        } else {
                            return hoverCell;
                        }
                    }
                }
            }
        }
    }

    override handleClick(event: MouseEvent, hoverCell: LinedHoverCell<BCS, SC> | null | undefined): LinedHoverCell<BCS, SC> | null | undefined {
        if (!event.altKey || isSecondaryMouseButton(event)) {
            return super.handleClick(event, hoverCell);
        } else {
            if (hoverCell === undefined) {
                hoverCell = this.tryGetHoverCellFromMouseEvent(event);
            }
            if (hoverCell === null || LinedHoverCell.isMouseOverLine(hoverCell)) {
                return super.handleClick(event, hoverCell);
            } else {
                let selectSucceeded: boolean;
                const viewCell = hoverCell.viewCell;
                if (viewCell.isColumnFixed) {
                    if (!viewCell.subgrid.selectable) {
                        selectSucceeded = false;
                    } else {
                        selectSucceeded = this.trySelectFromMouseDownInFixedColumn(event, viewCell);
                    }
                } else {
                    if (!viewCell.isHeaderOrRowFixed || !this.mainSubgrid.selectable) {
                        selectSucceeded = false;
                    } else {
                        selectSucceeded = this.trySelectFromMouseDownInHeaderOrFixedRow(event, viewCell);
                    }
                }

                if (!selectSucceeded) {
                    return super.handleClick(event, hoverCell);
                } else {
                    return hoverCell;
                }
            }
        }
    }

    override handlePointerDragStart(event: DragEvent, hoverCell: LinedHoverCell<BCS, SC> | null | undefined) {
        if (!event.altKey || isSecondaryMouseButton(event)) {
            return super.handlePointerDragStart(event, hoverCell);
        } else {
            if (hoverCell === undefined) {
                hoverCell = this.tryGetHoverCellFromMouseEvent(event);
            }
            if (hoverCell === null || LinedHoverCell.isMouseOverLine(hoverCell)) {
                return super.handlePointerDragStart(event, hoverCell);
            } else {
                const viewCell = hoverCell.viewCell;
                const subgrid = viewCell.subgrid;
                const isSelectable = subgrid.selectable; // && this.cellPropertiesBehavior.getCellProperty(cell.viewLayout.column, cell.viewLayoutRow.subgridRowIndex, 'cellSelection', subgrid);

                if (!isSelectable) {
                    return super.handlePointerDragStart(event, hoverCell);
                } else {
                    let selectSucceeded: boolean;
                    if (viewCell.isHeaderOrRowFixed) {
                        selectSucceeded = this.trySelectFromMouseDownInHeaderOrFixedRow(event, viewCell);
                    } else {
                        if (viewCell.isColumnFixed) {
                            selectSucceeded = this.trySelectFromMouseDownInFixedColumn(event, viewCell);
                        } else {
                            if (viewCell.isMain) {
                                selectSucceeded = this.trySelectFromMouseDownInScrollableMain(event, viewCell)
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
    }

    override handlePointerDrag(event: PointerEvent, cell: LinedHoverCell<BCS, SC> | null | undefined) {
        if (this._activeDragType === undefined) {
            return super.handlePointerDrag(event, cell);
        } else {
            this.cancelScheduledStepScrollDrag();
            const stepScrolled = this.checkStepScrollDrag(event.offsetX, event.offsetY);
            if (stepScrolled) {
                return cell;
            } else {
                if (cell === undefined) {
                    cell = this.tryGetHoverCellFromMouseEvent(event);
                }
                if (cell !== null) {
                    this.tryUpdateLastSelectionArea(cell.viewCell);
                }
                return cell;
            }
        }
    }

    override handlePointerDragEnd(event: PointerEvent, cell: LinedHoverCell<BCS, SC> | null | undefined): LinedHoverCell<BCS, SC> | null | undefined {
        if (this._activeDragType === undefined) {
            return super.handlePointerDragEnd(event, cell);
        } else {
            this.cancelStepScroll();
            this.setActiveDragType(undefined);
            return cell;
        }
    }

    override handleKeyDown(eventDetail: EventDetail.Keyboard) {
        const navKey = eventDetail.revgrid_navigateKey;
        if (navKey !== undefined) {
            if (GridSettings.isExtendLastSelectionAreaModifierKeyDownInEvent(this.gridSettings, eventDetail)) {
                if (this.focusSelectBehavior.extendLastSelectionAreaAsCloseAsPossibleToFocus()) {
                    this.pingAutoScroll();
                }
            } else {
                const areaType = this.selection.calculateAreaTypeFromSpecifier(SelectionAreaTypeSpecifier.Primary);
                this.focusSelectBehavior.selectOnlyFocusedCell(areaType);
            }
        }
        super.handleKeyDown(eventDetail);
    }

    private trySelectFromMouseDownInScrollableMain(event: MouseEvent, cell: ViewCell<BCS, SC>) {
        // const areaTypeSpecifier = GridSettings.getSelectionAreaTypeSpecifierFromEvent(this.gridSettings, event);
        const areaType = this.selection.calculateAreaTypeFromSpecifier(SelectionAreaTypeSpecifier.Primary);

        if (!GridSettings.isMouseSelectionAllowed(this.gridSettings, areaType)) {
            return false;
        } else {
            const subgrid = cell.subgrid as Subgrid<BCS, SC>;
            const activeColumnIndex = cell.viewLayoutColumn.activeColumnIndex;
            const subgridRowIndex = cell.viewLayoutRow.subgridRowIndex;
            const selection = this.selection;
            const addToggleModifier = GridSettings.isAddToggleSelectionAreaModifierKeyDownInEvent(this.gridSettings, event);
            const extendModifier = GridSettings.isExtendLastSelectionAreaModifierKeyDownInEvent(this.gridSettings, event);
            const lastArea = this.selection.lastArea;

            if (extendModifier && !addToggleModifier) {
                if (lastArea !== undefined && lastArea.areaType === SelectionAreaType.Rectangle) {
                    const origin = lastArea.inclusiveFirst;
                    const startLengthX = StartLength.createExclusiveFromFirstLast(origin.x, activeColumnIndex);
                    const startLengthY = StartLength.createExclusiveFromFirstLast(origin.y, subgridRowIndex);
                    selection.replaceLastArea(
                        startLengthX.start,
                        startLengthY.start,
                        startLengthX.length,
                        startLengthY.length,
                        subgrid,
                        areaType
                    );
                } else {
                    selection.selectCell(activeColumnIndex, subgridRowIndex, subgrid, areaType);
                }
            } else {
                if (addToggleModifier && !extendModifier) {
                    if (this.gridSettings.addToggleSelectionAreaModifierKeyDoesToggle) {
                        selection.selectToggleCell(activeColumnIndex, subgridRowIndex, subgrid, areaType);
                    } else {
                        selection.selectCell(activeColumnIndex, subgridRowIndex, subgrid, areaType);
                    }
                } else {
                    this.selectOnlyCell(activeColumnIndex, subgridRowIndex, subgrid, areaType);
                }
            }

            return true;
        }
    }

    private trySelectFromMouseDownInHeaderOrFixedRow(event: MouseEvent, cell: ViewCell<BCS, SC>) {
        if (!this.gridSettings.mouseColumnSelection) {
            return false;
        } else {
            const activeColumnIndex = cell.viewLayoutColumn.activeColumnIndex;
            const focusPoint = this.focus.currentSubgridPoint;
            const subgridRowIndex = focusPoint === undefined ? 0 : focusPoint.y;
            const subgrid = this.focus.subgrid;
            const addToggleModifier = GridSettings.isAddToggleSelectionAreaModifierKeyDownInEvent(this.gridSettings, event);
            const extendModifier = GridSettings.isExtendLastSelectionAreaModifierKeyDownInEvent(this.gridSettings, event);
            const lastArea = this.selection.lastArea;

            const focusSelectionBehavior = this.focusSelectBehavior;
            if (extendModifier && !addToggleModifier) {
                if (lastArea !== undefined && lastArea.areaType === SelectionAreaType.Column) {
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
                    focusSelectionBehavior.selectAddColumn(activeColumnIndex);
                }
            } else {
                if (addToggleModifier && !extendModifier) {
                    if (this.gridSettings.addToggleSelectionAreaModifierKeyDoesToggle) {
                        focusSelectionBehavior.selectToggleColumn(activeColumnIndex);
                    } else {
                        focusSelectionBehavior.selectAddColumn(activeColumnIndex);
                    }
                } else {
                    focusSelectionBehavior.selectOnlyColumn(activeColumnIndex);
                }
            }

            return true;
        }
    }

    private trySelectFromMouseDownInFixedColumn(event: MouseEvent, cell: ViewCell<BCS, SC>) {
        if (!this.gridSettings.mouseRowSelection) {
            return false;
        } else {
            const subgridRowIndex = cell.viewLayoutRow.subgridRowIndex;
            const subgrid = this.focus.subgrid;
            const focusPoint = this.focus.currentSubgridPoint;
            const cellActiveColumnIndex = focusPoint === undefined ? 0 : focusPoint.x;
            const addToggleModifier = GridSettings.isAddToggleSelectionAreaModifierKeyDownInEvent(this.gridSettings, event);
            const extendModifier = GridSettings.isExtendLastSelectionAreaModifierKeyDownInEvent(this.gridSettings, event);
            const lastArea = this.selection.lastArea;

            const focusSelectionBehavior = this.focusSelectBehavior;
            if (extendModifier && !addToggleModifier) {
                if (lastArea !== undefined && lastArea.areaType === SelectionAreaType.Row) {
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
                    focusSelectionBehavior.selectAddRow(subgridRowIndex, subgrid);
                }
            } else {
                if (addToggleModifier && !extendModifier) {
                    if (this.gridSettings.addToggleSelectionAreaModifierKeyDoesToggle) {
                        focusSelectionBehavior.selectToggleRow(subgridRowIndex, subgrid);
                    } else {
                        focusSelectionBehavior.selectAddRow(subgridRowIndex, subgrid);
                    }
                } else {
                    focusSelectionBehavior.selectOnlyRow(subgridRowIndex, subgrid);
                }
            }

            return true;
        }
    }

    /**
     * @desc Handle a mousedrag selection.
     * @param keys - array of the keys that are currently pressed down
     */
    private tryUpdateLastSelectionArea(cell: ViewCell<BCS, SC>) {
        const selection = this.selection;
        const lastArea = selection.lastArea;
        if (lastArea === undefined) {
            throw new AssertError('SUBULSA54455');
        } else {
            const subgrid = cell.subgrid as Subgrid<BCS, SC>;
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
                    if (lastArea.areaType === SelectionAreaType.Column || subgrid === selection.subgrid) {
                        const origin = lastArea.inclusiveFirst;
                        const xExclusiveStartLength = StartLength.createExclusiveFromFirstLast(origin.x, cell.viewLayoutColumn.activeColumnIndex);
                        const yExclusiveStartLength = StartLength.createExclusiveFromFirstLast(origin.y, cell.viewLayoutRow.subgridRowIndex);
                        selection.replaceLastArea(
                            xExclusiveStartLength.start,
                            yExclusiveStartLength.start,
                            xExclusiveStartLength.length,
                            yExclusiveStartLength.length,
                            subgrid,
                            lastArea.areaType,
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
     * @desc this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
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

    private scheduleStepScrollDragTick(canvasOffsetX: number, canvasOffsetY: number) {
        this._stepScrollDragTickTimeoutHandle = setTimeout(
            () => {
                this._stepScrollDragTickTimeoutHandle = undefined;
                this.checkStepScrollDrag(canvasOffsetX, canvasOffsetY)
            },
            SelectionUiBehavior.scheduleStepScrollDragTickInterval
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
            stepped = this.focusScrollBehavior.stepScrollColumn(directionCanvasOffsetX);
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
            stepped = this.focusScrollBehavior.stepScrollRow(directionCanvasOffsetY);
        } else {
            stepped = true; // dummy step
        }
        return stepped;
    }

    private selectOnlyCell(originX: number, originY: number, subgrid: Subgrid<BCS, SC>, areaType: SelectionAreaType) {
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

        this.selection.selectOnlyCell(originX, originY, subgrid, areaType);
    }

    private getDragTypeFromSelectionLastArea() {
        const lastArea = this.selection.lastArea;
        if (lastArea === undefined) {
            return undefined;
        } else {
            switch (lastArea.areaType) {
                case SelectionAreaType.Rectangle: return EventDetail.DragTypeEnum.LastRectangleSelectionAreaExtending;
                case SelectionAreaType.Column: return EventDetail.DragTypeEnum.LastColumnSelectionAreaExtending;
                case SelectionAreaType.Row: return EventDetail.DragTypeEnum.LastRowSelectionAreaExtending;
                default:
                    throw new UnreachableCaseError('SUBGDTFSLA59598', lastArea.areaType);
            }
        }
    }

    private setActiveDragType(dragType: EventDetail.DragTypeEnum | undefined) {
        this._activeDragType = dragType;
        this.mouse.setActiveDragType(dragType);
        if (dragType === undefined) {
            this.mouse.setOperation(undefined, undefined);
        } else {
            this.mouse.setOperation(this.gridSettings.selectionExtendDragActiveCursorName, this.gridSettings.selectionExtendDragActiveTitleText);
        }
    }

    // private dragTypesArrayContainsExtendLastSelectionAreaDragType(types: readonly EventDetail.DragTypeEnum[]) {
    //     for (const type of types) {
    //         if (this.dragTypeIsExtendLastSelectionArea(type)) {
    //             return true;
    //         }
    //     }
    //     return false;
    // }

    // private dragTypeIsExtendLastSelectionArea(type: EventDetail.DragTypeEnum) {
    //     return (
    //         type === EventDetail.DragTypeEnum.ExtendLastRectangleSelectionArea ||
    //         type === EventDetail.DragTypeEnum.ExtendLastColumnSelectionArea ||
    //         type === EventDetail.DragTypeEnum.ExtendLastRowSelectionArea
    //     );
    // }
}

/** @internal */
export namespace SelectionUiBehavior {
    export const typeName = 'selection';

    export const scheduleStepScrollDragTickInterval = 20;

    export interface ExtendSelectOrigin<BCS extends BehavioredColumnSettings, SC extends SchemaServer.Column<BCS>> {
        readonly areaType: SelectionAreaType,
        readonly subgrid: Subgrid<BCS, SC>;
        readonly point: Point;
    }

    export const enum MouseDownAction {
        Only,
        Extend,
        AddDelete,
    }
}
