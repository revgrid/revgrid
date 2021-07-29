
import { Hypergrid } from '../grid/hypergrid';
import { CellEvent } from '../lib/cell-event';
import { Feature } from './feature';

/**
 * @typedef {import("../Hypergrid")} Hypergrid
 */

/**
 * @constructor
 */
export class ThumbwheelScrolling extends Feature {

    readonly typeName = ThumbwheelScrolling.typeName;

    override handleWheelMoved(grid: Hypergrid, e: CellEvent) {
        if (!grid.properties.scrollingEnabled) {
            return;
        }


        // var primEvent = e.primitiveEvent,
        //     deltaX = Math.sign(primEvent.wheelDeltaX || -primEvent.deltaX),
        //     deltaY = Math.sign(primEvent.wheelDeltaY || -primEvent.deltaY);

        // if (deltaX || deltaY) {
        //     grid.scrollBy(
        //         -deltaX || 0, // 0 if NaN
        //         -deltaY || 0
        //     );
        // }

        const primEvent = e.primitiveEvent.detail.primitiveEvent;
        if (primEvent instanceof WheelEvent) {
            const deltaX = Math.sign(-primEvent.deltaX);
            const deltaY = Math.sign(-primEvent.deltaY);

            if (deltaX || deltaY) {
                grid.scrollBy(
                    -deltaX || 0, // 0 if NaN
                    -deltaY || 0
                );
            }
        }
    }

}

export namespace ThumbwheelScrolling {
    export const typeName = 'thumbwheelscrolling';
}
