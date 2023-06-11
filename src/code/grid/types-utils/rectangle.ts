/** @public */
export interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** @public */
export namespace Rectangle {
    export function isEqual(left: Rectangle, right: Rectangle) {
        return (
            left.x === right.x &&
            left.y === right.y &&
            left.width === right.width &&
            left.height === right.height
        );
    }

    export function containsXY(rectangle: Rectangle, x: number, y: number) {
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
