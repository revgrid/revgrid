import { Mouse } from '../../components/mouse/mouse';
import { Point } from '../../lib/point';

export class UserInterfaceInputBehavior {
    constructor(
        private readonly _mouse: Mouse,
    ) {

    }

    getMouseDown() {
        return this._mouse.getMouseDown();
    }

    popMouseDown() {
        return this._mouse.popMouseDown();
    }

    /**
     * @desc Empty out the mouse down stack.
     */
    clearMouseDown() {
        return this._mouse.clearMouseDown();
    }

    setMouseDown(point: Point) {
        this._mouse.setMouseDown(point);
    }

    /**
     * @returns The extent point of the current drag selection rectangle.
     */
    getDragExtent() {
        return this._mouse.getDragExtent();
    }

    /**
     * @summary Set the extent point of the current drag selection operation.
     */
    setDragExtent(point: Point) {
        return this._mouse.setDragExtent(point);
    }

}
