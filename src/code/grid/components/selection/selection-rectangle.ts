import { SelectionAreaTypeId } from '../../types-utils/selection-area-type';
import { FirstCornerRectangle } from './first-corner-rectangle';
import { SelectionArea } from './selection-area';

/** @public */
export class SelectionRectangle extends FirstCornerRectangle implements SelectionArea {
    readonly areaTypeId = SelectionAreaTypeId.rectangle;

    override createCopy() {
        const { x, y, width, height } = FirstCornerRectangle.calculateXYWidthHeightForCorner(this.x, this.y, this.width, this.height, this.firstCorner);
        return new SelectionRectangle(x, y, width, height);
    }

    get size() {
        return this.area;
    }
}
