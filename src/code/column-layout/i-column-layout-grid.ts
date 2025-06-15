import { RevBehavioredColumnSettings, RevBehavioredGridSettings } from '../client';
import { RevSchemaField } from '../common';
import { RevColumnLayoutGrid } from './column-layout-grid';

/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RevIColumnLayoutGrid<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevColumnLayoutGrid<BGS, BCS, SF> {

}
