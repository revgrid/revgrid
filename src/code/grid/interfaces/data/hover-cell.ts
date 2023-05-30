import { ViewCell } from './view-cell';

/** @public */
export interface HoverCell extends ViewCell {
    mouseOverLeftLine: boolean;
    mouseOverTopLine: boolean;

    isMouseOverLine(): boolean;
}
