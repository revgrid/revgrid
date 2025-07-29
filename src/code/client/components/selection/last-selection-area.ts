import { RevSelectionAreaTypeId } from '../../../common';
import { RevFirstCornerRectangle } from './first-corner-rectangle';
import { RevSelectionArea } from './selection-area';

/** @public */
export class RevLastSelectionArea extends RevFirstCornerRectangle implements RevSelectionArea {
    constructor(
        readonly areaTypeId: RevSelectionAreaTypeId,
        leftOrExRight: number, topOrExBottom: number, width: number, height: number,
    ) {
        super(leftOrExRight, topOrExBottom, width, height);
    }

    get size() { return this.area; }
}
