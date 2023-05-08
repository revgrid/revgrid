import { Subgrid } from './subgrid';

/** @public */
export class MainSubgrid extends Subgrid {
    override get fixedRowCount() { return this._gridSettings.fixedRowCount; }

    override isRowFixed(rowIndex: number): boolean {
        return rowIndex < this._gridSettings.fixedRowCount;
    }
}
