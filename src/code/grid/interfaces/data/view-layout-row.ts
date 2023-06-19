import { DatalessViewLayoutRow } from '../dataless/dataless-view-layout-row';
import { SchemaServer } from '../schema/schema-server';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { Subgrid } from './subgrid';

export interface ViewLayoutRow<BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> extends DatalessViewLayoutRow {
    /** The subgrid to which the row belongs. */
    subgrid: Subgrid<BCS, SF>;
}
