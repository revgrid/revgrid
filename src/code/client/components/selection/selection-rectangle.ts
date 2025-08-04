import { RevSchemaField, RevSelectionAreaTypeId } from '../../../common';
import { RevSubgrid } from '../../interfaces';
import { RevBehavioredColumnSettings } from '../../settings';
import { RevFirstCornerRectangle } from './first-corner-rectangle';
import { RevSelectionArea } from './selection-area';

/** @public */
export class RevSelectionRectangle<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevFirstCornerRectangle implements RevSelectionArea<BCS, SF> {
    readonly areaTypeId = RevSelectionAreaTypeId.rectangle;

    constructor(
        leftOrExRight: number, topOrExBottom: number, width: number, height: number,
        readonly subgrid: RevSubgrid<BCS, SF>
    ) {
        super(leftOrExRight, topOrExBottom, width, height);
    }

    get size() {
        return this.area;
    }

    override createCopy() {
        const { x, y, width, height } = RevFirstCornerRectangle.createExclusiveRectangle(this.x, this.y, this.width, this.height, this.firstCorner);
        return new RevSelectionRectangle(x, y, width, height, this.subgrid);
    }
}
