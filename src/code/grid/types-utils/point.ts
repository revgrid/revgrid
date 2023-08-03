/**
 * @desc This object represents a single point in an abstract 2-dimensional matrix.
 *
 * The unit of measure is typically pixels.
 * (If used to model computer graphics, vertical coordinates are typically measured downwards
 * from the top of the window. This convention however is not inherent in this object.)
 */

import { Writable } from './types';
import { calculateAdjustmentForRangeMoved } from './utils';

/** @public */
export interface Point {
    /** This point's horizontal coordinate */
    readonly x: number,
    /** This point's vertical coordinate */
    readonly y: number,
}

/** @public */
export namespace Point {
    export function create(x: number, y: number): Point {
        return {
            x,
            y
        };
    }

    export function copy(other: Point) {
        return {
            x: other.x,
            y: other.y,
        };
    }

    /**
     * @returns A new point which is the reference point's position increased by coordinates of given `offset`.
     * @param offset - Horizontal and vertical values to add to this point's coordinates.
     */
    export function plus(referencePoint: Point, offset: Point): Point {
        return create(
            referencePoint.x + offset.x,
            referencePoint.y + offset.y
        );
    }

    /**
     * @returns A new point which is this point's position increased by given offsets.
     * @param offsetX - Value to add to this point's horizontal coordinate.
     * @param offsetY - Value to add to this point's horizontal coordinate.
     */
    export function plusXY(referencePoint: Point, offsetX = 0, offsetY = 0): Point {
        return create(
            referencePoint.x + offsetX,
            referencePoint.y + offsetY
        );
    }

    /**
     * @returns A new point which is this point's position decreased by coordinates of given `offset`.
     * @param offset - Horizontal and vertical values to subtract from this point's coordinates.
     */
    export function minus(referencePoint: Point, offset: Point): Point {
        return create(
            referencePoint.x - offset.x,
            referencePoint.y - offset.y
        );
    }

    /**
     * @returns A new `Point` positioned to least x and least y of this point and given `offset`.
     * @param point - A point to compare to this point.
     */
    export function min(referencePoint: Point, point: Point): Point {
        return create(
            Math.min(referencePoint.x, point.x),
            Math.min(referencePoint.y, point.y)
        );
    }

    /**
     * @returns A new `Point` positioned to greatest x and greatest y of this point and given `point`.
     * @param point - A point to compare to this point.
     */
    export function max(referencePoint: Point, point: Point): Point {
        return create(
            Math.max(referencePoint.x, point.x),
            Math.max(referencePoint.y, point.y)
        );
    }

    /**
     * @returns Distance between given `point` and this point using Pythagorean Theorem formula.
     * @param point - A point from which to compute the distance to this point.
     */
    export function distance(referencePoint: Point, point: Point): number {
        const deltaX = point.x - referencePoint.x;
        const deltaY = point.y - referencePoint.y;

        return Math.sqrt(
            deltaX * deltaX +
            deltaY * deltaY
        );
    }

    /**
     * _(Formerly: `equal`.)_
     * @returns `true` iff _both_ coordinates of this point are exactly equal to those of given `point`.
     * @param point - A point to compare to this point.
     */
    export function isEqual(referencePoint: Point, point: Point | undefined): boolean {
        if (point) {
            const result =
                referencePoint.x === point.x &&
                referencePoint.y === point.y;
            return result;
        } else {
            return false;
        }
    }

    /**
     * @returns `true` iff _both_ coordinates of this point are greater than those of given `point`.
     * @param point - A point to compare to this point
     */
    export function greaterThan(referencePoint: Point, point: Point): boolean {
        return (
            referencePoint.x > point.x &&
            referencePoint.y > point.y
        );
    }

    /**
     * @returns `true` iff _both_ coordinates of this point are less than those of given `point`.
     * @param point - A point to compare to this point
     */
    export function lessThan(referencePoint: Point, point: Point): boolean {
        return (
            referencePoint.x < point.x &&
            referencePoint.y < point.y
        );
    }

    /**
     * _(Formerly `greaterThanEqualTo`.)_
     * @returns `true` iff _both_ coordinates of this point are greater than or equal to those of given `point`.
     * @param point - A point to compare to this point
     */
    export function greaterThanOrEqualTo(referencePoint: Point, point: Point): boolean {
        return (
            referencePoint.x >= point.x &&
            referencePoint.y >= point.y
        );
    }

    /**
     * _(Formerly `lessThanEqualTo`.)_
     * @returns `true` iff _both_ coordinates of this point are less than or equal to those of given `point`.
     * @param point - A point to compare to this point.
     */
    export function lessThanOrEqualTo(referencePoint: Point, point: Point): boolean {
        return (
            referencePoint.x <= point.x &&
            referencePoint.y <= point.y
        );
    }

    export function moveX(point: Point, offset: number) {
        (point as WritablePoint).x += offset;
    }

    export function moveY(point: Point, offset: number) {
        (point as WritablePoint).y += offset;
    }

    export function adjustForXRangeInserted(point: Point, insertionIndex: number, insertionCount: number) {
        if (insertionIndex <= point.x) {
            moveX(point, insertionCount);
        }
    }

    export function adjustForYRangeInserted(point: Point, insertionIndex: number, insertionCount: number) {
        if (insertionIndex <= point.y) {
            moveY(point, insertionCount);
        }
    }

    export function adjustForXRangeDeleted(point: Point, deletionIndex: number, deletionCount: number): number | undefined {
        const pointX = point.x;
        if (pointX < deletionIndex) {
            return undefined;
        } else {
            const positionInDeletionRange = pointX - deletionIndex;
            if (positionInDeletionRange < deletionCount) {
                moveX(point, -positionInDeletionRange);
                return positionInDeletionRange;
            } else {
                moveX(point, -deletionCount);
                return undefined;
            }
        }
    }

    export function adjustForYRangeDeleted(point: Point, deletionIndex: number, deletionCount: number): number | undefined {
        const pointY = point.y;
        if (pointY < deletionIndex) {
            return undefined;
        } else {
            const positionInDeletionRange = pointY - deletionIndex;
            if (positionInDeletionRange < deletionCount) {
                moveY(point, -positionInDeletionRange);
                return positionInDeletionRange;
            } else {
                moveY(point, -deletionCount);
                return undefined;
            }
        }
    }

    export function adjustForXRangeMoved(point: Point, oldIndex: number, newIndex: number, count: number) {
        const adjustment = calculateAdjustmentForRangeMoved(point.x, oldIndex, newIndex, count);
        if (adjustment !== 0) {
            moveX(point, adjustment);
        }
    }

    export function adjustForYRangeMoved(point: Point, oldIndex: number, newIndex: number, count: number) {
        const adjustment = calculateAdjustmentForRangeMoved(point.y, oldIndex, newIndex, count);
        if (adjustment !== 0) {
            moveY(point, adjustment);
        }
    }
}

/** @public */
export type WritablePoint = Writable<Point>

/** @public */
export namespace WritablePoint {
    export function create(x: number, y: number): WritablePoint {
        return {
            x,
            y
        }
    }
}

/** @public */
export type PartialPoint = Partial<Point>

/** @public */
export namespace PartialPoint {
    export function create(x: number | undefined, y: number | undefined): PartialPoint {
        return {
            x,
            y,
        }
    }
}
