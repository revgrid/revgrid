import { RevInexclusiveArea } from './inexclusive-area';
import { RevPoint } from './point';

/** @public */
export class RevInexclusiveRectangle implements RevInexclusiveArea {
    private _x: number;
    private _y: number;

    /**
     * Upper left corner of this rect.
     */
    private _topLeft: RevPoint;

    /**
     * this rect's width and height.
     * @remarks Unlike the other `Point` properties, `extent` is not a global coordinate pair; rather it consists of a _width_ (`x`, always positive) and a _height_ (`y`, always positive).
     *
     * This object might be more legitimately typed as something like `Area` with properties `width` and `height`; however we wanted it to be able to use it efficiently with a point's `plus` and `minus` methods (that is, without those methods having to check and branch on the type of its parameter).
     *
     * Created upon instantiation by the constructor.
     * @see The {@link RevInexclusiveRectangle#_exclusiveBottomRight|corner} method.
     */
    private _extent: RevPoint;

    /**
     * One pixel out from bottom right of rectangle.
     */
    private _exclusiveBottomRight: RevPoint;

    /**
     * This object represents a rectangular area within an abstract 2-dimensional matrix.
     *
     * @remarks
     * The unit of measure is typically pixels.
     * (If used to model computer graphics, vertical coordinates are typically measured downwards
     * from the top of the window. This convention however is not inherent in this object.)
     *
     * Normally, the `x` and `y` parameters to the constructor describe the upper left corner of the rect.
     * However, negative values of `width` and `height` will be added to the given `x` and `y`. That is,
     * a negative value of the `width` parameter will extend the rect to the left of the given `x` and
     * a negative value of the `height` parameter will extend the rect above the given `y`.
     * In any case, after instantiation the following are guaranteed to always be true:
     * * The `extent`, `width`, and `height` properties _always_ give positive values.
     * * The `origin`, `top`, and `left` properties _always_ reflect the upper left corner.
     * * The `corner`, `bottom`, and `right` properties _always_ reflect the lower right corner.
     *
     * Note: This object should be instantiated with the `new` keyword.
     *
     * @param inexclusiveX - Horizontal coordinate of some corner of the rect.
     * @param inexclusiveY - Vertical coordinate of some corner of the rect.
     * @param width - Width of the new rect. May be negative (see above).
     * @param height - Height of the new rect. May be negative (see above).
     */
    constructor(inexclusiveX: number, inexclusiveY: number, width: number, height: number) {
        let x: number;
        if (width >= 0) {
            x = inexclusiveX;
        } else {
            x = inexclusiveX + width;
            width = -width;
        }
        this._x = x;

        let y: number;
        if (height >= 0) {
            y = inexclusiveY;
        } else {
            y = inexclusiveY + height;
            height = -height;
        }
        this._y = y;

        this._topLeft = RevPoint.create(x, y);
        this._extent = RevPoint.create(width, height);
        this._exclusiveBottomRight = RevPoint.create(x + width, y + height);
    }

    get x() { return this._x; }
    get y() { return this._y; }
    get topLeft() { return this._topLeft; }
    get exclusiveBottomRight() { return this._exclusiveBottomRight; }
    get inclusiveBottomRight(): RevPoint {
        return { x: this._exclusiveBottomRight.x - 1, y: this._exclusiveBottomRight.y - 1 };
    }
    get extent() { return this._extent; }

    /**
     * Minimum vertical coordinate of this rect.
     */
    get top() {
        return this._y;
    }

    /**
     * Minimum horizontal coordinate of this rect.
     */
    get left() {
        return this._x;
    }

    get inclusiveBottom() {
        return this._exclusiveBottomRight.y - 1;
    }

    get exclusiveBottom() {
        return this._exclusiveBottomRight.y;
    }

    get inclusiveRight() {
        return this._exclusiveBottomRight.x - 1;
    }

    /**
     * For exclusive, maximum horizontal coordinate of this rect + 1.
     * For inclusive, maximum horizontal coordinate of this rect.
     */
    get exclusiveRight() {
        return this._exclusiveBottomRight.x;
    }

    /**
     * Width of this rect (always positive).
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
     * Area of this rect.
     */
    get area() {
        return this.width * this.height;
    }

    createCopy() {
        return new RevInexclusiveRectangle(this._x, this._y, this._extent.x, this._extent.y);
    }

    /**
     * @returns `true` iff given `point` entirely contained within this rect.
     * @param pointOrRect - The point or rect to test for containment.
     */
    containsPoint(point: RevPoint): boolean {
        return this.containsXY(point.x, point.y);
    }

    containsXY(x: number, y: number) {
        const topLeftX = this._topLeft.x;
        const topLeftY = this._topLeft.y;

        return (
            x >= topLeftX &&
            y >= topLeftY &&
            x < topLeftX + this._extent.x &&
            y < topLeftY + this._extent.y
        );
    }

    containsX(x: number) {
        const topLeftX = this._topLeft.x;
        return (x >= topLeftX && x < topLeftX + this._extent.x);
    }

    containsY(y: number) {
        const topLeftY = this._topLeft.y;
        return (y >= topLeftY && y < topLeftY + this._extent.y);
    }

