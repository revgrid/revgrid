import { ViewCell } from '../../components/cell/view-cell';
import { EventDetail } from '../../components/event/event-detail';
import { SubgridInterface } from '../../interfaces/subgrid-interface';
import { isSecondaryMouseButton } from '../../lib/html-types';
import { Point } from '../../lib/point';
import { AssertError } from '../../lib/revgrid-error';
import { SelectionArea } from '../../lib/selection-area';
import { StartLength } from '../../lib/start-length';
import { UiBehavior } from './ui-behavior';

export class RowSelectionUiBehavior extends UiBehavior {

    readonly typeName = RowSelectionUiBehavior.typeName;

    private _extendSelectOrigin: RowSelectionUiBehavior.ExtendSelectOrigin | undefined;

    /**
     * a millisecond value representing the previous time an autoscroll started
     */
    private _sbLastAuto = 0;

    /**
     * a millisecond value representing the time the current autoscroll started
     */
    private _sbAutoStart = 0;

    private _dragArmed = false;
    private _dragging = false;

    private _stepScrollDragTimeoutHandle: ReturnType<typeof setTimeout> | undefined;

    /**
     * @param event - the event details
     */
    override handleMouseUp(event: MouseEvent, cell: ViewCell | null | undefined) {
        if (this._dragArmed) {
            this._dragArmed = false;
            // this.moveCellSelection();
            this.cancelScheduledStepScrollDrag();
            this.eventBehavior.processSelectionChangedEvent();
            return cell;
        } else {
            if (this._dragging) {
                this._dragging = false;
                // this.moveCellSelection();
                this.eventBehavior.processSelectionChangedEvent();
                return cell;
            } else {
                return super.handleMouseUp(event, cell);
            }
        }
    }

    /**
     * @param event - the event details
     */
    override handleMouseDown(event: MouseEvent, cell: ViewCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetViewCellFromMouseEvent(event);
        }

