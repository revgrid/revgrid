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
}
