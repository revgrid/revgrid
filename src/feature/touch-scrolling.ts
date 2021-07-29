
import { FinBar } from '../dependencies/finbar';
import { Hypergrid } from '../grid/hypergrid';
import { Canvas } from '../lib/canvas';
import { CellInfo } from '../lib/cell-info';
import { Feature } from './feature';

/**
 * @typedef {any} TouchScrollingType TODO
 */

/**
 * @constructor
 * @extends Feature
 */
export class TouchScrolling extends Feature {

    readonly typeName = TouchScrolling.typeName;

    timer: ReturnType<typeof setTimeout>;
    private touches: CellInfo.Bounds[];

    override handleTouchStart(grid: Hypergrid, event: Canvas.TouchSyntheticEvent) {
        this.stopDeceleration();
        this.touches = [this.getTouchedBounds(grid, event)];
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    override handleClick() {

    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    override handleDoubleClick() {

    }

    override handleTouchMove(grid: Hypergrid, event: Canvas.TouchSyntheticEvent) {
        const currentTouch = this.getTouchedBounds(grid, event);
        const lastTouch = this.touches[this.touches.length - 1];

        const xOffset = (lastTouch.x - currentTouch.x) / lastTouch.width;
        const yOffset = (lastTouch.y - currentTouch.y) / lastTouch.height;

        grid.sbHScroller.index += xOffset;
        grid.sbVScroller.index += yOffset;

        if (this.touches.length >= TouchScrolling.MAX_TOUCHES) {
            this.touches.shift();
        }

        this.touches.push(currentTouch);
    }

    override handleTouchEnd(grid: Hypergrid, event: Canvas.TouchSyntheticEvent) {
        const currentTouch = this.getTouchedBounds(grid, event);
        let timeOffset: number;
        let i = -1;

        do {
            timeOffset = (currentTouch.timestamp - this.touches[++i].timestamp);
        } while (timeOffset > 100 && i < this.touches.length - 1);

        const startTouch = this.touches[i];

        this.decelerateY(grid, startTouch, currentTouch);
        this.decelerateX(grid, startTouch, currentTouch);
    }

    getTouchedBounds(grid: Hypergrid, event: Canvas.TouchSyntheticEvent) {
        const point = event.detail.touches[0];
        const bounds = grid.getGridCellFromMousePoint(point).cellInfo.bounds;
        bounds.timestamp = Date.now();
        return bounds;
    }

    decelerateY(grid: Hypergrid, startTouch: CellInfo.Bounds, endTouch: CellInfo.Bounds) {
        const offset = endTouch.y - startTouch.y;
        const timeOffset = endTouch.timestamp - startTouch.timestamp;
        this.decelerate(grid.sbVScroller, offset, timeOffset);
    }

    decelerateX(grid: Hypergrid, startTouch: CellInfo.Bounds, endTouch: CellInfo.Bounds) {
        const offset = endTouch.x - startTouch.x;
        const timeOffset = endTouch.timestamp - startTouch.timestamp;
        this.decelerate(grid.sbHScroller, offset, timeOffset);
    }

    decelerate(scroller: FinBar, offset: number, timeOffset: number) {
        const velocity = (Math.abs(offset) / timeOffset) * 100;
        const dir = -Math.sign(offset);
        const interval = this.getInitialInterval(velocity);

        this.step(scroller, velocity, dir, interval);
    }

    step(scroller: FinBar, velocity: number, dir: number, interval: number) {
        if (velocity > 0) {
            const delta = this.getDelta(velocity);
            const index = scroller.index + (dir * delta);
            scroller.index = index;

            if (index > scroller.range.max || index < 0) {
                return;
            }

            velocity -= TouchScrolling.DEC_STEP_SIZE;

            const nextInterval = this.updateInterval(interval, velocity);
            this.timer = setTimeout(
                () => this.step(scroller, velocity, dir, nextInterval),
                interval
            );
        }
    }

    getDelta(velocity: number) {
        if (velocity >= 180) {
            return 10;
        } else if (velocity >= 100) {
            return 5;
        } else if (velocity >= 50) {
            return 2;
        } else if (velocity >= 25) {
            return 1;
        } else {
            return 0.5;
        }
    }

    getInitialInterval(velocity: number) {
        if (velocity >= 50) {
            return 5;
        } else if (velocity >= 25) {
            return 15;
        } else {
            return 30;
        }
    }

    updateInterval(interval: number, velocity: number) {
        if (interval >= TouchScrolling.MAX_INTERVAL) {
            return interval;
        }

        let offset = 0;

        if (velocity < 25) {
            offset = 10;
        } else if (velocity < 75) {
            offset = 5;
        } else if (velocity < 150) {
            offset = 2;
        }

        return interval + offset;
    }

    stopDeceleration() {
        clearTimeout(this.timer);
    }
}

export namespace TouchScrolling {
    export const typeName = 'touchscrolling';

    export const MAX_INTERVAL = 200;
    export const MAX_TOUCHES = 70;
    export const DEC_STEP_SIZE = 5;
}
