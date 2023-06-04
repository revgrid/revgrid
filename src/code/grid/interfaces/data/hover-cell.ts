import { MergableColumnSettings } from '../settings/mergable-column-settings';
import { ViewCell } from './view-cell';

/** @public */
export interface HoverCell<MCS extends MergableColumnSettings> extends ViewCell<MCS> {
    mouseOverLeftLine: boolean;
    mouseOverTopLine: boolean;

    isMouseOverLine(): boolean;
}
