import { BehavioredColumnSettings, CellPainter } from '../../grid/grid-public-api';
import { RevRecordMainDataServer } from './rev-record-main-data-server';

/** @public */
export class RevRecordMainCellAdapter<BCS extends BehavioredColumnSettings> {
    constructor(
        private readonly _mainAdapter: RevRecordMainDataServer<BCS>,
        private readonly _mainCellPainter: CellPainter) {
    }

    getCellPainter(): CellPainter {
        return this._mainCellPainter;
    }
}
