import { RevCornerArea } from './corner-area';
import { RevPoint, RevWritablePoint } from './point';

/** @public */
export class RevCornerRectangle implements RevCornerArea {
    private _x: number; // left
    private _y: number; // top

    /**
     * Upper left corner of this rect.
     */
    private _topLeft: RevWritablePoint;

    /**
     * this rect's width and height.
     * @remarks Unlike the other `Point` properties, `extent` is not a global coordinate pair; rather it consists of a _width_ (`x`, always positive) and a _height_ (`y`, always positive).
     *
     * This object might be more legitimately typed as something like `Area` with properties `width` and `height`; however we wanted it to be able to use it efficiently with a point's `plus` and `minus` methods (that is, without those methods having to check and branch on the type of its parameter).
     *
     * Created upon instantiation by the constructor.
     * @see The {@link RevCornerRectangle#_exclusiveBottomRight|corner} method.
     */
    private _extent: RevWritablePoint;

    /**
     * One pixel out from bottom right of rectangle.
     */
    private _exclusiveBottomRight: RevWritablePoint;

    /**
     * This object represents a rectangular area within an 2-dimensional space.
     *
     * @param leftOrExRight - The left X coordinate of the rectangle if width is positive, or the exclusive right X coordinate if width is negative.
     * @param topOrExBottom - The top Y coordinate of the rectangle if height is positive, or the exclusive bottom Y coordinate if height is negative.
     * @param width - Width of the rectangle. If negative, width is in reverse direction from the exclusive right.
     * @param height - Height of the rectangle. If negative, height is in reverse direction from the exclusive bottom.
     */
    constructor(leftOrExRight: number, topOrExBottom: number, width: number, height: number) {
        let left: number;
        if (width >= 0) {
            left = leftOrExRight;
        } else {
            left = leftOrExRight + width;
            width = -width;
        }
        this._x = left;

        let top: number;
        if (height >= 0) {
            top = topOrExBottom;
        } else {
            top = topOrExBottom + height;
            height = -height;
        }
        this._y = top;

        this._topLeft = RevWritablePoint.create(left, top);
        this._extent = RevWritablePoint.create(width, height);
        this._exclusiveBottomRight = RevWritablePoint.create(left + width, top + height);
    }

    get x() { return this._x; }
    get y() { return this._y; }
    get topLeft(): RevPoint { return this._topLeft; }
    get exclusiveBottomRight(): RevPoint { return this._exclusiveBottomRight; }
    get inclusiveBottomRight(): RevPoint {
        return { x: this._exclusiveBottomRight.x - 1, y: this._exclusiveBottomRight.y - 1 };
    }
    get extent(): RevPoint { return this._extent; }

    /**
     * Top co-ordinate of rectangle (same as {@link y}).
     */
    get top() {
        return this._y;
    }

    /**
     * Left co-ordinate of rectangle (same as {@link x}).
     */
    get left() {
        return this._x;
    }

    /** Bottom co-ordinate of rectangle. */
    get inclusiveBottom() {
        return this._exclusiveBottomRight.y - 1;
    }

    /** Exclusive bottom co-ordinate of rectangle. ({@link inclusiveBottom} + 1) */
    get exclusiveBottom() {
        return this._exclusiveBottomRight.y;
    }

    /** Right co-ordinate of rectangle. */
    get inclusiveRight() {
        return this._exclusiveBottomRight.x - 1;
    }

    /** Exclusive right co-ordinate of rectangle. ({@link inclusiveRight} + 1) */
    get exclusiveRight() {
        return this._exclusiveBottomRight.x;
    }

    /**
     * Width of this rectangle (always positive).
     */
    get width() {
        return this._extent.x;
    }

    /**
     * Height of this rect (always positive).
     */
    get height() {
        return this._extent.y;
    }

    /**
     * Area of this rectangle.
     */
    get area() {
        return this.width * this.height;
    }

    /**
     * Creates and returns a new `RevCornerRectangle` instance that is a copy of the current rectangle.
     */
    createCopy(): RevCornerRectangle {
        return new RevCornerRectangle(this._x, this._y, this._extent.x, this._extent.y);
    }

