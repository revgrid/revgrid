import { HoverCell } from '../../interfaces/data/hover-cell';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { ViewCellImplementation } from './view-cell-implementation';

/** Includes left line and top line (where possible) so that a hover cell can always be identified when the mouse is over a grid */
export class HoverCellImplementation<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings> extends ViewCellImplementation<BGS, BCS> implements HoverCell<BCS> {
    mouseOverLeftLine: boolean;
    mouseOverTopLine: boolean;

    isMouseOverLine() {
        return this.mouseOverLeftLine || this.mouseOverTopLine;
    }
}

