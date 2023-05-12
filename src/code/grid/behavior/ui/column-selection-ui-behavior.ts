import { ViewCell } from '../../components/cell/view-cell';
import { EventDetail } from '../../components/event/event-detail';
import { SubgridInterface } from '../../interfaces/subgrid-interface';
import { isSecondaryMouseButton } from '../../lib/html-types';
import { Point } from '../../lib/point';
import { AssertError } from '../../lib/revgrid-error';
import { SelectionArea } from '../../lib/selection-area';
import { StartLength } from '../../lib/start-length';
import { UiBehavior } from './ui-behavior';

export class ColumnSelectionUiBehavior extends UiBehavior {

    readonly typeName = ColumnSelectionUiBehavior.typeName;

    private _extendSelectOrigin: ColumnSelectionUiBehavior.ExtendSelectOrigin | undefined;

    /**
     * a millisecond value representing the previous time an autoscroll started
     */
    private _sbLastAuto = 0;

    /**
     * a millisecond value representing the time the current autoscroll started
     */
    private _sbAutoStart = 0;

    private _dragArmed = false;
    private _doubleClickTimer: ReturnType<typeof setTimeout> | undefined;
    private _stepScrollDragTimeoutHandle: ReturnType<typeof setTimeout> | undefined;


    override handleMouseUp(event: MouseEvent, cell: ViewCell | null | undefined) {
        if (this._dragArmed) {
            this._dragArmed = false;
            this.cancelScheduledStepScrollDrag();
        }
        return super.handleMouseUp(event, cell);
    }

    override handleDoubleClick(event: MouseEvent, cell: ViewCell | null | undefined) {
        if (this._doubleClickTimer !== undefined) {
            clearTimeout(this._doubleClickTimer); // prevent mouseDown from continuing
            this._doubleClickTimer = undefined;
        }
        return super.handleDoubleClick(event, cell);
    }

    override handleMouseDown(event: MouseEvent, cell: ViewCell | null | undefined) {
        if (this._doubleClickTimer !== undefined) {
            return cell;
        } else {
            // todo: >= 5 depends on header being top-most row which is currently always true but we may allow header "section" to be arbitrary position within quadrant (see also handleMouseDown in ColumnMoving.js)
            if (cell === undefined) {
                cell = this.tryGetViewCellFromMouseEvent(event);
            }

            if (cell === null) {
                return super.handleMouseDown(event, cell);
            } else {
                if (
                    this.gridSettings.mouseColumnSelection &&
                    !isSecondaryMouseButton(event) &&
                    (
                        this.gridSettings.autoSelectColumns ||
                        cell.isHeaderCell
                    )
                ) {
                    // HOLD OFF WHILE WAITING FOR DOUBLE-CLICK
                    const definedCell = cell;
                    this._doubleClickTimer = setTimeout(
                        () => this.doubleClickTimerCallback(event, definedCell),
                        this.doubleClickDelay(cell)
                    );
                    return cell;
                } else {
                    return super.handleMouseDown(event, cell);
                }
            }
        }
    }

