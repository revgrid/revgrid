import { RevDataServer, RevSchemaField } from '../../../common/internal-api';
import { RevBehavioredColumnSettings } from '../../settings/internal-api';
import { RevDatalessViewCell } from '../dataless/dataless-view-cell';
import { RevViewLayoutColumn } from '../dataless/view-layout-column';
import { RevSubgrid } from './subgrid';
import { RevViewLayoutRow } from './view-layout-row';

/** @public */
export interface RevViewCell<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevDatalessViewCell<BCS, SF> {
    readonly subgrid: RevSubgrid<BCS, SF>;
    readonly viewLayoutColumn: RevViewLayoutColumn<BCS, SF>;
    readonly viewLayoutRow: RevViewLayoutRow<BCS, SF>;

    readonly viewValue: RevDataServer.ViewValue;
}

/** @public */
export namespace RevViewCell {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    export import sameByDataPoint = RevDatalessViewCell.sameByDataPoint;
}
