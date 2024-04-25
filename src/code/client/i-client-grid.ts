// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevClientGrid } from './client-grid';
import { SchemaField } from './interfaces/schema/schema-field';
import { BehavioredColumnSettings } from './interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from './interfaces/settings/behaviored-grid-settings';

/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RevIClientGrid<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> extends RevClientGrid<BGS, BCS, SF> {

}
