import { FirstCornerRectangle } from '../lib/first-corner-rectangle';
import { SelectionArea } from '../lib/selection-area';

/** @public */
export class SelectionRectangle extends FirstCornerRectangle implements SelectionArea {
    readonly areaType = SelectionArea.Type.Rectangle;

    constructor(firstExclusiveX: number, firstExclusiveY: number, width: number, height: number) {
        super(firstExclusiveX, firstExclusiveY, width, height);
    }

    override createCopy() {
        const { x, y, width, height } = FirstCornerRectangle.calculateXYWidthHeightForCorner(this.x, this.y, this.width, this.height, this.firstCorner);
        return new SelectionRectangle(x, y, width, height);
    }

    get size() {
        return this.area;
    }
}
