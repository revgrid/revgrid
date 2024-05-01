import { RevSelectionAreaTypeId } from '../../../common/internal-api';
import { RevFirstCornerRectangle } from './first-corner-rectangle';
import { RevSelectionArea } from './selection-area';

/** @public */
export class RevLastSelectionArea extends RevFirstCornerRectangle implements RevSelectionArea {
    constructor(
        readonly areaTypeId: RevSelectionAreaTypeId,
        firstInexclusiveX: number, firstInexclusiveY: number, width: number, height: number,
    ) {
        super(firstInexclusiveX, firstInexclusiveY, width, height);
    }

    get size() { return this.area; }
}
