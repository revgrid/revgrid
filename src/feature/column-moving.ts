// This feature is responsible for column drag and drop reordering.
// This object is a mess and desperately needs a complete rewrite.....

import { Hypergrid } from '../grid/hypergrid';
import { CellEvent } from '../lib/cell-event';
import { numberToPixels } from '../lib/utils';
import { Feature } from './feature';

/**
 * @typedef {import("../Hypergrid")} Hypergrid
 * @typedef {any} ColumnMovingType TODO
 */

const GRAB = 'grab';
const GRABBING = 'grabbing';

const columnAnimationTime = 150;
let dragger: HTMLCanvasElement;
let draggerCTX: CanvasRenderingContext2D;
let floatColumn: HTMLCanvasElement;
let floatColumnCTX: CanvasRenderingContext2D;

function translate(grid: Hypergrid, x: number, y: number) {
    return 'translate(' + x + 'px, ' + y + 'px)';
}

export class ColumnMoving extends Feature {

    readonly typeName = ColumnMoving.typeName;

    /**
     * queue up the animations that need to play so they are done synchronously
     */
    floaterAnimationQueue = []

    /**
     * am I currently auto scrolling right
     */
    columnDragAutoScrollingRight = false;

    /**
     * am I currently auto scrolling left
     */
    columnDragAutoScrollingLeft = false;

    /**
     * is the drag mechanism currently enabled ("armed")
     */
    dragArmed = false;

    /**
     * am I dragging right now
     */
    dragging = false;

    /**
     * the column index of the currently dragged column
     */
    dragCol = -1;

    /**
     * an offset to position the dragged item from the cursor
     */
    dragOffset = 0;

    isFloatingNow = false;
    floatingNow = false;

    /**
     * @desc give me an opportunity to initialize stuff on the grid
     */
    override initializeOn(grid: Hypergrid) {
        this.isFloatingNow = false;
        this.initializeAnimationSupport(grid);
        if (this.next) {
            this.next.initializeOn(grid);
        }
    }

