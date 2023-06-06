import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { ViewCell } from './view-cell';

/** @public */
export interface LinedHoverCell<BCS extends BehavioredColumnSettings> {
    readonly viewCell: ViewCell<BCS>;

    readonly mouseOverLeftLine: boolean;
    readonly mouseOverTopLine: boolean;
}

/** @public */
export namespace LinedHoverCell {
    export function isMouseOverLine<BCS extends BehavioredColumnSettings>(hoverCell: LinedHoverCell<BCS>) {
        return hoverCell.mouseOverLeftLine || hoverCell.mouseOverTopLine;
    }
}