    /**
     * _(Formerly `isContainedWithinRectangle`.)_
     * @returns {boolean} `true` iff `this` rect is entirely contained within given `rect`.
     * @param {RevInexclusiveRectangle} rect - Rectangle to test against this rect.
     */
    within(rect: RevInexclusiveRectangle): boolean {
        return (
            RevPoint.lessThanOrEqualTo(rect._topLeft, this._topLeft) &&
            RevPoint.greaterThanOrEqualTo(rect._exclusiveBottomRight, this._exclusiveBottomRight)
        );
    }

    /** Moves this Rectangle in x direction */
    moveX(offset: number) {
        this._x += offset;
        RevPoint.moveX(this.topLeft, offset);
        RevPoint.moveX(this.exclusiveBottomRight, offset);
    }

    /** Moves this Rectangle in y direction */
    moveY(offset: number) {
        this._y += offset;
        RevPoint.moveY(this.topLeft, offset);
        RevPoint.moveY(this.exclusiveBottomRight, offset);
    }

    /** Grows this Rectangle in x direction with let staying fixed */
    growFromLeft(widthIncrease: number) {
        RevPoint.moveX(this._extent, widthIncrease);
        RevPoint.moveX(this._exclusiveBottomRight, widthIncrease);
    }

    /** Grows this Rectangle in y direction with top staying fixed */
    growFromTop(heightIncrease: number) {
        RevPoint.moveY(this._extent, heightIncrease);
        RevPoint.moveY(this._exclusiveBottomRight, heightIncrease);
    }

    /**
     * @returns A copy of this rect but with horizontal position reset to given `x` and no width.
     * @param x - Horizontal coordinate of the new rect.
     */
    newXFlattened(x: number): RevInexclusiveRectangle {
        return new RevInexclusiveRectangle(x, this._topLeft.y, 0, this._extent.y);
    }

    /**
     * @returns A copy of this rect but with vertical position reset to given `y` and no height.
     * @param y - Vertical coordinate of the new rect.
     */
    newYFlattened(y: number): RevInexclusiveRectangle {
        return new RevInexclusiveRectangle(this._topLeft.x, y, this._extent.x, 0);
    }

    newXMoved(xOffset: number): RevInexclusiveRectangle {
        return new RevInexclusiveRectangle(this._x + xOffset, this._y, this.width, this.height);
    }

    newYMoved(yOffset: number): RevInexclusiveRectangle {
        return new RevInexclusiveRectangle(this._x, this._y + yOffset, this.width, this.height);
    }

    /**
     * _(Formerly: `insetBy`.)_
     * @returns That is enlarged/shrunk by given `padding`.
     * @param padding - Amount by which to increase (+) or decrease (-) this rect
     * @see The {@link RevInexclusiveRectangle#newShrunkFromCenter|shrinkBy} method.
     */
    newGrownFromCenter(padding: number): RevInexclusiveRectangle {
        return new RevInexclusiveRectangle(
            this._x - padding,
            this._y - padding,
            this.width + 2 * padding,
            this.height + 2 * padding);
    }

    /**
     * @returns {RevInexclusiveRectangle} That is enlarged/shrunk by given `padding`.
     * @param {number} padding - Amount by which to decrease (+) or increase (-) this rect.
     * @see The {@link RevInexclusiveRectangle#newGrownFromCenter|growBy} method.
     */
    newShrunkFromCenter(padding: number): RevInexclusiveRectangle {
        return this.newGrownFromCenter(-padding);
    }

    /**
     * @returns {RevInexclusiveRectangle} Bounding rect that contains both this rect and the given `rect`.
     * @param {RevInexclusiveRectangle} rect - The rectangle to union with this rect.
     */
    newUnioned(rect: RevInexclusiveRectangle): RevInexclusiveRectangle {
        const origin = RevPoint.min(this._topLeft, rect._topLeft);
        const corner = RevPoint.max(this._exclusiveBottomRight, rect._exclusiveBottomRight);
        const extent = RevPoint.minus(corner, origin);

        return new RevInexclusiveRectangle(
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
     * @returns {RevInexclusiveRectangle} One of:
     * * _If this rect intersects with the given `rect`:_
     *      a new rect representing that intersection.
     * * _If it doesn't intersect and `ifNoneAction` defined:_
     *      result of calling `ifNoneAction`.
     * * _If it doesn't intersect and `ifNoneAction` undefined:_
     *      `null`.
     * @param {RevInexclusiveRectangle} rect - The rectangle to intersect with this rect.
     * @param {function(RevInexclusiveRectangle)} [ifNoneAction] - When no intersection, invoke and return result.
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
     * @returns {boolean} `true` iff this rect overlaps with given `rect`.
     * @param {RevInexclusiveRectangle} rect - The rectangle to intersect with this rect.
     */
    intersects(rect: RevInexclusiveRectangle): boolean {
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

    adjustForYRangeMoved(oldIndex: number, newIndex: number, count: number) {
        // this could probably be better optimised
        this.adjustForYRangeDeleted(oldIndex, count);
        this.adjustForYRangeInserted(newIndex, count);
    }

    adjustForXRangeMoved(oldIndex: number, newIndex: number, count: number) {
        // this could probably be better optimised
        this.adjustForXRangeDeleted(oldIndex, count);
        this.adjustForXRangeInserted(newIndex, count);
    }
}

/** @public */
export namespace RevInexclusiveRectangle {
    export function arrayContainsPoint(rectangles: RevInexclusiveRectangle[], x: number, y: number) {
        for (const rectangle of rectangles) {
            if (rectangle.containsXY(x, y)) {
                return true;
            }
        }
        return false;
    }
}
