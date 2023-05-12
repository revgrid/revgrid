import { GridSettings } from '../../interfaces/grid-settings';
import { CanvasEx } from '../canvas-ex/canvas-ex';
import { ColumnsManager } from '../column/columns-manager';
import { HorizontalScrollPlaneDimension } from './horizontal-scroll-plane-dimension';
import { VerticalScrollPlaneDimension } from './vertical-scroll-plane-dimension';

export class ScrollPlane {
    readonly horizontalDimension: HorizontalScrollPlaneDimension;
    readonly verticalDimension: VerticalScrollPlaneDimension;

    constructor(
        canvasEx: CanvasEx,
        gridSettings: GridSettings,
        columnsManager: ColumnsManager,
    ) {
        this.horizontalDimension = new HorizontalScrollPlaneDimension(canvasEx, gridSettings, columnsManager);
        this.verticalDimension = new VerticalScrollPlaneDimension(canvasEx);
    }

    get anchorLimitsValid() { return this.horizontalDimension.valid && this.verticalDimension.valid; }

    invalidate() {
        this.horizontalDimension.invalidate();
        this.verticalDimension.invalidate();
    }
}
