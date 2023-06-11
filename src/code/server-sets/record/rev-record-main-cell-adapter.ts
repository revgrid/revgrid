import { BehavioredColumnSettings, CellPainter, SchemaServer } from '../../grid/grid-public-api';
import { RevRecordMainDataServer } from './rev-record-main-data-server';

/** @public */
export class RevRecordMainCellAdapter<BCS extends BehavioredColumnSettings, SC extends SchemaServer.Column<BCS>> {
    constructor(
        private readonly _mainAdapter: RevRecordMainDataServer<BCS>,
        private readonly _mainCellPainter: CellPainter<BCS, SC>) {
    }

    getCellPainter(): CellPainter<BCS, SC> {
        return this._mainCellPainter;
    }
}
