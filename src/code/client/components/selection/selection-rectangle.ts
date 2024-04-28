import { RevSelectionAreaTypeId } from '../../types-utils/selection-area-type';
import { RevFirstCornerRectangle } from './first-corner-rectangle';
import { RevSelectionArea } from './selection-area';

/** @public */
export class RevSelectionRectangle extends RevFirstCornerRectangle implements RevSelectionArea {
    readonly areaTypeId = RevSelectionAreaTypeId.rectangle;

    override createCopy() {
        const { x, y, width, height } = RevFirstCornerRectangle.calculateXYWidthHeightForCorner(this.x, this.y, this.width, this.height, this.firstCorner);
        return new RevSelectionRectangle(x, y, width, height);
    }

    get size() {
        return this.area;
    }
}
