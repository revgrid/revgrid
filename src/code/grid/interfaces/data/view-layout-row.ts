import { DatalessViewLayoutRow } from '../dataless/dataless-view-layout-row';
import { MergableColumnSettings } from '../settings/mergable-column-settings';
import { Subgrid } from './subgrid';

export interface ViewLayoutRow<MCS extends MergableColumnSettings> extends DatalessViewLayoutRow {
    /** The subgrid to which the row belongs. */
    subgrid: Subgrid<MCS>;
}
