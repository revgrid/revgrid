import { RevSchemaField } from '../../../common/internal-api';
import { RevBehavioredColumnSettings } from '../../settings/internal-api';
import { RevSubgrid } from './subgrid';

/** @public */
export type RevMainSubgrid<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> = RevSubgrid<BCS, SF>
