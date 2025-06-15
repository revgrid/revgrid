import { RevPoint } from './point';
import { RevRectangle } from './rectangle';

/** @public */
export interface RevInexclusiveArea extends RevRectangle {
    readonly topLeft: RevPoint;
    readonly exclusiveBottomRight: RevPoint;

    readonly width: number;
    readonly height: number;
}
