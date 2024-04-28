import { RevInexclusiveRectangle } from '../../types-utils/inexclusive-rectangle';
import { RevPoint } from '../../types-utils/point';
import { RevUnreachableCaseError } from '../../types-utils/revgrid-error';
import { RevFirstCornerArea } from './first-corner-area';

/** @public */
export class RevFirstCornerRectangle extends RevInexclusiveRectangle implements RevFirstCornerArea {
    readonly firstCorner: RevFirstCornerArea.CornerId;

    constructor(firstInexclusiveX: number, firstInexclusiveY: number, width: number, height: number) {
        super(firstInexclusiveX, firstInexclusiveY, width, height);
        this.firstCorner = RevFirstCornerArea.Corner.calculateFromWidthHeight(width, height);
    }

    /** The first (exclusive) point specified in a rectangle */
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

    /** The first (inclusive) point specified in a rectangle */
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

    /** The last point specified in a rectangle */
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

    /** The last point specified in a rectangle */
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

    override createCopy() {
        const { x, y, width, height } = RevFirstCornerRectangle.calculateXYWidthHeightForCorner(this.x, this.y, this.width, this.height, this.firstCorner);
        return new RevFirstCornerRectangle(x, y, width, height);
    }
}

/** @public */
export namespace RevFirstCornerRectangle {
    export interface CornerAdjustedXYWidthHeight {
        readonly x: number;
        readonly y: number;
        readonly width: number;
        readonly height: number;
    }

    export function calculateXYWidthHeightForCorner(left: number, top: number, width: number, height: number, corner: RevFirstCornerArea.CornerId): CornerAdjustedXYWidthHeight {
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
