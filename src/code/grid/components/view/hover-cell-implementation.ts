import { HoverCell } from '../../interfaces/data/hover-cell';
import { ViewCellImplementation } from './view-cell-implementation';

/** Includes left line and top line (where possible) so that a hover cell can always be identified when the mouse is over a grid */
export class HoverCellImplementation extends ViewCellImplementation implements HoverCell {
    mouseOverLeftLine: boolean;
    mouseOverTopLine: boolean;

    isMouseOverLine() {
        return this.mouseOverLeftLine || this.mouseOverTopLine;
    }
}

