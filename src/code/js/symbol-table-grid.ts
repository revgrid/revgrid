import { RevInMemoryBehavioredColumnSettings, RevInMemoryBehavioredGridSettings } from '../settings-implementations';
import { RevTableGrid } from '../sourced-field';

/** @public */
export class RevSymbolTableGrid extends RevTableGrid<
    object,
    symbol,
    symbol,
    symbol,
    symbol,
    RevInMemoryBehavioredGridSettings,
    RevInMemoryBehavioredColumnSettings
> {

}
