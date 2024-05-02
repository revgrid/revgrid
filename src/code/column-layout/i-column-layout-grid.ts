// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevBehavioredColumnSettings, RevBehavioredGridSettings } from '../client/internal-api';
import { RevSchemaField } from '../common/internal-api';
import { RevColumnLayoutGrid } from './column-layout-grid';

/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RevIColumnLayoutGrid<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevColumnLayoutGrid<BGS, BCS, SF> {

}
