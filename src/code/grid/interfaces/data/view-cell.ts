import { DatalessViewCell } from '../dataless/dataless-view-cell';
import { ViewLayoutColumn } from '../schema/view-layout-column';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { Subgrid } from './subgrid';
import { ViewLayoutRow } from './view-layout-row';

/** @public */
export interface ViewCell<BCS extends BehavioredColumnSettings> extends DatalessViewCell<BCS> {
    readonly subgrid: Subgrid<BCS>;
    readonly viewLayoutColumn: ViewLayoutColumn<BCS>;
    readonly viewLayoutRow: ViewLayoutRow<BCS>;
}

/** @public */
export namespace ViewCell {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    export import sameByDataPoint = DatalessViewCell.sameByDataPoint;
}
