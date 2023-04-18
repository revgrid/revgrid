import { Corner, calculateCornerFromWidthHeight } from './corner';
import { Point } from './point';
import { Rectangle } from './rectangle';
import { UnreachableCaseError } from './revgrid-error';

/** @public */
export class FirstCornerRectangle extends Rectangle {
    readonly firstCorner: Corner;

    constructor(firstExclusiveX: number, firstExclusiveY: number, width: number, height: number) {
        super(firstExclusiveX, firstExclusiveY, width, height);
        this.firstCorner = calculateCornerFromWidthHeight(width, height);
    }

    /** The first (exclusive) point specified in a rectangle */
    get exclusiveFirst(): Point {
        switch (this.firstCorner) {
            case Corner.TopLeft: return { x: this.topLeft.x, y: this.topLeft.y };
            case Corner.TopRight: return { x: this.exclusiveBottomRight.x, y: this.topLeft.y };
            case Corner.BottomRight: return { x: this.exclusiveBottomRight.x, y: this.exclusiveBottomRight.y };
            case Corner.BottomLeft: return { x: this.topLeft.x, y: this.exclusiveBottomRight.y };
            default:
                throw new UnreachableCaseError('FCRF55598', this.firstCorner);
        }
    }

    /** The first (inclusive) point specified in a rectangle */
    get inclusiveFirst(): Point {
        switch (this.firstCorner) {
            case Corner.TopLeft: return { x: this.topLeft.x, y: this.topLeft.y };
            case Corner.TopRight: return { x: this.inclusiveBottomRight.x, y: this.topLeft.y };
            case Corner.BottomRight: return { x: this.inclusiveBottomRight.x, y: this.inclusiveBottomRight.y };
            case Corner.BottomLeft: return { x: this.topLeft.x, y: this.inclusiveBottomRight.y };
            default:
                throw new UnreachableCaseError('FCRF55598', this.firstCorner);
        }
    }

    /** The last point specified in a rectangle */
    get exclusiveLast(): Point {
        switch (this.firstCorner) {
            case Corner.TopLeft: return { x: this.exclusiveBottomRight.x, y: this.exclusiveBottomRight.y };
            case Corner.TopRight: return { x: this.topLeft.x, y: this.exclusiveBottomRight.y };
            case Corner.BottomRight: return { x: this.topLeft.x, y: this.topLeft.y };
            case Corner.BottomLeft: return { x: this.exclusiveBottomRight.x, y: this.topLeft.y };
            default:
                throw new UnreachableCaseError('FCRL55598', this.firstCorner);
        }
    }

    /** The last point specified in a rectangle */
    get inclusiveLast(): Point {
        switch (this.firstCorner) {
            case Corner.TopLeft: return { x: this.inclusiveBottomRight.x, y: this.inclusiveBottomRight.y };
            case Corner.TopRight: return { x: this.topLeft.x, y: this.inclusiveBottomRight.y };
            case Corner.BottomRight: return { x: this.topLeft.x, y: this.topLeft.y };
            case Corner.BottomLeft: return { x: this.inclusiveBottomRight.x, y: this.topLeft.y };
            default:
                throw new UnreachableCaseError('FCRL55598', this.firstCorner);
        }
    }

    override createCopy() {
        const { x, y, width, height } = FirstCornerRectangle.calculateXYWidthHeightForCorner(this.x, this.y, this.width, this.height, this.firstCorner);
        return new FirstCornerRectangle(x, y, width, height);
    }
}

export namespace FirstCornerRectangle {
    export interface CornerAdjustedXYWidthHeight {
        readonly x: number;
        readonly y: number;
        readonly width: number;
        readonly height: number;
    }

    export function calculateXYWidthHeightForCorner(left: number, top: number, width: number, height: number, corner: Corner): CornerAdjustedXYWidthHeight {
        let x: number;
        let y: number;

        switch (corner) {
            case Corner.TopLeft: {
                x = left;
                y = top;
                break;
            }
            case Corner.TopRight: {
                x = left - width + 1;
                y = top;
                width = -width;
                break;
            }
            case Corner.BottomRight: {
                x = left - width + 1;
                y = top - height + 1;
                width = -width;
                height = -height;
                break;
            }
            case Corner.BottomLeft: {
                x = left;
                y = top - height + 1;
                height = -height;
                break;
            }
            default:
                throw new UnreachableCaseError('FCRCXYWHFC77665', corner);
        }

        return {
            x,
            y,
            width,
            height,
        }
    }
}
