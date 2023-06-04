import { DatalessViewCell } from '../dataless/dataless-view-cell';
import { ViewLayoutColumn } from '../schema/view-layout-column';
import { MergableColumnSettings } from '../settings/mergable-column-settings';
import { Subgrid } from './subgrid';
import { ViewLayoutRow } from './view-layout-row';

/** @public */
export interface ViewCell<MCS extends MergableColumnSettings> extends DatalessViewCell<MCS> {
    readonly subgrid: Subgrid<MCS>;
    readonly viewLayoutColumn: ViewLayoutColumn<MCS>;
    readonly viewLayoutRow: ViewLayoutRow<MCS>;
}

/** @public */
export namespace ViewCell {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    export import sameByDataPoint = DatalessViewCell.sameByDataPoint;
}
