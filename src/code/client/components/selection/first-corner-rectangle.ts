import { RevCornerRectangle, RevPoint, RevRectangle, RevUnreachableCaseError } from '../../../common';
import { RevFirstCornerArea } from './first-corner-area';

/**
 * Represents a rectangle with one corner designated as its first corner.
 *
 * @see RevCornerRectangle
 * @see RevFirstCornerArea
 * @public
 */
export class RevFirstCornerRectangle extends RevCornerRectangle implements RevFirstCornerArea {
    /**
     * The corner of the rectangle designated as its first corner.
     */
    readonly firstCorner: RevFirstCornerArea.CornerId;

    constructor(leftOrExRight: number, topOrExBottom: number, width: number, height: number) {
        super(leftOrExRight, topOrExBottom, width, height);
        this.firstCorner = RevFirstCornerArea.Corner.calculateFromWidthHeight(width, height);
    }

    /**
     * The exclusive first corner point in a rectangle.
     *
     * If the x and y coordinates respectively represent the right or bottom edge, the point is the first point outside the rectangle.
     */
    get exclusiveFirst(): RevPoint {
        switch (this.firstCorner) {
            case RevFirstCornerArea.CornerId.TopLeft: return { x: this.topLeft.x, y: this.topLeft.y };
            case RevFirstCornerArea.CornerId.TopRight: return { x: this.exclusiveBottomRight.x, y: this.topLeft.y };
            case RevFirstCornerArea.CornerId.BottomRight: return { x: this.exclusiveBottomRight.x, y: this.exclusiveBottomRight.y };
            case RevFirstCornerArea.CornerId.BottomLeft: return { x: this.topLeft.x, y: this.exclusiveBottomRight.y };
            default:
                throw new RevUnreachableCaseError('FCRF55598', this.firstCorner);
        }
    }

    /**
     * The inclusive first corner point in a rectangle.
     *
     * The x and y coordinates represent the edges of the rectangle.
     */
    get inclusiveFirst(): RevPoint {
        switch (this.firstCorner) {
            case RevFirstCornerArea.CornerId.TopLeft: return { x: this.topLeft.x, y: this.topLeft.y };
            case RevFirstCornerArea.CornerId.TopRight: return { x: this.inclusiveBottomRight.x, y: this.topLeft.y };
            case RevFirstCornerArea.CornerId.BottomRight: return { x: this.inclusiveBottomRight.x, y: this.inclusiveBottomRight.y };
            case RevFirstCornerArea.CornerId.BottomLeft: return { x: this.topLeft.x, y: this.inclusiveBottomRight.y };
            default:
                throw new RevUnreachableCaseError('FCRF55598', this.firstCorner);
        }
    }

    /**
     * The exclusive corner point opposite the first point in the rectangle.
     *
     * If the x and y coordinates respectively represent the right or bottom edge, the point is the first point outside the rectangle.
     */
    get exclusiveLast(): RevPoint {
        switch (this.firstCorner) {
            case RevFirstCornerArea.CornerId.TopLeft: return { x: this.exclusiveBottomRight.x, y: this.exclusiveBottomRight.y };
            case RevFirstCornerArea.CornerId.TopRight: return { x: this.topLeft.x, y: this.exclusiveBottomRight.y };
            case RevFirstCornerArea.CornerId.BottomRight: return { x: this.topLeft.x, y: this.topLeft.y };
            case RevFirstCornerArea.CornerId.BottomLeft: return { x: this.exclusiveBottomRight.x, y: this.topLeft.y };
            default:
                throw new RevUnreachableCaseError('FCRL55598', this.firstCorner);
        }
    }

    /**
     * The inclusive corner point opposite the first point in the rectangle.
     *
     * The x and y coordinates represent the edges of the rectangle.
     */
    get inclusiveLast(): RevPoint {
        switch (this.firstCorner) {
            case RevFirstCornerArea.CornerId.TopLeft: return { x: this.inclusiveBottomRight.x, y: this.inclusiveBottomRight.y };
            case RevFirstCornerArea.CornerId.TopRight: return { x: this.topLeft.x, y: this.inclusiveBottomRight.y };
            case RevFirstCornerArea.CornerId.BottomRight: return { x: this.topLeft.x, y: this.topLeft.y };
            case RevFirstCornerArea.CornerId.BottomLeft: return { x: this.inclusiveBottomRight.x, y: this.topLeft.y };
            default:
                throw new RevUnreachableCaseError('FCRL55598', this.firstCorner);
        }
    }

    /**
     * Creates a copy of the current `RevFirstCornerRectangle` instance.
     */
    override createCopy(): RevFirstCornerRectangle {
        const { x, y, width, height } = RevFirstCornerRectangle.createExclusiveRectangle(this.x, this.y, this.width, this.height, this.firstCorner);
        return new RevFirstCornerRectangle(x, y, width, height);
    }
}

/** @public */
export namespace RevFirstCornerRectangle {
    /**
     * Creates a rectangle based on the specified corner, ensuring exclusive bottom/right semantics.
     *
     * Depending on the `corner` parameter, the rectangle's origin (`x`, `y`) and dimensions (`width`, `height`)
     * are adjusted so that the rectangle is defined from the given corner and extends to the opposite side,
     * with coordinates and sizes normalized for exclusive bottom/right.
     *
     * @param left - The x-coordinate of the reference corner.
     * @param top - The y-coordinate of the reference corner.
     * @param width - The width of the rectangle (can be negative depending on the corner).
     * @param height - The height of the rectangle (can be negative depending on the corner).
     * @param corner - The corner from which the rectangle is being created. Should be one of the {@link RevFirstCornerArea.CornerId} enum values.
     */
    export function createExclusiveRectangle(left: number, top: number, width: number, height: number, corner: RevFirstCornerArea.CornerId): RevRectangle {
        let x: number;
        let y: number;

        switch (corner) {
            case RevFirstCornerArea.CornerId.TopLeft: {
                x = left;
                y = top;
                break;
            }
            case RevFirstCornerArea.CornerId.TopRight: {
                x = left - width + 1;
                y = top;
                width = -width;
                break;
            }
            case RevFirstCornerArea.CornerId.BottomRight: {
                x = left - width + 1;
                y = top - height + 1;
                width = -width;
                height = -height;
                break;
            }
            case RevFirstCornerArea.CornerId.BottomLeft: {
                x = left;
                y = top - height + 1;
                height = -height;
                break;
            }
            default:
                throw new RevUnreachableCaseError('FCRCXYWHFC77665', corner);
        }

        return {
            x,
            y,
            width,
            height,
        }
    }
}
