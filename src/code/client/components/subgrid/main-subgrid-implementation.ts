import { RevSchemaField } from '../../../common';
import { RevMainSubgrid } from '../../interfaces/main-subgrid';
import { RevBehavioredColumnSettings } from '../../settings';
import { RevSubgridImplementation } from './subgrid-implementation';

/** @internal */
export class RevMainSubgridImplementation<
    BCS extends RevBehavioredColumnSettings,
    SF extends RevSchemaField
> extends RevSubgridImplementation<BCS, SF> implements RevMainSubgrid<BCS, SF> {
    override get fixedRowCount() { return this._gridSettings.fixedRowCount; }

    override isRowFixed(rowIndex: number): boolean {
        return rowIndex < this._gridSettings.fixedRowCount;
    }
}
