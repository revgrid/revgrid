import { RevSelectionAreaTypeId } from '../../../common/internal-api';
import { RevFirstCornerRectangle } from './first-corner-rectangle';
import { RevSelectionArea } from './selection-area';

/** @public */
export class RevSelectionRectangle extends RevFirstCornerRectangle implements RevSelectionArea {
    readonly areaTypeId = RevSelectionAreaTypeId.rectangle;

    get size() {
        return this.area;
    }

    override createCopy() {
        const { x, y, width, height } = RevFirstCornerRectangle.calculateXYWidthHeightForCorner(this.x, this.y, this.width, this.height, this.firstCorner);
        return new RevSelectionRectangle(x, y, width, height);
    }
}
