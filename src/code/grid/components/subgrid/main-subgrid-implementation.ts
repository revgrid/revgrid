import { MainSubgrid } from '../../interfaces/data/main-subgrid';
import { SchemaField } from '../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { SubgridImplementation } from './subgrid-implementation';

/** @internal */
export class MainSubgridImplementation<
    BGS extends BehavioredGridSettings,
    BCS extends BehavioredColumnSettings,
    SF extends SchemaField<BCS>
> extends SubgridImplementation<BGS, BCS, SF> implements MainSubgrid<BCS, SF> {
    override get fixedRowCount() { return this._gridSettings.fixedRowCount; }

    override isRowFixed(rowIndex: number): boolean {
        return rowIndex < this._gridSettings.fixedRowCount;
    }
}
