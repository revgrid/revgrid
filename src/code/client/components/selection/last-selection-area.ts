import { SelectionAreaTypeId } from '../../types-utils/selection-area-type';
import { FirstCornerRectangle } from './first-corner-rectangle';
import { SelectionArea } from './selection-area';

/** @public */
export class LastSelectionArea extends FirstCornerRectangle implements SelectionArea {
    constructor(
        readonly areaTypeId: SelectionAreaTypeId,
        firstInexclusiveX: number, firstInexclusiveY: number, width: number, height: number,
    ) {
        super(firstInexclusiveX, firstInexclusiveY, width, height);
    }

    get size() { return this.area; }
}
