import { RevSchemaField } from '../../../common';
import { RevSubgrid } from '../../interfaces';
import { RevBehavioredColumnSettings } from '../../settings';
import { RevSelectionRangeList } from './selection-range-list';

export class RevSubgridSelectionRangeList<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevSelectionRangeList {
    constructor(readonly subgrid: RevSubgrid<BCS, SF>) {
        super();
    }
}
