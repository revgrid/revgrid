// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevSchemaField } from '../common/internal-api';
import { RevDataRowArrayGrid } from '../data-row-array/internal-api';
import { RevSimpleInMemoryBehavioredColumnSettings, RevSimpleInMemoryBehavioredGridSettings } from './settings-implementations/internal-api';

/** @public */
export class RevSimpleSingleHeadingDataRowArrayGrid extends RevDataRowArrayGrid<
    RevSimpleInMemoryBehavioredGridSettings,
    RevSimpleInMemoryBehavioredColumnSettings,
    RevSchemaField
> {
    // todo
}
