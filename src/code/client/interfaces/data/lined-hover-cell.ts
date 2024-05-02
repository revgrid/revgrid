import { RevSchemaField } from '../../../common/internal-api';
import { RevBehavioredColumnSettings } from '../../settings/internal-api';
import { RevViewCell } from './view-cell';

/** @public */
export interface RevLinedHoverCell<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
    readonly viewCell: RevViewCell<BCS, SF>;

    readonly mouseOverLeftLine: boolean;
    readonly mouseOverTopLine: boolean;
}

/** @public */
export namespace RevLinedHoverCell {
    export function isMouseOverLine<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField>(hoverCell: RevLinedHoverCell<BCS, SF>) {
        return hoverCell.mouseOverLeftLine || hoverCell.mouseOverTopLine;
    }
}
