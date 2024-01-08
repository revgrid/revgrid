import { DatalessViewCell } from '../dataless/dataless-view-cell';
import { ViewLayoutColumn } from '../dataless/view-layout-column';
import { SchemaField } from '../schema/schema-field';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { DataServer } from './data-server';
import { Subgrid } from './subgrid';
import { ViewLayoutRow } from './view-layout-row';

/** @public */
export interface ViewCell<BCS extends BehavioredColumnSettings, SF extends SchemaField> extends DatalessViewCell<BCS, SF> {
    readonly subgrid: Subgrid<BCS, SF>;
    readonly viewLayoutColumn: ViewLayoutColumn<BCS, SF>;
    readonly viewLayoutRow: ViewLayoutRow<BCS, SF>;

    readonly viewValue: DataServer.ViewValue;
}

/** @public */
export namespace ViewCell {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    export import sameByDataPoint = DatalessViewCell.sameByDataPoint;
}