    /**
     * Determines whether the specified point is contained within the rectangle.
     * @param point - The point or rect to test for containment.
     * @returns `true` if the point is within the rectangle; otherwise, `false`.
     */
    containsPoint(point: RevPoint): boolean {
        return this.containsXY(point.x, point.y);
    }

    /**
     * Determines whether the specified point (x, y) is contained within the rectangle.
     *
     * @param x - The x-coordinate of the point to test.
     * @param y - The y-coordinate of the point to test.
     * @returns `true` if the point is within the rectangle; otherwise, `false`.
     */
    containsXY(x: number, y: number): boolean {
        const topLeftX = this._topLeft.x;
        const topLeftY = this._topLeft.y;

        return (
            x >= topLeftX &&
            y >= topLeftY &&
            x < topLeftX + this._extent.x &&
            y < topLeftY + this._extent.y
        );
    }

    /**
     * Determines whether the specified x-coordinate is within the horizontal bounds of the rectangle.
     *
     * @param x - The x-coordinate to test.
     * @returns `true` if the x-coordinate is within the rectangle's horizontal bounds; otherwise, `false`.
     */
    containsX(x: number): boolean {
        const topLeftX = this._topLeft.x;
        return (x >= topLeftX && x < topLeftX + this._extent.x);
    }

    /**
     * Determines whether the specified y-coordinate is within the vertical bounds of the rectangle.
     *
     * @param y - The y-coordinate to test.
     * @returns `true` if the y-coordinate is within the rectangle's vertical bounds; otherwise, `false`.
     */
    containsY(y: number): boolean {
        const topLeftY = this._topLeft.y;
        return (y >= topLeftY && y < topLeftY + this._extent.y);
    }

    /**
     * @returns `true` iff `this` rect is entirely contained within given `rect`.
     * @param rect - Rectangle to test against this rect.
     */
    within(rect: RevCornerRectangle): boolean {
        return (
            RevPoint.lessThanOrEqualTo(rect._topLeft, this._topLeft) &&
            RevPoint.greaterThanOrEqualTo(rect._exclusiveBottomRight, this._exclusiveBottomRight)
        );
    }

    /** Moves this Rectangle in x direction */
    moveX(offset: number): void {
        this._x += offset;
        RevWritablePoint.moveX(this.topLeft, offset);
        RevWritablePoint.moveX(this.exclusiveBottomRight, offset);
    }

    /** Moves this Rectangle in y direction */
    moveY(offset: number): void {
        this._y += offset;
        RevWritablePoint.moveY(this.topLeft, offset);
        RevWritablePoint.moveY(this.exclusiveBottomRight, offset);
    }

    /** Grows this Rectangle in x direction with let staying fixed */
    growFromLeft(widthIncrease: number): void {
        RevWritablePoint.moveX(this._extent, widthIncrease);
        RevWritablePoint.moveX(this._exclusiveBottomRight, widthIncrease);
    }

    /** Grows this Rectangle in y direction with top staying fixed */
    growFromTop(heightIncrease: number): void {
        RevWritablePoint.moveY(this._extent, heightIncrease);
        RevWritablePoint.moveY(this._exclusiveBottomRight, heightIncrease);
    }

    /**
     * @returns A copy of this rect but with horizontal position reset to given `x` and no width.
     * @param x - Horizontal coordinate of the new rect.
     */
    newXFlattened(x: number): RevCornerRectangle {
        return new RevCornerRectangle(x, this._topLeft.y, 0, this._extent.y);
    }

    /**
     * @returns A copy of this rect but with vertical position reset to given `y` and no height.
     * @param y - Vertical coordinate of the new rect.
     */
    newYFlattened(y: number): RevCornerRectangle {
        return new RevCornerRectangle(this._topLeft.x, y, this._extent.x, 0);
    }

    newXMoved(xOffset: number): RevCornerRectangle {
        return new RevCornerRectangle(this._x + xOffset, this._y, this.width, this.height);
    }

    newYMoved(yOffset: number): RevCornerRectangle {
        return new RevCornerRectangle(this._x, this._y + yOffset, this.width, this.height);
    }