    /**
     * @desc initialize animation support on the grid
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    initializeAnimationSupport(grid: Hypergrid) {
        if (dragger === undefined) {
            dragger = document.createElement('canvas') as HTMLCanvasElement;
            dragger.setAttribute('width', '0px');
            dragger.setAttribute('height', '0px');
            dragger.style.position = 'fixed';

            document.body.appendChild(dragger);
            draggerCTX = dragger.getContext('2d', { alpha: false });
        }
        if (floatColumn === undefined) {
            floatColumn = document.createElement('canvas') as HTMLCanvasElement;
            floatColumn.setAttribute('width', '0px');
            floatColumn.setAttribute('height', '0px');
            floatColumn.style.position = 'fixed';

            document.body.appendChild(floatColumn);
            floatColumnCTX = floatColumn.getContext('2d', { alpha: false });
        }

    }

    override handleMouseDrag(grid: Hypergrid, event: CellEvent) {

        const gridCell = event.gridCell;

        const distance = Math.abs(event.primitiveEvent.detail.dragstart.x - event.primitiveEvent.detail.mouse.x);

        if (distance < 10 || event.isColumnFixed) {
            if (this.next) {
                this.next.handleMouseDrag(grid, event);
            }
            return;
        }

        if (event.isHeaderCell && this.dragArmed && !this.dragging) {
            this.dragging = true;
            this.dragCol = gridCell.x;
            this.dragOffset = event.mousePoint.x;
            this.detachChain();
            const x = event.primitiveEvent.detail.mouse.x - this.dragOffset;
            //const y = event.primitiveEvent.detail.mouse.y;
            this.createDragColumn(grid, x, this.dragCol);
        } else if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }

        if (this.dragging) {
            const x = event.primitiveEvent.detail.mouse.x - this.dragOffset;
            //const y = event.primitiveEvent.detail.mouse.y;
            this.dragColumn(grid, x);
        }
    }

    override handleMouseDown(grid: Hypergrid, event: CellEvent) {
        if (
            grid.properties.columnsReorderable &&
            !event.primitiveEvent.detail.isRightClick &&
            !event.isColumnFixed &&
            event.isHeaderCell
        ) {
            this.dragArmed = true;
            this.cursor = GRABBING;
            grid.clearSelections();
        } else if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    }

    override handleMouseUp(grid: Hypergrid, event: CellEvent) {
        //var col = event.gridCell.x;
        if (this.dragging) {
            this.cursor = null;
            //delay here to give other events a chance to be dropped
            this.endDragColumn(grid);
            setTimeout(() => {
                this.attachChain();
            }, 200);
        }
        this.dragCol = -1;
        this.dragging = false;
        this.dragArmed = false;
        this.cursor = null;
        grid.repaint();

        if (this.next) {
            this.next.handleMouseUp(grid, event);
        }

    }

    override handleMouseMove(grid: Hypergrid, event: CellEvent | undefined) {
        if (
            event !== undefined &&
            grid.properties.columnsReorderable &&
            !event.isColumnFixed &&
            !this.dragging &&
            event.isHeaderCell &&
            event.mousePoint.y < grid.properties.columnGrabMargin
        ) {
            this.cursor = GRAB;
        } else {
            this.cursor = null;
        }

        super.handleMouseMove(grid, event);

        if (event !== undefined && event.isHeaderCell && this.dragging) {
            this.cursor = GRABBING;
        }
    }

    /**
     * @desc this is the main event handler that manages the dragging of the column
     * @param draggedToTheRight - are we moving to the right
     */
    floatColumnTo(grid: Hypergrid, draggedToTheRight: boolean) {
        this.floatingNow = true;

        const visibleColumns = grid.renderer.visibleColumns;
        const scrollLeft = grid.getHScrollValue();
        const floaterIndex = grid.renderOverridesCache.floater.columnIndex;
        const draggerIndex = grid.renderOverridesCache.dragger.columnIndex;
        const hdpiratio = grid.renderOverridesCache.dragger.hdpiratio;

        let draggerStartX: number;
        let floaterStartX: number;
        const fixedColumnCount = grid.getFixedColumnCount();
        const draggerWidth = grid.getColumnWidth(draggerIndex);
        const floaterWidth = grid.getColumnWidth(floaterIndex);

        const max = grid.getVisibleColumnsCount();

        let doffset = 0;
        let foffset = 0;

        if (draggerIndex >= fixedColumnCount) {
            doffset = scrollLeft;
        }
        if (floaterIndex >= fixedColumnCount) {
            foffset = scrollLeft;
        }

        if (draggedToTheRight) {
            draggerStartX = visibleColumns[Math.min(max, draggerIndex - doffset)].left;
            floaterStartX = visibleColumns[Math.min(max, floaterIndex - foffset)].left;

            grid.renderOverridesCache.dragger.startX = (draggerStartX + floaterWidth) * hdpiratio;
            grid.renderOverridesCache.floater.startX = draggerStartX * hdpiratio;

        } else {
            floaterStartX = visibleColumns[Math.min(max, floaterIndex - foffset)].left;
            draggerStartX = floaterStartX + draggerWidth;

            grid.renderOverridesCache.dragger.startX = floaterStartX * hdpiratio;
            grid.renderOverridesCache.floater.startX = draggerStartX * hdpiratio;
        }
        grid.swapColumns(draggerIndex, floaterIndex);
        grid.renderOverridesCache.dragger.columnIndex = floaterIndex;
        grid.renderOverridesCache.floater.columnIndex = draggerIndex;


        this.floaterAnimationQueue.unshift(this.doColumnMoveAnimation(grid, floaterStartX, draggerStartX));

        this.doFloaterAnimation(grid);

    }

