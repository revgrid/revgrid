import { Focus } from '../focus';
import { Point } from '../lib/point';

export class FocusBehavior {
    constructor(
        private readonly _focus: Focus,
        private readonly _scrollToMakeVisibleEventer: FocusBehavior.ScrollToMakeVisibleEventer,

    ) {

    }

    setFocusPoint(point: Point) {
        this._scrollToMakeVisibleEventer(point.x, point.y);
        this._focus.set(point);
    }

    setFocusXY(x: number, y: number) {
        this._scrollToMakeVisibleEventer(x, y);
        this._focus.setXYCoordinates(x, y);
    }
}

export namespace FocusBehavior {
    export type ScrollToMakeVisibleEventer = (this: void, x: number, y: number) => void;
}
