import { CellModel, CellPainter } from '../../grid/grid-public-api';
import { RevRecordMainAdapter } from './rev-record-main-adapter';

/** @public */
export class RevRecordMainCellAdapter implements CellModel {
    constructor(
        private readonly _mainAdapter: RevRecordMainAdapter,
        private readonly _mainCellPainter: CellPainter) {
    }

    getCellPainter(): CellPainter {
        return this._mainCellPainter;
    }
}