    /**
     * @desc manifest the column drag and drop animation
     * @param floaterStartX - the x start coordinate of the column underneath that floats behind the dragged column
     * @param draggerStartX - the x start coordinate of the dragged column
     */
    doColumnMoveAnimation(grid: Hypergrid, floaterStartX: number, draggerStartX: number) {
        return () => {
            const d = floatColumn;
            d.style.display = 'inline';
            this.setCrossBrowserProperty(d, 'transform', translate(grid, floaterStartX, 0));

            //d.style.webkit-webkit-Transform = 'translate(' + floaterStartX + 'px, ' + 0 + 'px)';
            //d.style.webkit-webkit-Transform = 'translate(' + floaterStartX + 'px, ' + 0 + 'px)';

            requestAnimationFrame(() => {
                this.setCrossBrowserProperty(d, 'transition', (grid.isWebkit ? '-webkit-' : '') + 'transform ' + columnAnimationTime + 'ms ease');
                this.setCrossBrowserProperty(d, 'transform', translate(grid, draggerStartX, -2));
            });
            grid.repaint();
            //need to change this to key frames

            setTimeout(() => {
                this.setCrossBrowserProperty(d, 'transition', '');
                grid.renderOverridesCache.floater = null;
                grid.repaint();
                this.doFloaterAnimation(grid);
                requestAnimationFrame(() => {
                    d.style.display = 'none';
                    this.isFloatingNow = false;
                });
            }, columnAnimationTime + 50);
        };
    }

    /**
     * @desc manifest the floater animation
     */
    doFloaterAnimation(grid: Hypergrid) {
        if (this.floaterAnimationQueue.length === 0) {
            this.floatingNow = false;
            grid.repaint();
            return;
        }
        const animation = this.floaterAnimationQueue.pop();
        animation();
    }

    /**
     * @desc create the float column at columnIndex underneath the dragged column
     * @param columnIndex - the index of the column that will be floating
     */
    createFloatColumn(grid: Hypergrid, columnIndex: number) {

        const fixedColumnCount = grid.getFixedColumnCount();
        let scrollLeft = grid.getHScrollValue();

        if (columnIndex < fixedColumnCount) {
            scrollLeft = 0;
        }

        const columnWidth = grid.getColumnWidth(columnIndex);
        const colHeight = grid.canvas.canvas.clientHeight;
        const d = floatColumn;
        const style = d.style;
        const location = grid.containerHtmlElement.getBoundingClientRect();

        style.top = (location.top - 2) + 'px';
        style.left = location.left + 'px';

        const hdpiRatio = grid.getHiDPI();

        d.setAttribute('width', numberToPixels(Math.round(columnWidth * hdpiRatio)));
        d.setAttribute('height', numberToPixels(Math.round(colHeight * hdpiRatio)));
        style.boxShadow = '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)';

        style.width = numberToPixels(columnWidth); //Math.round(columnWidth / hdpiRatio) + 'px';
        style.height = numberToPixels(colHeight); //Math.round(colHeight / hdpiRatio) + 'px';

        style.borderTop = '1px solid ' + grid.properties.lineColor;
        style.backgroundColor = grid.properties.backgroundColor;

        const foundCol = grid.renderer.visibleColumns[columnIndex - scrollLeft];
        const startX = (foundCol ? foundCol.left : 0) * hdpiRatio;

        floatColumnCTX.scale(hdpiRatio, hdpiRatio);

        grid.renderOverridesCache.floater = {
            columnIndex: columnIndex,
            ctx: floatColumnCTX,
            startX: startX,
            width: columnWidth,
            height: colHeight,
            hdpiratio: hdpiRatio
        };

        style.zIndex = '4';
        this.setCrossBrowserProperty(d, 'transform', translate(grid, startX, -2));
        style.cursor = GRABBING;
        grid.repaint();
    }

    /**
     * @desc utility function for setting cross browser css properties
     * @param element - descripton
     * @param property - the property
     * @param value - the value to assign
     */
    setCrossBrowserProperty(element: HTMLElement, property: string, value: string) {
        const uProperty = property[0].toUpperCase() + property.substr(1);
        this.setProp(element, 'webkit' + uProperty, value);
        this.setProp(element, 'Moz' + uProperty, value);
        this.setProp(element, 'ms' + uProperty, value);
        this.setProp(element, 'O' + uProperty, value);
        this.setProp(element, property, value);
    }

