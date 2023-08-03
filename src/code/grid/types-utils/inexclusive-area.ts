import { Point } from './point';
import { Rectangle } from './rectangle';

/** @public */
export interface InexclusiveArea extends Rectangle {
    readonly topLeft: Point;
    readonly exclusiveBottomRight: Point;

    readonly width: number;
    readonly height: number;
}
