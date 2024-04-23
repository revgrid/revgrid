import { DatalessViewLayoutRow } from '../dataless/dataless-view-layout-row';
import { SchemaField } from '../schema/schema-field';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { Subgrid } from './subgrid';

/** @public */
export interface ViewLayoutRow<BCS extends BehavioredColumnSettings, SF extends SchemaField> extends DatalessViewLayoutRow {
    /** The subgrid to which the row belongs. */
    subgrid: Subgrid<BCS, SF>;
}