    /**
     * @desc utility function for setting properties on HTMLElements
     * @param element - descripton
     * @param property - the property
     * @param value - the value to assign
     */
    setProp(element: HTMLElement, property: string, value: string) {
        if (property in element.style) {
            element.style[property] = value;
        }
    }

    /**
     * @desc create the dragged column at columnIndex above the floated column
     * @param x - the start position
     * @param columnIndex - the index of the column that will be floating
     */
    createDragColumn(grid: Hypergrid, x: number, columnIndex: number) {

        const fixedColumnCount = grid.getFixedColumnCount();
        let scrollLeft = grid.getHScrollValue();

        if (columnIndex < fixedColumnCount) {
            scrollLeft = 0;
        }

        const hdpiRatio = grid.getHiDPI();
        const columnWidth = grid.getColumnWidth(columnIndex);
        const colHeight = grid.canvas.canvas.clientHeight;
        const d = dragger;
        const location = grid.containerHtmlElement.getBoundingClientRect();
        const style = d.style;

        style.top = location.top + 'px';
        style.left = location.left + 'px';
        style.opacity = '0.85';
        style.boxShadow = '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)';
        //style.zIndex = 100;
        style.borderTop = '1px solid ' + grid.properties.lineColor;
        style.backgroundColor = grid.properties.backgroundColor;

        d.setAttribute('width', numberToPixels(Math.round(columnWidth * hdpiRatio)));
        d.setAttribute('height', numberToPixels(Math.round(colHeight * hdpiRatio)));

        style.width = numberToPixels(columnWidth); //Math.round(columnWidth / hdpiRatio) + 'px';
        style.height = numberToPixels(colHeight); //Math.round(colHeight / hdpiRatio) + 'px';

        const startX = grid.renderer.visibleColumns[columnIndex - scrollLeft].left * hdpiRatio;

        draggerCTX.scale(hdpiRatio, hdpiRatio);

        grid.renderOverridesCache.dragger = {
            columnIndex: columnIndex,
            startIndex: columnIndex,
            ctx: draggerCTX,
            startX: startX,
            width: columnWidth,
            height: colHeight,
            hdpiratio: hdpiRatio
        };

        this.setCrossBrowserProperty(d, 'transform', translate(grid, x, -5));
        style.zIndex = '5';
        style.cursor = GRABBING;
        grid.repaint();
    }

    /**
     * @desc this function is the main dragging logic
     * @param x - the start position
     */
    dragColumn(grid: Hypergrid, x: number) {

        //TODO: this function is overly complex, refactor this in to something more reasonable
        const autoScrollingNow = this.columnDragAutoScrollingRight || this.columnDragAutoScrollingLeft;

        const hdpiRatio = grid.getHiDPI();

        const dragColumnIndex = grid.renderOverridesCache.dragger.columnIndex;

        const minX = 0;
        const maxX = grid.renderer.getFinalVisibleColumnBoundary();
        x = Math.min(x, maxX + 15);
        x = Math.max(minX - 15, x);

        //am I at my lower bound
        const atMin = x < minX; // && dragColumnIndex !== 0;

        //am I at my upper bound
        const atMax = x > maxX;

        const d = dragger;

        this.setCrossBrowserProperty(d, 'transition', (grid.isWebkit ? '-webkit-' : '') + 'transform ' + 0 + 'ms ease, box-shadow ' + columnAnimationTime + 'ms ease');

        this.setCrossBrowserProperty(d, 'transform', translate(grid, x, -10));
        requestAnimationFrame(function() {
            d.style.display = 'inline';
        });

        let overCol = grid.renderer.getColumnFromPixelX(x + (d.width / 2 / hdpiRatio));

        if (atMin) {
            overCol = 0;
        }

        if (atMax) {
            overCol = grid.getColumnCount() - 1;
        }

        let doAFloat = dragColumnIndex > overCol;
        doAFloat = doAFloat || (overCol - dragColumnIndex >= 1);

        if (doAFloat && !autoScrollingNow) {
            const draggedToTheRight = dragColumnIndex < overCol;
            // if (draggedToTheRight) {
            //     overCol -= 1;
            // }
            if (this.isFloatingNow) {
                return;
            }

            this.isFloatingNow = true;
            this.createFloatColumn(grid, overCol);
            this.floatColumnTo(grid, draggedToTheRight);
        } else {

            if (x < minX - 10) {
                this.checkAutoScrollToLeft(grid, x);
            }
            if (x > minX - 10) {
                this.columnDragAutoScrollingLeft = false;
            }
            //lets check for autoscroll to right if were up against it
            if (atMax || x > maxX + 10) {
                this.checkAutoScrollToRight(grid, x);
                return;
            }
            if (x < maxX + 10) {
                this.columnDragAutoScrollingRight = false;
            }
        }
    }

