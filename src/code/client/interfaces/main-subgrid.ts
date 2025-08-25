import { RevSchemaField } from '../../common';
import { RevBehavioredColumnSettings } from '../settings';
import { RevSubgrid } from './subgrid';

/** @public */
export interface RevMainSubgrid<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevSubgrid<BCS, SF> {
    readonly role: typeof RevSubgrid.Role.main;
    readonly isMain: true;
}
