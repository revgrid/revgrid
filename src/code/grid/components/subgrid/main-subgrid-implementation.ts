import { MainSubgrid } from '../../interfaces/data/main-subgrid';
import { MergableColumnSettings } from '../../interfaces/settings/mergable-column-settings';
import { MergableGridSettings } from '../../interfaces/settings/mergable-grid-settings';
import { SubgridImplementation } from './subgrid-implementation';

/** @internal */
export class MainSubgridImplementation<MGS extends MergableGridSettings, MCS extends MergableColumnSettings> extends SubgridImplementation<MGS, MCS> implements MainSubgrid<MCS> {
    override get fixedRowCount() { return this._gridSettings.fixedRowCount; }

    override isRowFixed(rowIndex: number): boolean {
        return rowIndex < this._gridSettings.fixedRowCount;
    }
}
