// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { SchemaField } from '../client/interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../client/interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../client/interfaces/settings/behaviored-grid-settings';
import { RevColumnLayoutGrid } from './column-layout-grid';

/** @internal */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RevIColumnLayoutGrid<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> extends RevColumnLayoutGrid<BGS, BCS, SF> {

}
