import { RevSchemaField } from '../../common';
import { RevBehavioredColumnSettings } from '../settings/internal-api';
import { RevSubgrid } from './subgrid';

/** @public */
export type RevMainSubgrid<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> = RevSubgrid<BCS, SF>
