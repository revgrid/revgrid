import { CellPainter } from '../../grid/grid-public-api';
import { RevRecordMainDataServer } from './rev-record-main-data-server';

/** @public */
export class RevRecordMainCellAdapter {
    constructor(
        private readonly _mainAdapter: RevRecordMainDataServer,
        private readonly _mainCellPainter: CellPainter) {
    }

    getCellPainter(): CellPainter {
        return this._mainCellPainter;
    }
}
