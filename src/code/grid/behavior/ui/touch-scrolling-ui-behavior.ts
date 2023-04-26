
import { ViewportCell } from '../../cell/viewport-cell';
import { EventDetail } from '../../event/event-detail';
import { FinBar } from '../../finbar/finbar-api';
import { UiBehavior } from './ui-behavior';

export class TouchScrollingUiBehavior extends UiBehavior {

    readonly typeName = TouchScrollingUiBehavior.typeName;

    private _stepTimeoutHandle: ReturnType<typeof setTimeout>;
    private touches: TouchScrollingUiBehavior.TouchedBounds[];

    override handleTouchStart(eventDetail: EventDetail.Touch) {
        this.stopDeceleration();
        const currentTouch = this.getTouchedBounds(eventDetail);
        if (currentTouch === undefined) {
            this.touches = [];
        } else {
            this.touches = [currentTouch];
        }
    }

    override handleClick(event: MouseEvent, cell: ViewportCell | null | undefined) {
        return cell;
    }

    override handleDoubleClick(event: MouseEvent, cell: ViewportCell | null | undefined) {
        return cell;
    }

    override handleTouchMove(eventDetail: EventDetail.Touch) {
        const currentTouch = this.getTouchedBounds(eventDetail);
        const touchCount = this.touches.length;
        if (currentTouch !== undefined && touchCount > 0) {
            const lastTouch = this.touches[this.touches.length - 1];

            const xOffset = (lastTouch.x - currentTouch.x) / lastTouch.width;
            const yOffset = (lastTouch.y - currentTouch.y) / lastTouch.height;

            this.scrollBehavior.scrollHorizontal(xOffset);
            this.scrollBehavior.scrollVerticalIndex(yOffset);

            if (touchCount >= TouchScrollingUiBehavior.MAX_TOUCHES) {
                this.touches.shift();
            }

            this.touches.push(currentTouch);
        }
    }

    override handleTouchEnd(eventDetail: EventDetail.Touch) {
        const currentTouch = this.getTouchedBounds(eventDetail);
        const touchCount = this.touches.length;
        if (currentTouch !== undefined && touchCount > 0) {
            let timeOffset: number;
            let i = -1;

            do {
                timeOffset = (currentTouch.timestamp - this.touches[++i].timestamp);
            } while (timeOffset > 100 && i < this.touches.length - 1);

            const startTouch = this.touches[i];

            this.decelerateY(startTouch, currentTouch);
            this.decelerateX(startTouch, currentTouch);
        }
    }

    private getTouchedBounds(eventDetail: EventDetail.Touch) {
        const point = eventDetail.touches[0];
        const cell = this.viewport.findLeftGridLineInclusiveCellFromOffset(point.x, point.y);
        if (cell === undefined) {
            return undefined;
        } else {
            const bounds = cell.bounds as TouchScrollingUiBehavior.TouchedBounds;
            bounds.timestamp = Date.now();
            return bounds;
        }
    }

    private decelerateY(startTouch: TouchScrollingUiBehavior.TouchedBounds, endTouch: TouchScrollingUiBehavior.TouchedBounds) {
        const offset = endTouch.y - startTouch.y;
        const timeOffset = endTouch.timestamp - startTouch.timestamp;
        this.decelerate(this.scrollBehavior.verticalScroller, offset, timeOffset);
    }

    private decelerateX(startTouch: TouchScrollingUiBehavior.TouchedBounds, endTouch: TouchScrollingUiBehavior.TouchedBounds) {
        const offset = endTouch.x - startTouch.x;
        const timeOffset = endTouch.timestamp - startTouch.timestamp;
        this.decelerate(this.scrollBehavior.horizontalScroller, offset, timeOffset);
    }

    private decelerate(scroller: FinBar, offset: number, timeOffset: number) {
        const velocity = (Math.abs(offset) / timeOffset) * 100;
        const dir = -Math.sign(offset);
        const interval = this.getInitialInterval(velocity);

        this.step(scroller, velocity, dir, interval);
    }

    private step(scroller: FinBar, velocity: number, dir: number, interval: number) {
        if (velocity > 0) {
            const delta = this.getDelta(velocity);
            const index = scroller.index + (dir * delta);
            scroller.index = index;

            if (index > scroller.contentRange.finish || index < 0) {
                return;
            }

            velocity -= TouchScrollingUiBehavior.DEC_STEP_SIZE;

            const nextInterval = this.updateInterval(interval, velocity);
            this._stepTimeoutHandle = setTimeout(
                () => this.step(scroller, velocity, dir, nextInterval),
                interval
            );
        }
    }

    private getDelta(velocity: number) {
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

    private getInitialInterval(velocity: number) {
        if (velocity >= 50) {
            return 5;
        } else if (velocity >= 25) {
            return 15;
        } else {
            return 30;
        }
    }

    private updateInterval(interval: number, velocity: number) {
        if (interval >= TouchScrollingUiBehavior.MAX_INTERVAL) {
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

    private stopDeceleration() {
        clearTimeout(this._stepTimeoutHandle);
    }
}

export namespace TouchScrollingUiBehavior {
    export const typeName = 'touchscrolling';

    export const MAX_INTERVAL = 200;
    export const MAX_TOUCHES = 70;
    export const DEC_STEP_SIZE = 5;

    export interface TouchedBounds extends ViewportCell.Bounds {
        timestamp: number;
    }
}