    /**
     * _(Formerly: `insetBy`.)_
     * @returns That is enlarged/shrunk by given `padding`.
     * @param padding - Amount by which to increase (+) or decrease (-) this rect
     * @see The {@link RevCornerRectangle#newShrunkFromCenter|shrinkBy} method.
     */
    newGrownFromCenter(padding: number): RevCornerRectangle {
        return new RevCornerRectangle(
            this._x - padding,
            this._y - padding,
            this.width + 2 * padding,
            this.height + 2 * padding);
    }

    /**
     * @returns That is enlarged/shrunk by given `padding`.
     * @param padding - Amount by which to decrease (+) or increase (-) this rect.
     * @see The {@link RevCornerRectangle#newGrownFromCenter|growBy} method.
     */
    newShrunkFromCenter(padding: number): RevCornerRectangle {
        return this.newGrownFromCenter(-padding);
    }

    /**
     * @returns Bounding rect that contains both this rect and the given `rect`.
     * @param rect - The rectangle to union with this rect.
     */
    newUnioned(rect: RevCornerRectangle): RevCornerRectangle {
        const origin = RevPoint.min(this._topLeft, rect._topLeft);
        const corner = RevPoint.max(this._exclusiveBottomRight, rect._exclusiveBottomRight);
        const extent = RevPoint.minus(corner, origin);

        return new RevCornerRectangle(
            origin.x, origin.y,
            extent.x, extent.y
        );
    }

    /**
     * iterate over all points within this rect, invoking `iteratee` for each.
     * @param {function(number,number)} iteratee - Function to call for each point.
     * Bound to `context` when given; otherwise it is bound to this rect.
     * Each invocation of `iteratee` is called with two arguments:
     * the horizontal and vertical coordinates of the point.
     * @param {object} [context=this] - Context to bind to `iteratee` (when not `this`).
     */
    // forEach(iteratee: (arg0: number, arg1: number) => unknown, context: Record<string, unknown>) {
    //     context = context || this;
    //     for (let x = this.origin.x, x2 = this.corner.x; x < x2; x++) {
    //         for (let y = this.origin.y, y2 = this.corner.y; y < y2; y++) {
    //             iteratee.call(context, x, y);
    //         }
    //     }
    // }

    /**
     * @returns {RevCornerRectangle} One of:
     * * _If this rect intersects with the given `rect`:_
     *      a new rect representing that intersection.
     * * _If it doesn't intersect and `ifNoneAction` defined:_
     *      result of calling `ifNoneAction`.
     * * _If it doesn't intersect and `ifNoneAction` undefined:_
     *      `null`.
     * @param {RevCornerRectangle} rect - The rectangle to intersect with this rect.
     * @param {function(RevCornerRectangle)} [ifNoneAction] - When no intersection, invoke and return result.
     * Bound to `context` when given; otherwise bound to this rect.
     * Invoked with `rect` as sole parameter.
     * @param {object} [context=this] - Context to bind to `ifNoneAction` (when not `this`).
     */
    // intersect(rect: Rectangle, ifNoneAction: (arg0: Rectangle) => any, context: object): Rectangle {
    //     var result = null,
    //         origin = this.origin.max(rect.origin),
    //         corner = this.corner.min(rect.corner),
    //         extent = corner.minus(origin);

    //     if (extent.x > 0 && extent.y > 0) {
    //         result = new Rectangle(
    //             origin.x, origin.y,
    //             extent.x, extent.y
    //         );
    //     } else if (typeof ifNoneAction === 'function') {
    //         result = ifNoneAction.call(context || this, rect);
    //     }

    //     return result;
    // }

    /**
     * @returns `true` iff this rect overlaps with given `rect`.
     * @param rect - The rectangle to intersect with this rect.
     */
    intersects(rect: RevCornerRectangle): boolean {
        return (
            rect._exclusiveBottomRight.x > this._topLeft.x &&
            rect._exclusiveBottomRight.y > this._topLeft.y &&
            rect._topLeft.x < this._exclusiveBottomRight.x &&
            rect._topLeft.y < this._exclusiveBottomRight.y
        );
    }

    /** Adjusts the selection to where it would be after a columns insertion.
     * @returns true if selection changed
     */
    adjustForXRangeInserted(index: number, count: number): boolean {
        const left = this._x;
        const exclusiveRight = left + this.width;
        if (index >= exclusiveRight || count === 0) {
            return false;
        } else {
            if (index <= left) {
                this.moveX(count);
            } else {
                this.growFromLeft(count);
            }
            return true;
        }
    }

