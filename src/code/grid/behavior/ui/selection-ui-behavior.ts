
import { EventDetail } from '../../components/event/event-detail';
import { HoverCell } from '../../interfaces/data/hover-cell';
import { Subgrid } from '../../interfaces/data/subgrid';
import { ViewCell } from '../../interfaces/data/view-cell';
import { GridSettings } from '../../interfaces/settings/grid-settings';
import { isSecondaryMouseButton } from '../../types-utils/html-types';
import { Point } from '../../types-utils/point';
import { AssertError, UnreachableCaseError } from '../../types-utils/revgrid-error';
import { StartLength } from '../../types-utils/start-length';
import { SelectionAreaType, SelectionAreaTypeSpecifier } from '../../types-utils/types';
import { UiBehavior } from './ui-behavior';

/** @internal */
export class SelectionUiBehavior extends UiBehavior {

    readonly typeName = SelectionUiBehavior.typeName;

    /**
     * a millisecond value representing the previous time an autoscroll started
     */
    private _sbLastAuto = 0;

    /**
     * a millisecond value representing the time the current autoscroll started
     */
    private _sbAutoStart = 0;
    private _stepScrollDragTimeoutHandle: ReturnType<typeof setTimeout> | undefined;

    override handlePointerDown(event: PointerEvent, cell: HoverCell | null | undefined) {
        if (isSecondaryMouseButton(event)) {
            return super.handlePointerDown(event, cell);
        } else {
            if (cell === undefined) {
                cell = this.tryGetHoverCellFromMouseEvent(event);
            }
            if (cell === null || cell.isMouseOverLine()) {
                return super.handlePointerDown(event, cell);
            } else {
                const subgrid = cell.subgrid;
                const isSelectable = subgrid.selectable; // && this.cellPropertiesBehavior.getCellProperty(cell.viewLayout.column, cell.viewLayoutRow.subgridRowIndex, 'cellSelection', subgrid);

                if (!isSelectable) {
                    return super.handlePointerDown(event, cell);
                } else {
                    let selectSucceeded: boolean;
                    if (!cell.isScrollable) {
                        return super.handlePointerDown(event, cell);
                    } else {
                        selectSucceeded = this.trySelectFromMouseDownInScrollableMain(event, cell);
                        if (!selectSucceeded) {
                            return super.handlePointerDown(event, cell);
                        } else {
                            return cell;
                        }
                    }
                }
            }
        }
    }

    override handleClick(event: MouseEvent, cell: HoverCell | null | undefined): HoverCell | null | undefined {
        if (!event.altKey || isSecondaryMouseButton(event)) {
            return super.handleClick(event, cell);
        } else {
            if (cell === undefined) {
                cell = this.tryGetHoverCellFromMouseEvent(event);
            }
            if (cell === null || cell.isMouseOverLine()) {
                return super.handleClick(event, cell);
            } else {
                let selectSucceeded: boolean;
                if (cell.isColumnFixed) {
                    if (!cell.subgrid.selectable) {
                        selectSucceeded = false;
                    } else {
                        selectSucceeded = this.trySelectFromMouseDownInFixedColumn(event, cell);
                    }
                } else {
                    if (!cell.isHeaderOrRowFixed || !this.mainSubgrid.selectable) {
                        selectSucceeded = false;
                    } else {
                        selectSucceeded = this.trySelectFromMouseDownInHeaderOrFixedRow(event, cell);
                    }
                }

                if (!selectSucceeded) {
                    return super.handleClick(event, cell);
                } else {
                    return cell;
                }
            }
        }
    }

    override handlePointerDragStart(event: DragEvent, cell: HoverCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (cell === null || cell.isMouseOverLine()) {
            return super.handlePointerDragStart(event, cell);
        } else {
            const subgrid = cell.subgrid;
            const isSelectable = subgrid.selectable; // && this.cellPropertiesBehavior.getCellProperty(cell.viewLayout.column, cell.viewLayoutRow.subgridRowIndex, 'cellSelection', subgrid);

            if (!isSelectable) {
                return super.handlePointerDragStart(event, cell);
            } else {
                let selectSucceeded: boolean;
                if (cell.isHeaderOrRowFixed) {
                    selectSucceeded = this.trySelectFromMouseDownInHeaderOrFixedRow(event, cell);
                } else {
                    if (cell.isColumnFixed) {
                        selectSucceeded = this.trySelectFromMouseDownInFixedColumn(event, cell);
                    } else {
                        if (cell.isMain) {
                            selectSucceeded = this.trySelectFromMouseDownInScrollableMain(event, cell)
                        } else {
                            selectSucceeded = false;
                        }
                    }
                }

                if (!selectSucceeded) {
                    return super.handlePointerDragStart(event, cell);
                } else {
                    const dragType = this.getDragTypeFromSelectionLastArea();
                    if (dragType === undefined) {
                        return super.handlePointerDragStart(event, cell);
                    } else {
                        this.mouse.setActiveDragType(dragType);
                        this.mouse.setOperationCursor(this.gridSettings.selectionExtendDragActiveCursorName);
                        return {
                            started: true,
                            cell,
                        };
                    }
                }
            }
        }
    }

