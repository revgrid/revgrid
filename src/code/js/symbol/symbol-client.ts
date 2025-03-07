import { RevClientGrid, RevGridDefinition, RevGridOptions, RevViewCell } from '../../client/internal-api';
import { RevSchemaField } from '../../common/internal-api';
import { RevInMemoryBehavioredColumnSettings, RevInMemoryBehavioredGridSettings } from '../../settings-implementations/internal-api';

/** @public */
export type RevSymbolViewCell = RevViewCell<
    RevInMemoryBehavioredColumnSettings,
    RevSchemaField
>;

/** @public */
export type RevSymbolGridOptions = RevGridOptions<
    RevInMemoryBehavioredGridSettings,
    RevInMemoryBehavioredColumnSettings,
    RevSchemaField
>;

/** @public */
export type RevSymbolGridDefinition = RevGridDefinition<
    RevInMemoryBehavioredColumnSettings,
    RevSchemaField
>;

/** @public */
export class RevSymbolClientGrid extends RevClientGrid<
    RevInMemoryBehavioredGridSettings,
    RevInMemoryBehavioredColumnSettings,
    RevSchemaField
> {

}
