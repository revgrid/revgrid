import { RevClientGrid, RevGridDefinition, RevGridOptions, RevViewCell } from '../client';
import { RevSchemaField } from '../common';
import { RevInMemoryBehavioredColumnSettings, RevInMemoryBehavioredGridSettings } from '../settings-implementations';

/** @public */
export type RevInMemorySettingsViewCell = RevViewCell<
    RevInMemoryBehavioredColumnSettings,
    RevSchemaField
>;

/** @public */
export type RevInMemorySettingsGridOptions = RevGridOptions<
    RevInMemoryBehavioredGridSettings,
    RevInMemoryBehavioredColumnSettings,
    RevSchemaField
>;

/** @public */
export type RevInMemorySettingsGridDefinition = RevGridDefinition<
    RevInMemoryBehavioredColumnSettings,
    RevSchemaField
>;

/** @public */
export class RevInMemorySettingsClientGrid extends RevClientGrid<
    RevInMemoryBehavioredGridSettings,
    RevInMemoryBehavioredColumnSettings,
    RevSchemaField
> {

}
