import { SchemaField } from '../schema/schema-field';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { Subgrid } from './subgrid';

/** @public */
export interface MainSubgrid<BCS extends BehavioredColumnSettings, SF extends SchemaField> extends Subgrid<BCS, SF> {

}
