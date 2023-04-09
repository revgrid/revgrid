import { InclusiveRectangle } from '../lib/inclusive-rectangle';
import { Point } from '../lib/point';
import { SelectionArea } from '../lib/selection-area';

/** @public */
export class SelectionRectangle extends InclusiveRectangle implements SelectionArea {
    readonly areaType = SelectionArea.Type.Rectangle;

    readonly first: Point;
    readonly last: Point;

    constructor(x: number, y: number, width: number, height: number) {
        super(x, y, width, height);

        this.first = Point.create(x, y);

        const oppositeX = x === this.origin.x ? this.corner.x : this.origin.x;
        const oppositeY = y === this.origin.y ? this.corner.y : this.origin.y;
        this.last = Point.create(oppositeX, oppositeY);
    }

    override createCopy() {
        // use firstSelectedCell and lastSelectedCell as these contain the original x and y values
        const firstX = this.first.x;
        const firstY = this.first.y;
        const lastX = this.last.x;
        const lastY = this.last.y;

        // increment width and height as this is creating an inclusive rectangle
        const width = lastX - firstX + 1;
        const height = lastY - firstY + 1;

        return new SelectionRectangle(firstX, firstY, width, height);
    }

    override moveX(offset: number) {
        super.moveX(offset);
        Point.moveX(this.first, offset);
        Point.moveX(this.last, offset);
    }

    override moveY(offset: number) {
        super.moveY(offset);
        Point.moveY(this.first, offset);
        Point.moveY(this.last, offset);
    }

    override growFromLeft(widthIncrease: number) {
        if (this.last.x === this.corner.x) {
            Point.moveX(this.last, widthIncrease)
        } else {
            Point.moveX(this.first, widthIncrease)
        }
        super.growFromLeft(widthIncrease);
    }

    override growFromTop(heightIncrease: number) {
        if (this.last.y === this.corner.y) {
            Point.moveY(this.last, heightIncrease)
        } else {
            Point.moveY(this.first, heightIncrease)
        }
        super.growFromTop(heightIncrease);
    }
}
