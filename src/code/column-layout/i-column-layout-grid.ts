// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevSchemaField } from '../client/interfaces/schema/schema-field';
import { RevBehavioredColumnSettings } from '../client/interfaces/settings/behaviored-column-settings';
import { RevBehavioredGridSettings } from '../client/interfaces/settings/behaviored-grid-settings';
import { RevColumnLayoutGrid } from './column-layout-grid';

/** @internal */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RevIColumnLayoutGrid<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevColumnLayoutGrid<BGS, BCS, SF> {

}
