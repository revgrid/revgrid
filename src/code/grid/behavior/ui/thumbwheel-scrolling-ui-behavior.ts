
import { ViewCell } from '../../components/cell/view-cell';
import { GridSettings } from '../../interfaces/grid-settings';
import { UnreachableCaseError } from '../../lib/revgrid-error';
import { HorizontalWheelScrollingAllowed } from '../../lib/types';
import { UiBehavior } from './ui-behavior';

/** @internal */
export class ThumbwheelScrollingUiBehavior extends UiBehavior {

    readonly typeName = ThumbwheelScrollingUiBehavior.typeName;

    override handleWheelMove(event: WheelEvent, cell: ViewCell | null | undefined) {
        const gridProps = this.gridSettings;
        if (gridProps.scrollingEnabled) {
            const deltaX = event.deltaX;
            const deltaY = event.deltaY;

            if (deltaX) {
                if (this.isHorizontalWheelScrollingAllowed(gridProps, event)) {
                    if (gridProps.scrollHorizontallySmoothly) {
                        this.viewLayout.scrollHorizontalViewportBy(deltaX);
                    } else {
                        this.viewLayout.scrollColumnsBy(Math.sign(deltaX));
                    }
                }
            }
            if (deltaY) {
                this.viewLayout.scrollRowsBy(Math.sign(deltaY)); // Update when Vertical scrolling improved
                // grid.scrollVBy(Math.sign(deltaY));
            }
        }
        return cell;
    }

    isHorizontalWheelScrollingAllowed(gridProps: GridSettings, event: WheelEvent) {
        switch (gridProps.horizontalWheelScrollingAllowed) {
            case HorizontalWheelScrollingAllowed.Never: return false;
            case HorizontalWheelScrollingAllowed.Always: return true;
            case HorizontalWheelScrollingAllowed.CtrlKeyDown: return event.ctrlKey;
            default: throw new UnreachableCaseError('TSIHWCA82007', gridProps.horizontalWheelScrollingAllowed);
        }
    }
}

/** @internal */
export namespace ThumbwheelScrollingUiBehavior {
    export const typeName = 'thumbwheelscrolling';
}
