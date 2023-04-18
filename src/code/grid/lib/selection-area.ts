import { Corner } from './corner';
import { Point } from './point';
import { RectangleInterface } from './rectangle-interface';

export interface SelectionArea extends RectangleInterface {
    readonly areaType: SelectionArea.Type;

    readonly topLeft: Point;
    readonly exclusiveBottomRight: Point;
    readonly firstCorner: Corner;

    readonly width: number;
    readonly height: number;
    readonly size: number;
}

export namespace SelectionArea {
    export const enum Type {
        Rectangle,
        Column,
        Row,
    }

    export const enum TypeSpecifier {
        Primary,
        Secondary,
        Rectangle,
        Row,
        Column,
        LastOrPrimary,
    }

    export function isEqual(left: SelectionArea, right: SelectionArea) {
        const leftTopLeft = left.topLeft;
        const rightTopLeft = right.topLeft;
        return (
            leftTopLeft.x === rightTopLeft.x &&
            leftTopLeft.y === rightTopLeft.y &&
            left.width === right.width &&
            left.height === right.height
        );
    }
}
