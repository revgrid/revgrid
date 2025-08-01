import { RevPoint } from './point';
import { RevRectangle } from './rectangle';

/** @public */
export interface RevCornerArea extends RevRectangle {
    readonly topLeft: RevPoint;
    readonly exclusiveBottomRight: RevPoint;

    readonly width: number;
    readonly height: number;
}
