import { DatalessViewCell } from '../dataless/dataless-view-cell';
import { SchemaServer } from '../schema/schema-server';
import { ViewLayoutColumn } from '../schema/view-layout-column';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { DataServer } from './data-server';
import { Subgrid } from './subgrid';
import { ViewLayoutRow } from './view-layout-row';

/** @public */
export interface ViewCell<BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> extends DatalessViewCell<BCS, SF> {
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
