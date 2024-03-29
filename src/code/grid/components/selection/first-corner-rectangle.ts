import { InexclusiveRectangle } from '../../types-utils/inexclusive-rectangle';
import { Point } from '../../types-utils/point';
import { RevUnreachableCaseError } from '../../types-utils/revgrid-error';
import { FirstCornerArea } from './first-corner-area';

/** @public */
export class FirstCornerRectangle extends InexclusiveRectangle implements FirstCornerArea {
    readonly firstCorner: FirstCornerArea.Corner;

    constructor(firstInexclusiveX: number, firstInexclusiveY: number, width: number, height: number) {
        super(firstInexclusiveX, firstInexclusiveY, width, height);
        this.firstCorner = FirstCornerArea.calculateCornerFromWidthHeight(width, height);
    }

    /** The first (exclusive) point specified in a rectangle */
    get exclusiveFirst(): Point {
        switch (this.firstCorner) {
            case FirstCornerArea.Corner.TopLeft: return { x: this.topLeft.x, y: this.topLeft.y };
            case FirstCornerArea.Corner.TopRight: return { x: this.exclusiveBottomRight.x, y: this.topLeft.y };
            case FirstCornerArea.Corner.BottomRight: return { x: this.exclusiveBottomRight.x, y: this.exclusiveBottomRight.y };
            case FirstCornerArea.Corner.BottomLeft: return { x: this.topLeft.x, y: this.exclusiveBottomRight.y };
            default:
                throw new RevUnreachableCaseError('FCRF55598', this.firstCorner);
        }
    }

    /** The first (inclusive) point specified in a rectangle */
    get inclusiveFirst(): Point {
        switch (this.firstCorner) {
            case FirstCornerArea.Corner.TopLeft: return { x: this.topLeft.x, y: this.topLeft.y };
            case FirstCornerArea.Corner.TopRight: return { x: this.inclusiveBottomRight.x, y: this.topLeft.y };
            case FirstCornerArea.Corner.BottomRight: return { x: this.inclusiveBottomRight.x, y: this.inclusiveBottomRight.y };
            case FirstCornerArea.Corner.BottomLeft: return { x: this.topLeft.x, y: this.inclusiveBottomRight.y };
            default:
                throw new RevUnreachableCaseError('FCRF55598', this.firstCorner);
        }
    }

    /** The last point specified in a rectangle */
    get exclusiveLast(): Point {
        switch (this.firstCorner) {
            case FirstCornerArea.Corner.TopLeft: return { x: this.exclusiveBottomRight.x, y: this.exclusiveBottomRight.y };
            case FirstCornerArea.Corner.TopRight: return { x: this.topLeft.x, y: this.exclusiveBottomRight.y };
            case FirstCornerArea.Corner.BottomRight: return { x: this.topLeft.x, y: this.topLeft.y };
            case FirstCornerArea.Corner.BottomLeft: return { x: this.exclusiveBottomRight.x, y: this.topLeft.y };
            default:
                throw new RevUnreachableCaseError('FCRL55598', this.firstCorner);
        }
    }

    /** The last point specified in a rectangle */
    get inclusiveLast(): Point {
        switch (this.firstCorner) {
            case FirstCornerArea.Corner.TopLeft: return { x: this.inclusiveBottomRight.x, y: this.inclusiveBottomRight.y };
            case FirstCornerArea.Corner.TopRight: return { x: this.topLeft.x, y: this.inclusiveBottomRight.y };
            case FirstCornerArea.Corner.BottomRight: return { x: this.topLeft.x, y: this.topLeft.y };
            case FirstCornerArea.Corner.BottomLeft: return { x: this.inclusiveBottomRight.x, y: this.topLeft.y };
            default:
                throw new RevUnreachableCaseError('FCRL55598', this.firstCorner);
        }
    }

    override createCopy() {
        const { x, y, width, height } = FirstCornerRectangle.calculateXYWidthHeightForCorner(this.x, this.y, this.width, this.height, this.firstCorner);
        return new FirstCornerRectangle(x, y, width, height);
    }
}

/** @public */
export namespace FirstCornerRectangle {
    export interface CornerAdjustedXYWidthHeight {
        readonly x: number;
        readonly y: number;
        readonly width: number;
        readonly height: number;
    }

    export function calculateXYWidthHeightForCorner(left: number, top: number, width: number, height: number, corner: FirstCornerArea.Corner): CornerAdjustedXYWidthHeight {
        let x: number;
        let y: number;

        switch (corner) {
            case FirstCornerArea.Corner.TopLeft: {
                x = left;
                y = top;
                break;
            }
            case FirstCornerArea.Corner.TopRight: {
                x = left - width + 1;
                y = top;
                width = -width;
                break;
            }
            case FirstCornerArea.Corner.BottomRight: {
                x = left - width + 1;
                y = top - height + 1;
                width = -width;
                height = -height;
                break;
            }
            case FirstCornerArea.Corner.BottomLeft: {
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
