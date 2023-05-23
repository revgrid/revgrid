import { FirstCornerRectangle } from '../../lib/first-corner-rectangle';
import { SelectionArea } from '../../lib/selection-area';

export class LastSelectionArea extends FirstCornerRectangle implements SelectionArea {
    constructor(
        readonly areaType: SelectionArea.Type,
        firstExclusiveX: number, firstExclusiveY: number, width: number, height: number,
    ) {
        super(firstExclusiveX, firstExclusiveY, width, height);
    }

    get size() { return this.area; }
}
