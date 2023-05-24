import { FirstCornerRectangle } from '../../lib/first-corner-rectangle';
import { SelectionArea } from '../../lib/selection-area';

export class LastSelectionArea extends FirstCornerRectangle implements SelectionArea {
    constructor(
        readonly areaType: SelectionArea.Type,
        firstInexclusiveX: number, firstInexclusiveY: number, width: number, height: number,
    ) {
        super(firstInexclusiveX, firstInexclusiveY, width, height);
    }

    get size() { return this.area; }
}
