/** @public */
export interface RevRectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** @public */
export namespace RevRectangle {
    export function isEqual(left: RevRectangle, right: RevRectangle) {
        return (
            left.x === right.x &&
            left.y === right.y &&
            left.width === right.width &&
            left.height === right.height
        );
    }

    export function containsXY(rectangle: RevRectangle, x: number, y: number) {
        const rectangleX = rectangle.x;
        const rectangleY = rectangle.y;
        return (
            x >= rectangleX &&
            y >= rectangleY &&
            x < rectangleX + rectangle.width &&
            y < rectangleY + rectangle.height
        );
    }
}
