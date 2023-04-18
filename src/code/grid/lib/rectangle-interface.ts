/** @public */
export interface RectangleInterface {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** @public */
export namespace RectangleInterface {
    export function isEqual(left: RectangleInterface, right: RectangleInterface) {
        return (
            left.x === right.x &&
            left.y === right.y &&
            left.width === right.width &&
            left.height === right.height
        );
    }
}
