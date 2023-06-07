import { DatalessViewCell } from '../dataless/dataless-view-cell';
import { SchemaServer } from '../schema/schema-server';
import { ViewLayoutColumn } from '../schema/view-layout-column';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { DataServer } from './data-server';
import { Subgrid } from './subgrid';
import { ViewLayoutRow } from './view-layout-row';

/** @public */
export interface ViewCell<BCS extends BehavioredColumnSettings, SC extends SchemaServer.Column<BCS>> extends DatalessViewCell<BCS, SC> {
    readonly subgrid: Subgrid<BCS, SC>;
    readonly viewLayoutColumn: ViewLayoutColumn<BCS, SC>;
    readonly viewLayoutRow: ViewLayoutRow<BCS, SC>;

    readonly value: DataServer.DataValue;
}

/** @public */
export namespace ViewCell {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    export import sameByDataPoint = DatalessViewCell.sameByDataPoint;
}
