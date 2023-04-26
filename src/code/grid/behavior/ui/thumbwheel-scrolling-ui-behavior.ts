
import { ViewportCell } from '../../cell/viewport-cell';
import { GridProperties } from '../../grid-properties';
import { UnreachableCaseError } from '../../lib/revgrid-error';
import { HorizontalWheelScrollingAllowed } from '../../lib/types';
import { UiBehavior } from './ui-behavior';

export class ThumbwheelScrollingUiBehavior extends UiBehavior {

    readonly typeName = ThumbwheelScrollingUiBehavior.typeName;

    override handleWheelMoved(event: WheelEvent, cell: ViewportCell | null | undefined) {
        const gridProps = this.gridProperties;
        if (gridProps.scrollingEnabled) {
            const deltaX = event.deltaX;
            const deltaY = event.deltaY;

            if (deltaX) {
                if (this.isHorizontalWheelScrollingAllowed(gridProps, event)) {
                    if (gridProps.scrollHorizontallySmoothly) {
                        this.scrollBehavior.scrollViewHorizontallyBy(deltaX);
                    } else {
                        this.scrollBehavior.scrollColumnsBy(Math.sign(deltaX));
                    }
                }
            }
            if (deltaY) {
                this.scrollBehavior.scrollVerticalIndex(Math.sign(deltaY)); // Update when Vertical scrolling improved
                // grid.scrollVBy(Math.sign(deltaY));
            }
        }
        return cell;
    }

    isHorizontalWheelScrollingAllowed(gridProps: GridProperties, event: WheelEvent) {
        switch (gridProps.horizontalWheelScrollingAllowed) {
            case HorizontalWheelScrollingAllowed.Never: return false;
            case HorizontalWheelScrollingAllowed.Always: return true;
            case HorizontalWheelScrollingAllowed.CtrlKeyDown: return event.ctrlKey;
            default: throw new UnreachableCaseError('TSIHWCA82007', gridProps.horizontalWheelScrollingAllowed);
        }
    }
}

export namespace ThumbwheelScrollingUiBehavior {
    export const typeName = 'thumbwheelscrolling';
}
