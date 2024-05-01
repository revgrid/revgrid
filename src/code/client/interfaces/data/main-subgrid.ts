import { RevBehavioredColumnSettings } from '../../settings/internal-api';
import { RevSchemaField } from '../schema/schema-field';
import { RevSubgrid } from './subgrid';

/** @public */
export type RevMainSubgrid<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> = RevSubgrid<BCS, SF>