    override handleMouseDrag(event: MouseEvent, cell: ViewCell | null | undefined) {
        if (
            !this._dragArmed ||
            this.isColumnDragging() ||
            !this.gridSettings.mouseColumnSelection ||
            isSecondaryMouseButton(event)
        ) {
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

    override handleKeyDown(eventDetail: EventDetail.Keyboard) {
        const lastSelectionArea = this.selection.lastArea;
        if (lastSelectionArea !== undefined) {
            const lastSelectionType = lastSelectionArea.areaType;
            if (lastSelectionType !== SelectionArea.Type.Column) {
                super.handleKeyDown(eventDetail);
            } else {
                const handler = this[('handle' + eventDetail.key) as keyof ColumnSelectionUiBehavior] as (() => void);
                if (handler === undefined) {
                    super.handleKeyDown(eventDetail);
                } else {
                    handler.call(this);
                }
            }
        }
    }

    /**
     * @desc Handle a mousedrag selection
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
                this.selectionBehavior.replaceLastAreaWithColumns(
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
            const stepScrolled = this.scrollBehavior.stepScrollColumn(canvasOffsetX);
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

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private handleDOWNSHIFT() {
        this._extendSelectOrigin = undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private handleUPSHIFT() {
        this._extendSelectOrigin = undefined;
    }

    private handleLEFTSHIFT() {
        this.moveShiftSelect();
    }

    private handleRIGHTSHIFT() {
        this.moveShiftSelect();
    }

    private handleDOWN() {
        this._extendSelectOrigin = undefined;
        // var mouseCorner = grid.getMouseDown().plus(grid.getDragExtent());
        // var maxRows = grid.getRowCount() - 1;

        // var newX = mouseCorner.x;
        // var newY = grid.getHeaderRowCount() + grid.getVScrollValue();

        // newY = Math.min(maxRows, newY);

        // grid.clearSelections();
        // grid.select(newX, newY, 0, 0);
        // grid.setMouseDown(new grid.rectangular.Point(newX, newY));
        // grid.setDragExtent(new grid.rectangular.Point(0, 0));

        // this.rendererBehavior.repaint();
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private handleUP() {
        this._extendSelectOrigin = undefined;
    }

    private handleLEFT() {
        this._extendSelectOrigin = undefined;
    }

    private handleRIGHT() {
        this._extendSelectOrigin = undefined;
    }

    /**
     * @desc If we are holding down the same navigation key, accelerate the increment we scroll
     */
    private getAutoScrollAcceleration() {
        const elapsed = this.getAutoScrollDuration() / 2000;
        return Math.max(1, Math.floor(elapsed * elapsed * elapsed * elapsed));
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
     */
    private moveShiftSelect() {
        const focusPoint = this.focus.currentSubgridPoint;
        if (focusPoint !== undefined) {
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
                focusSelectionBehavior.replaceLastAreaWithColumns(activeColumnIndex, subgridRowIndex, newX, newY, this.focus.subgrid);

                if (this.scrollBehavior.ensureColumnIsMaximallyVisible(newX)) {
                    this.pingAutoScroll();
                }

                this.renderer.repaint();
            }
        }
    }

    private isColumnDragging() {
        return this.sharedState.columnMovingDragArmed || this.sharedState.columnMovingDragging;
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

    private doubleClickDelay(cell: ViewCell) {
        if (cell.isHeaderCell) {
            const columnProperties = cell.columnProperties;
            if (columnProperties.sortable && columnProperties.sortOnDoubleClick) {
                return 300;
            } else {
                return 0;
            }
        } else {
            return 0;
        }
    }

    private doubleClickTimerCallback(event: MouseEvent, cell: ViewCell) {
        this._doubleClickTimer = undefined;
        this._dragArmed = true;

        const cellActiveColumnIndex = cell.visibleColumn.activeColumnIndex;
        const focusPoint = this.focus.currentSubgridPoint;
        const subgridRowIndex = focusPoint === undefined ? 0 : focusPoint.y;
        const subgrid = this.focus.subgrid;

        const focusSelectionBehavior = this.selectionBehavior;
        const extendSelectOrigin = this._extendSelectOrigin;
        if (event.shiftKey && extendSelectOrigin !== undefined) {
            const originX = extendSelectOrigin.point.x;
            const originY = extendSelectOrigin.point.y;
            const width = cellActiveColumnIndex - originX;
            const height = subgridRowIndex - originY;
            focusSelectionBehavior.replaceLastAreaWithColumns(originX, originY, width, height, subgrid);
        } else {
            focusSelectionBehavior.selectOnlyColumn(cellActiveColumnIndex);
            this._extendSelectOrigin = {
                subgrid,
                point: {
                    x: cellActiveColumnIndex,
                    y: subgridRowIndex,
                }
            };
        }
    }
}

export namespace ColumnSelectionUiBehavior {
    export const typeName = 'columnselection';

    export interface ExtendSelectOrigin {
        readonly subgrid: SubgridInterface;
        readonly point: Point;
    }
}
