// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevInMemoryBehavioredColumnSettings, RevInMemoryBehavioredGridSettings } from '../../settings-implementations/internal-api';
import { RevTableGrid } from '../../sourced-field/internal-api';

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
