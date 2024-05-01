
import { RevRectangle } from '../../../common/internal-api';
import { RevScrollDimension } from '../../components/view/scroll-dimension';
import { RevLinedHoverCell } from '../../interfaces/data/lined-hover-cell';
import { RevSchemaField } from '../../interfaces/schema/schema-field';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings } from '../../settings/internal-api';
import { RevUiController } from './ui-controller';

/** @internal */
export class RevTouchScrollingUiController<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevUiController<BGS, BCS, SF> {

    readonly typeName = RevTouchScrollingUiController.typeName;

    private _stepTimeoutHandle: ReturnType<typeof setTimeout>;
    private touches: RevTouchScrollingUiController.TouchedBounds[];

    override handleTouchStart(eventDetail: TouchEvent) {
        this.stopDeceleration();
        const currentTouch = this.getTouchedBounds(eventDetail);
        if (currentTouch === undefined) {
            this.touches = [];
        } else {
            this.touches = [currentTouch];
        }
    }

    override handleClick(_event: MouseEvent, cell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        return cell;
    }

    override handleDblClick(_event: MouseEvent, cell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        return cell;
    }

    override handleTouchMove(eventDetail: TouchEvent) {
        const currentTouch = this.getTouchedBounds(eventDetail);
        const touchCount = this.touches.length;
        if (currentTouch !== undefined && touchCount > 0) {
            const lastTouch = this.touches[this.touches.length - 1];

            const xOffset = (lastTouch.x - currentTouch.x) / lastTouch.width;
            const yOffset = (lastTouch.y - currentTouch.y) / lastTouch.height;

            this.viewLayout.scrollHorizontalViewportBy(xOffset);
            this.viewLayout.scrollVerticalViewportBy(yOffset);

            if (touchCount >= RevTouchScrollingUiController.MAX_TOUCHES) {
                this.touches.shift();
            }

            this.touches.push(currentTouch);
        }
    }

    override handleTouchEnd(eventDetail: TouchEvent) {
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

    private getTouchedBounds(eventDetail: TouchEvent) {
        const firstTouch = eventDetail.touches[0];
        const canvasFirstTouchOffsetPoint = this.canvas.getOffsetPoint(firstTouch);
        const cell = this.viewLayout.findLinedHoverCellAtCanvasOffset(canvasFirstTouchOffsetPoint.x, canvasFirstTouchOffsetPoint.y);
        if (cell === undefined) {
            return undefined;
        } else {
            const bounds = cell.viewCell.bounds as RevTouchScrollingUiController.TouchedBounds;
            bounds.timestamp = Date.now();
            return bounds;
        }
    }

    private decelerateY(startTouch: RevTouchScrollingUiController.TouchedBounds, endTouch: RevTouchScrollingUiController.TouchedBounds) {
        const offset = endTouch.y - startTouch.y;
        const timeOffset = endTouch.timestamp - startTouch.timestamp;
        this.decelerate(this.viewLayout.verticalScrollDimension, offset, timeOffset);
    }

    private decelerateX(startTouch: RevTouchScrollingUiController.TouchedBounds, endTouch: RevTouchScrollingUiController.TouchedBounds) {
        const offset = endTouch.x - startTouch.x;
        const timeOffset = endTouch.timestamp - startTouch.timestamp;
        this.decelerate(this.viewLayout.horizontalScrollDimension, offset, timeOffset);
    }

    private decelerate(scrollDimension: RevScrollDimension<BGS>, offset: number, timeOffset: number) {
        const velocity = (Math.abs(offset) / timeOffset) * 100;
        const dir = -Math.sign(offset);
        const interval = this.getInitialInterval(velocity);

        this.step(scrollDimension, velocity, dir, interval);
    }

    private step(scrollDimension: RevScrollDimension<BGS>, velocity: number, dir: number, interval: number) {
        if (velocity > 0) {
            const viewportStart = scrollDimension.viewportStart;
            if (viewportStart !== undefined) {
                const delta = this.getDelta(velocity);
                const newViewportStart = viewportStart + (dir * delta);
                this.viewLayout.setVerticalViewportStart(newViewportStart);

                if (newViewportStart > this.viewLayout.verticalScrollDimension.finish || newViewportStart < 0) {
                    return;
                }

                velocity -= RevTouchScrollingUiController.DEC_STEP_SIZE;

                const nextInterval = this.updateInterval(interval, velocity);
                this._stepTimeoutHandle = setTimeout(
                    () => { this.step(scrollDimension, velocity, dir, nextInterval); },
                    interval
                );
            }
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
        if (interval >= RevTouchScrollingUiController.MAX_INTERVAL) {
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

/** @internal */
export namespace RevTouchScrollingUiController {
    export const typeName = 'touchscrolling';

    export const MAX_INTERVAL = 200;
    export const MAX_TOUCHES = 70;
    export const DEC_STEP_SIZE = 5;

    export interface TouchedBounds extends RevRectangle {
        timestamp: number;
    }
}
