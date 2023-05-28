import { SelectionAreaType } from '../../types-utils/types';
import { FirstCornerRectangle } from './first-corner-rectangle';
import { SelectionArea } from './selection-area';

/** @public */
export class SelectionRectangle extends FirstCornerRectangle implements SelectionArea {
    readonly areaType = SelectionAreaType.Rectangle;

    constructor(firstInexclusiveX: number, firstInexclusiveY: number, width: number, height: number) {
        super(firstInexclusiveX, firstInexclusiveY, width, height);
    }

    override createCopy() {
        const { x, y, width, height } = FirstCornerRectangle.calculateXYWidthHeightForCorner(this.x, this.y, this.width, this.height, this.firstCorner);
        return new SelectionRectangle(x, y, width, height);
    }

    get size() {
        return this.area;
    }
}
