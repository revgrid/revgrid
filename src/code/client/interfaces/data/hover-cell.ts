import { SchemaField } from '../schema/schema-field';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { ViewCell } from './view-cell';

/** @public */
export interface LinedHoverCell<BCS extends BehavioredColumnSettings, SF extends SchemaField> {
    readonly viewCell: ViewCell<BCS, SF>;

    readonly mouseOverLeftLine: boolean;
    readonly mouseOverTopLine: boolean;
}

/** @public */
export namespace LinedHoverCell {
    export function isMouseOverLine<BCS extends BehavioredColumnSettings, SF extends SchemaField>(hoverCell: LinedHoverCell<BCS, SF>) {
        return hoverCell.mouseOverLeftLine || hoverCell.mouseOverTopLine;
    }
}