        if (cell === null) {
            return super.handleMouseDown(event, cell);
        } else {
            const leftClick = !isSecondaryMouseButton(event);

            const subgrid = cell.subgrid;
            const rowSelectable =
                subgrid.selectable &&
                this.gridSettings.mouseRowSelection &&
                this.gridSettings.autoSelectRows &&
                leftClick;

            if (!rowSelectable || !cell.isRowFixed) {
                return super.handleMouseDown(event, cell);
            } else {
                if (cell.isHeaderRow) {
                    //global row selection
                    this.selectionBehavior.selectAllRows();
                    return cell;
                } else {
                    if (!subgrid.isMain) {
                        return super.handleMouseDown(event, cell);
                    } else {
                        // if we are in the fixed area, do not apply the scroll values
                        this._dragArmed = true;
                        const subgridRowIndex = cell.visibleRow.subgridRowIndex;
                        const focusPoint = this.focus.currentSubgridPoint;
                        const cellActiveColumnIndex = focusPoint === undefined ? 0 : focusPoint.x;

                        const focusSelectionBehavior = this.selectionBehavior;
                        const extendSelectOrigin = this._extendSelectOrigin;
                        if (event.shiftKey && extendSelectOrigin !== undefined) {
                            const originX = extendSelectOrigin.point.x;
                            const originY = extendSelectOrigin.point.y;
                            const width = cellActiveColumnIndex - originX;
                            const height = subgridRowIndex - originY;
                            focusSelectionBehavior.replaceLastAreaWithRows(originX, originY, width, height, extendSelectOrigin.subgrid);
                        } else {
                            focusSelectionBehavior.selectOnlyRow(subgridRowIndex, subgrid);
                            this._extendSelectOrigin = {
                                subgrid,
                                point: {
                                    x: cellActiveColumnIndex,
                                    y: subgridRowIndex,
                                }
                            };
                        }
                        return cell;
                    }
                }
            }
        }
    }

    override handleMouseDrag(event: MouseEvent, cell: ViewCell | null | undefined) {
        if (
            !this._dragArmed ||
            !this.gridSettings.mouseRowSelection ||
            isSecondaryMouseButton(event)
        ) {
            return super.handleMouseDrag(event, cell);
        } else {
            //if we are in the fixed area do not apply the scroll values
            this.cancelScheduledStepScrollDrag();
            this._dragging = true;
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
            if (lastSelectionType === SelectionArea.Type.Row) {
                const handler = this[('handle' + eventDetail.key) as keyof RowSelectionUiBehavior] as ((this: void, detail: EventDetail.Keyboard) => void);
                if (handler !== undefined) {
                    handler(eventDetail);
                } else {
                    super.handleKeyDown(eventDetail);
                }
            } else {
                super.handleKeyDown(eventDetail);
            }
        }
    }

    /**
     * @desc Handle a mousedrag selection
     */
    updateLastSelectionArea(cell: ViewCell) {
        const extendSelectOrigin = this._extendSelectOrigin;
        if (extendSelectOrigin === undefined) {
            throw new AssertError('RSFHMDCS54455');
        } else {
            const subgrid = cell.subgrid;
            if (subgrid === extendSelectOrigin.subgrid) {
                const lastCellX = cell.visibleColumn.activeColumnIndex;
                const lastCellY = cell.visibleRow.subgridRowIndex;

                const xExclusiveStartLength = StartLength.createExclusiveFromFirstLast(lastCellX, extendSelectOrigin.point.x);
                const yExclusiveStartLength = StartLength.createExclusiveFromFirstLast(lastCellY, extendSelectOrigin.point.y);
                const focusSelectionBehavior = this.selectionBehavior;
                focusSelectionBehavior.replaceLastAreaWithRows(
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
        if (
            this.gridSettings.scrollingEnabled &&
            scrollableBounds !== undefined &&
            scrollableBounds.containsXY(canvasOffsetX, canvasOffsetY)
        ) {
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

    private handleDOWN() {
        this._extendSelectOrigin = undefined;
        // this.moveSingleSelect(0, 1);
    }

    private handleUP() {
        this._extendSelectOrigin = undefined;
        // this.moveSingleSelect(0, -1);
    }

    private handleLEFT() {
        this._extendSelectOrigin = undefined;
        // this.moveSingleSelect(0, 0);
    }

    private handleRIGHT() {
        this._extendSelectOrigin = undefined;
        // const mouseDown = this.userInterfaceInputBehavior.getMouseDown();
        // const extent = this.userInterfaceInputBehavior.getDragExtent();
        // if (mouseDown === undefined || extent === undefined) {
        //     throw new AssertError('RSHR60334');
        // } else {
        //     const mouseCorner = Point.plus(mouseDown, extent);
        //     const maxColumns = this.columnsManager.activeColumnCount - 1;
        //     let newX = this.viewport.firstScrollableActiveColumnIndex;
        //     const newY = mouseCorner.y;

        //     newX = Math.min(maxColumns, newX);

        //     const selectionBehavior = this.focusSelectionBehavior;
        //     selectionBehavior.beginChange();
        //     try {
        //         selectionBehavior.clearSelection(true);
        //         selectionBehavior.selectOnlyRectangle(newX, newY, 0, 0, undefined);
        //     } finally {
        //         selectionBehavior.endChange();
        //     }
        //     const userInterfaceInputBehavior = this.userInterfaceInputBehavior;
        //     userInterfaceInputBehavior.setMouseDown(Point.create(newX, newY));
        //     userInterfaceInputBehavior.setDragExtent(Point.create(0, 0));

        //     this.renderer.repaint();
        // }
    }

    /**
     * @desc If we are holding down the same navigation key, accelerate the increment we scroll
     */
    private getAutoScrollAcceleration() {
        let count = 1;
        const elapsed = this.getAutoScrollDuration() / 2000;
        count = Math.max(1, Math.floor(elapsed * elapsed * elapsed * elapsed));
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
     * @param offsetY - y coordinate to start at
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
                focusSelectionBehavior.replaceLastAreaWithRows(activeColumnIndex, subgridRowIndex, newX, newY, this.focus.subgrid);

                if (this.viewLayout.ensureRowIsInView(newX, true)) {
                    this.pingAutoScroll();
                }

                this.renderer.invalidateView();
            }
        }
    }

    /**
     * @desc Replace the most recent row selection with a single cell row selection `offsetY` rows from the previous selection.
     * @param offsetY - y coordinate to start at
     */
    // override moveSingleSelect(offsetX: number, offsetY: number, shift?: boolean) {
    //     const grid = this.grid;
    //     const selectionBehavior = this.focusSelectionBehavior;
    //     const selection = this.selection;
    //     const ranges = selection.rows.ranges;
    //     let lastRange = ranges[ranges.length - 1];
    //     let top = lastRange[0];
    //     let bottom = lastRange[1];

    //     let firstOffsetY: number | undefined;
    //     if (shift) {
    //         firstOffsetY = lastRange.offsetY = lastRange.offsetY || offsetY;
    //         if (lastRange.offsetY < 0) {
    //             top += offsetY;
    //         } else {
    //             bottom += offsetY;
    //         }
    //     } else {
    //         top += offsetY;
    //         bottom += offsetY;
    //     }

    //     if (top >= 0 && bottom < selection.focusedSubgrid.getRowCount()) {
    //         ranges.length -= 1;
    //         if (ranges.length) {
    //             lastRange = ranges[ranges.length - 1];
    //             delete lastRange.offsetY;
    //         }
    //         selectionBehavior.focusSelectRows(top, bottom, undefined, undefined);
    //         if (shift && top !== bottom) {
    //             lastRange = ranges[ranges.length - 1];
    //             lastRange.offsetY = firstOffsetY;
    //         }

    //         const userInterfaceInputBehavior = this.userInterfaceInputBehavior;
    //         userInterfaceInputBehavior.setMouseDown(Point.create(0, top));
    //         userInterfaceInputBehavior.setDragExtent(Point.create(0, bottom - top));

    //         this.scrollBehavior.scrollToMakeVisible(grid.properties.fixedColumnCount, offsetY < 0 ? top : bottom + 1, undefined); // +1 for partial row

    //         // this.moveCellSelection();
    //         this.eventBehavior.processSelectionChangedEvent();
    //         this.rendererBehavior.repaint();
    //     }
    // }

    private isSingleRowSelection() {
        return true;
    }

    // private moveCellSelection() {
    //     let rowIndices: number[];

    //     const grid = this.grid;
    //     if (
    //         grid.properties.collapseCellSelections &&
    //         grid.properties.singleRowSelectionMode && // let's only attempt this when in this mode
    //         !grid.properties.multipleSelections && // and only when in single selection mode
    //         (rowIndices = grid.getSelectedRowIndices()).length // user just selected a row (must be single row due to mode we're in)
    //     ) {
    //         const rect = grid.selection.getLastRectangle(); // the only cell selection
    //         if (rect !== undefined) {
    //             const x = rect.left;
    //             const y = rowIndices[0]; // we know there's only 1 row selected
    //             const width = rect.right - x;
    //             const height = 0; // collapse the new region to occupy a single row
    //             const fireSelectionChangedEvent = false;

    //             grid.selection.selectRectangle(x, y, width, height, undefined, fireSelectionChangedEvent);
    //             this.rendererBehavior.repaint();
    //         }
    //     }
    // }


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
}

export namespace RowSelectionUiBehavior {
    export const typeName = 'rowselection';

    export interface ExtendSelectOrigin {
        readonly subgrid: SubgridInterface;
        readonly point: Point;
    }
}