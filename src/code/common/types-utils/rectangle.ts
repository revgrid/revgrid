/**
 * Represents a rectangle defined by its top-left corner (x, y) and its dimensions (width, height).
 * @public
 */
export interface RevRectangle {
    /** The x-coordinate of the top-left corner of the rectangle. */
    x: number;
    /** The y-coordinate of the top-left corner of the rectangle. */
    y: number;
    /** The width of the rectangle. */
    width: number;
    /** The height of the rectangle. */
    height: number;
}

/** @public */
export namespace RevRectangle {
    /**
     * Determines whether two `RevRectangle` interfaces are equal by comparing their
     * `x`, `y`, `width`, and `height` properties.
     *
     * @param left - The first rectangle to compare.
     * @param right - The second rectangle to compare.
     * @returns `true` if all properties are equal; otherwise, `false`.
     */
    export function isEqual(left: RevRectangle, right: RevRectangle): boolean {
        return (
            left.x === right.x &&
            left.y === right.y &&
            left.width === right.width &&
            left.height === right.height
        );
    }

    /**
     * Determines whether the specified (x, y) coordinate lies within the bounds of the given rectangle.
     *
     * @param rectangle - The rectangle to test against.
     * @param x - The x-coordinate to check.
     * @param y - The y-coordinate to check.
     * @returns `true` if the (x, y) coordinate is inside the rectangle (inclusive of the top-left edge and exclusive of the bottom-right edge); otherwise, `false`.
     */
    export function containsXY(rectangle: RevRectangle, x: number, y: number): boolean {
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
