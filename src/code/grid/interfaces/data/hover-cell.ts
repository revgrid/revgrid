import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { ViewCell } from './view-cell';

/** @public */
export interface HoverCell<BCS extends BehavioredColumnSettings> extends ViewCell<BCS> {
    mouseOverLeftLine: boolean;
    mouseOverTopLine: boolean;

    isMouseOverLine(): boolean;
}
