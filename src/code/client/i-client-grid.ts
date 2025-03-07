import { RevSchemaField } from '../common/internal-api';
import { RevClientGrid } from './client-grid';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings } from './settings/internal-api';

/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RevIClientGrid<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevClientGrid<BGS, BCS, SF> {

}
