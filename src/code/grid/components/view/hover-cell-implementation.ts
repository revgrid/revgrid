import { HoverCell } from '../../interfaces/data/hover-cell';
import { MergableColumnSettings } from '../../interfaces/settings/mergable-column-settings';
import { MergableGridSettings } from '../../interfaces/settings/mergable-grid-settings';
import { ViewCellImplementation } from './view-cell-implementation';

/** Includes left line and top line (where possible) so that a hover cell can always be identified when the mouse is over a grid */
export class HoverCellImplementation<MGS extends MergableGridSettings, MCS extends MergableColumnSettings> extends ViewCellImplementation<MGS, MCS> implements HoverCell<MCS> {
    mouseOverLeftLine: boolean;
    mouseOverTopLine: boolean;

    isMouseOverLine() {
        return this.mouseOverLeftLine || this.mouseOverTopLine;
    }
}

