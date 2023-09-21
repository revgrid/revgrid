import { SchemaField } from '../schema/schema-field';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { Subgrid } from './subgrid';

/** @public */
export type MainSubgrid<BCS extends BehavioredColumnSettings, SF extends SchemaField> = Subgrid<BCS, SF>