    /** Adjusts the selection to where it would be after a rows insertion.
     * @returns true if selection changed
     */
    adjustForYRangeInserted(index: number, count: number): boolean {
        const top = this._y;
        const height = this.height;
        const exclusiveBottom = top + height;
        if (index >= exclusiveBottom || count === 0) {
            return false;
        } else {
            if (index <= top) {
                this.moveY(count);
            } else {
                this.growFromTop(count);
            }
            return true;
        }
    }

    /** Adjusts the selection to where it would be after a columns deletion.
     * @returns true if selection changed, false if it was not changed or null if it should be fully deleted
     */
    adjustForXRangeDeleted(deletionLeft: number, deletionCount: number): boolean | null {
        const left = this._x;
        const width = this.width;
        const exclusiveRight = left + width;
        if (deletionLeft >= exclusiveRight || deletionCount === 0) {
            // deletion after selection or nothing was deleted
            return false;
        } else {
            const exclusiveDeletionRight = deletionLeft + deletionCount;
            if (deletionLeft <= left) {
                if (exclusiveDeletionRight <= left) {
                    // deletion before selection - move
                    this.moveX(-deletionCount);
                    return true;
                } else {
                    if (exclusiveDeletionRight < exclusiveRight) {
                        // deletion before and into selection - move and shrink
                        this.moveX(deletionLeft - left);
                        this.growFromLeft(left - exclusiveDeletionRight);
                        return true;
                    } else {
                        // deletion covers all of selection
                        return null;
                    }
                }
            } else {
                if (exclusiveDeletionRight <= exclusiveRight) {
                    // deletion within selection - shrink
                    this.growFromLeft(-deletionCount);
                    return true;
                } else {
                    // deletion from within selection and beyond - shrink
                    this.growFromLeft(deletionLeft - exclusiveRight);
                    return true;
                }
            }
        }
    }

    /** Adjusts the selection to where it would be after a rows deletion.
     * @returns true if selection changed, false if it was not changed or null if it should be fully deleted
     */
    adjustForYRangeDeleted(deletionTop: number, deletionCount: number): boolean | null {
        const top = this._y;
        const height = this.height;
        const exclusiveBottom = top + height;
        if (deletionTop >= exclusiveBottom || deletionCount === 0) {
            // deletion after selection or nothing was deleted
            return false;
        } else {
            const exclusiveDeletionBottom = deletionTop + deletionCount;
            if (deletionTop <= top) {
                if (exclusiveDeletionBottom <= top) {
                    // deletion before selection - move
                    this.moveY(-deletionCount);
                    return true;
                } else {
                    if (exclusiveDeletionBottom < exclusiveBottom) {
                        // deletion before and into selection - move and shrink
                        this.moveY(deletionTop - top);
                        this.growFromTop(top - exclusiveDeletionBottom);
                        return true;
                    } else {
                        // deletion covers all of selection
                        return null;
                    }
                }
            } else {
                if (exclusiveDeletionBottom <= exclusiveBottom) {
                    // deletion within selection - shrink
                    this.growFromTop(-deletionCount);
                    return true;
                } else {
                    // deletion from within selection and beyond - shrink
                    this.growFromTop(deletionTop - exclusiveBottom);
                    return true;
                }
            }
        }
    }

    adjustForXRangeMoved(oldIndex: number, newIndex: number, count: number) {
        // this could probably be better optimised
        this.adjustForXRangeDeleted(oldIndex, count);
        this.adjustForXRangeInserted(newIndex, count);
    }

    adjustForYRangeMoved(oldIndex: number, newIndex: number, count: number) {
        // this could probably be better optimised
        this.adjustForYRangeDeleted(oldIndex, count);
        this.adjustForYRangeInserted(newIndex, count);
    }
}

/** @public */
export namespace RevCornerRectangle {
    export function arrayContainsPoint(rectangles: RevCornerRectangle[], x: number, y: number) {
        for (const rectangle of rectangles) {
            if (rectangle.containsXY(x, y)) {
                return true;
            }
        }
        return false;
    }
}