    override handlePointerDrag(event: PointerEvent, cell: HoverCell | null | undefined) {
        const activeDragType = this.mouse.activeDragType;
        if (activeDragType === undefined || !this.dragTypeIsExtendLastSelectionArea(activeDragType)) {
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
                    this.tryUpdateLastSelectionArea(cell);
                }
                return cell;
            }
        }
    }

    override handlePointerDragEnd(event: PointerEvent, cell: HoverCell | null | undefined): HoverCell | null | undefined {
        const activeDragType = this.mouse.activeDragType;
        if (activeDragType === undefined || !this.dragTypeIsExtendLastSelectionArea(activeDragType)) {
            return super.handlePointerDragEnd(event, cell);
        } else {
            this.cancelScheduledStepScrollDrag();
            this.mouse.setActiveDragType(undefined);
            this.mouse.setOperationCursor(undefined);
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

    private trySelectFromMouseDownInScrollableMain(event: MouseEvent, cell: ViewCell) {
        const areaTypeSpecifier = GridSettings.getSelectionAreaTypeSpecifierFromEvent(this.gridSettings, event);
        const areaType = this.selection.calculateAreaTypeFromSpecifier(areaTypeSpecifier);

        if (!GridSettings.isMouseSelectionAllowed(this.gridSettings, areaType)) {
            return false;
        } else {
            const subgrid = cell.subgrid as Subgrid;
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

    private trySelectFromMouseDownInHeaderOrFixedRow(event: MouseEvent, cell: ViewCell) {
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

    private trySelectFromMouseDownInFixedColumn(event: MouseEvent, cell: ViewCell) {
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
    private tryUpdateLastSelectionArea(cell: ViewCell) {
        const selection = this.selection;
        const lastArea = selection.lastArea;
        if (lastArea === undefined) {
            throw new AssertError('SUBULSA54455');
        } else {
            const subgrid = cell.subgrid as Subgrid;
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

    /**
     * @desc this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
     */
    private checkStepScrollDrag(canvasOffsetX: number, canvasOffsetY: number) {
        const scrollableBounds = this.viewLayout.scrollableCanvasBounds;
        if (scrollableBounds === undefined || scrollableBounds.containsXY(canvasOffsetX, canvasOffsetY) || !this.gridSettings.scrollingEnabled) {
            this.cancelScheduledStepScrollDrag();
            return false;
        } else {
            const stepScrolled = this.focusScrollBehavior.stepScroll(canvasOffsetX, canvasOffsetY);
            if (!stepScrolled) {
                return false;
            } else {
                this.scheduleStepScrollDrag(canvasOffsetX, canvasOffsetY);

                const cell = this.viewLayout.findScrollableCellClosestToCanvasOffset(canvasOffsetX, canvasOffsetY);
                if (cell !== undefined) {
                    this.tryUpdateLastSelectionArea(cell); // update the selection
                }
                return true;
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

    private scheduleStepScrollDrag(canvasOffsetX: number, canvasOffsetY: number) {
        this._stepScrollDragTimeoutHandle = setTimeout(() => this.checkStepScrollDrag(canvasOffsetX, canvasOffsetY), 25);
    }

    private cancelScheduledStepScrollDrag() {
        if (this._stepScrollDragTimeoutHandle !== undefined) {
            clearTimeout(this._stepScrollDragTimeoutHandle);
            this._stepScrollDragTimeoutHandle = undefined;
        }
    }

    private selectOnlyCell(originX: number, originY: number, subgrid: Subgrid, areaType: SelectionAreaType) {
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
                case SelectionAreaType.Rectangle: return EventDetail.DragTypeEnum.ExtendLastRectangleSelectionArea;
                case SelectionAreaType.Column: return EventDetail.DragTypeEnum.ExtendLastColumnSelectionArea;
                case SelectionAreaType.Row: return EventDetail.DragTypeEnum.ExtendLastRowSelectionArea;
                default:
                    throw new UnreachableCaseError('SUBGDTFSLA59598', lastArea.areaType);
            }
        }
    }

    private dragTypesArrayContainsExtendLastSelectionAreaDragType(types: readonly EventDetail.DragTypeEnum[]) {
        for (const type of types) {
            if (this.dragTypeIsExtendLastSelectionArea(type)) {
                return true;
            }
        }
        return false;
    }

    private dragTypeIsExtendLastSelectionArea(type: EventDetail.DragTypeEnum) {
        return (
            type === EventDetail.DragTypeEnum.ExtendLastRectangleSelectionArea ||
            type === EventDetail.DragTypeEnum.ExtendLastColumnSelectionArea ||
            type === EventDetail.DragTypeEnum.ExtendLastRowSelectionArea
        );
    }
}

/** @internal */
export namespace SelectionUiBehavior {
    export const typeName = 'selection';

    export interface ExtendSelectOrigin {
        readonly areaType: SelectionAreaType,
        readonly subgrid: Subgrid;
        readonly point: Point;
    }

    export const enum MouseDownAction {
        Only,
        Extend,
        AddDelete,
    }
}
