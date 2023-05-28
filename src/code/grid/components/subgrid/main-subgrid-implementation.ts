import { MainSubgrid } from '../../interfaces/server/main-subgrid';
import { SubgridImplementation } from './subgrid-implementation';

/** @internal */
export class MainSubgridImplementation extends SubgridImplementation implements MainSubgrid {
    override get fixedRowCount() { return this._gridSettings.fixedRowCount; }

    override isRowFixed(rowIndex: number): boolean {
        return rowIndex < this._gridSettings.fixedRowCount;
    }
}
