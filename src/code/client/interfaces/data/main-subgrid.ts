import { RevSchemaField } from '../schema/schema-field';
import { RevBehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { RevSubgrid } from './subgrid';

/** @public */
export type RevMainSubgrid<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> = RevSubgrid<BCS, SF>
