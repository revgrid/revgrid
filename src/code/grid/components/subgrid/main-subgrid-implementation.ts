import { MainSubgrid } from '../../interfaces/data/main-subgrid';
import { SchemaServer } from '../../interfaces/schema/schema-server';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { SubgridImplementation } from './subgrid-implementation';

/** @internal */
export class MainSubgridImplementation<
    BGS extends BehavioredGridSettings,
    BCS extends BehavioredColumnSettings,
    SC extends SchemaServer.Column<BCS>
> extends SubgridImplementation<BGS, BCS, SC> implements MainSubgrid<BCS, SC> {
    override get fixedRowCount() { return this._gridSettings.fixedRowCount; }

    override isRowFixed(rowIndex: number): boolean {
        return rowIndex < this._gridSettings.fixedRowCount;
    }
}
