import { DatalessViewCell } from '../dataless/dataless-view-cell';
import { ViewLayoutColumn } from '../schema/view-layout-column';
import { Subgrid } from './subgrid';
import { ViewLayoutRow } from './view-layout-row';

/** @public */
export interface ViewCell extends DatalessViewCell {
    readonly subgrid: Subgrid;
    readonly viewLayoutColumn: ViewLayoutColumn;
    readonly viewLayoutRow: ViewLayoutRow;
}

/** @public */
export namespace ViewCell {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    export import sameByDataPoint = DatalessViewCell.sameByDataPoint;
}
