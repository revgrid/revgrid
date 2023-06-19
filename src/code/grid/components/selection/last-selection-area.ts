import { SelectionAreaType } from '../../types-utils/types';
import { FirstCornerRectangle } from './first-corner-rectangle';
import { SelectionArea } from './selection-area';

export class LastSelectionArea extends FirstCornerRectangle implements SelectionArea {
    constructor(
        readonly areaType: SelectionAreaType,
        firstInexclusiveX: number, firstInexclusiveY: number, width: number, height: number,
    ) {
        super(firstInexclusiveX, firstInexclusiveY, width, height);
    }

    get size() { return this.area; }
}
