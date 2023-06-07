import { SchemaServer } from '../schema/schema-server';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { ViewCell } from './view-cell';

/** @public */
export interface LinedHoverCell<BCS extends BehavioredColumnSettings, SC extends SchemaServer.Column<BCS>> {
    readonly viewCell: ViewCell<BCS, SC>;

    readonly mouseOverLeftLine: boolean;
    readonly mouseOverTopLine: boolean;
}

/** @public */
export namespace LinedHoverCell {
    export function isMouseOverLine<BCS extends BehavioredColumnSettings, SC extends SchemaServer.Column<BCS>>(hoverCell: LinedHoverCell<BCS, SC>) {
        return hoverCell.mouseOverLeftLine || hoverCell.mouseOverTopLine;
    }
}