    /**
     * @desc autoscroll to the right if necessary
     * @param x - the start position
     */
    checkAutoScrollToRight(grid: Hypergrid, x: number) {
        if (this.columnDragAutoScrollingRight) {
            return;
        }
        this.columnDragAutoScrollingRight = true;
        this._checkAutoScrollToRight(grid, x);
    }

    _checkAutoScrollToRight(grid: Hypergrid, x: number) {
        if (!this.columnDragAutoScrollingRight) {
            return;
        }
        const scrollLeft = grid.getHScrollValue();
        if (!grid.dragging || scrollLeft > (grid.sbHScroller.range.max - 2)) {
            return;
        }
        const draggedIndex = grid.renderOverridesCache.dragger.columnIndex;
        grid.scrollBy(1, 0);
        const newIndex = draggedIndex + 1;

        grid.swapColumns(newIndex, draggedIndex);
        grid.renderOverridesCache.dragger.columnIndex = newIndex;

        setTimeout(this._checkAutoScrollToRight.bind(this, grid, x), 250);
    }

    /**
     * @desc autoscroll to the left if necessary
     * @param x - the start position
     */
    checkAutoScrollToLeft(grid: Hypergrid, x: number) {
        if (this.columnDragAutoScrollingLeft) {
            return;
        }
        this.columnDragAutoScrollingLeft = true;
        this._checkAutoScrollToLeft(grid, x);
    }

    _checkAutoScrollToLeft(grid: Hypergrid, x: number) {
        if (!this.columnDragAutoScrollingLeft) {
            return;
        }

        const scrollLeft = grid.getHScrollValue();
        if (!grid.dragging || scrollLeft < 1) {
            return;
        }
        const draggedIndex = grid.renderOverridesCache.dragger.columnIndex;
        grid.swapColumns(draggedIndex + scrollLeft, draggedIndex + scrollLeft - 1);
        grid.scrollBy(-1, 0);
        setTimeout(this._checkAutoScrollToLeft.bind(this, grid, x), 250);
    }

    /**
     * @desc a column drag has completed, update data and cleanup
     */
    endDragColumn(grid: Hypergrid) {

        const fixedColumnCount = grid.getFixedColumnCount();
        let scrollLeft = grid.getHScrollValue();

        const columnIndex = grid.renderOverridesCache.dragger.columnIndex;

        if (columnIndex < fixedColumnCount) {
            scrollLeft = 0;
        }

        const startX = grid.renderer.visibleColumns[columnIndex - scrollLeft].left;
        const d = dragger;
        const changed = grid.renderOverridesCache.dragger.startIndex !== grid.renderOverridesCache.dragger.columnIndex;
        this.setCrossBrowserProperty(d, 'transition', (grid.isWebkit ? '-webkit-' : '') + 'transform ' + columnAnimationTime + 'ms ease, box-shadow ' + columnAnimationTime + 'ms ease');
        this.setCrossBrowserProperty(d, 'transform', translate(grid, startX, -1));
        d.style.boxShadow = '0px 0px 0px #888888';

        setTimeout(() => {
            grid.renderOverridesCache.dragger = null;
            grid.repaint();
            requestAnimationFrame(function() {
                d.style.display = 'none';
                grid.endDragColumnNotification(); //internal notification
                if (changed){
                    grid.fireSyntheticOnColumnsChangedEvent(); //public notification
                }
            });
        }, columnAnimationTime + 50);

    }

}

export namespace ColumnMoving {
    export const typeName = 'columnmoving';
}
