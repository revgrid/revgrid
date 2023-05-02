import { ViewportCell, CellModel, CellPaintConfig, CellPainter } from '../../grid/grid-public-api';
import { RevRecordCellPaintConfigAccessor } from './rev-record-cell-paint-config-accessor';
import { RevRecordMainAdapter } from './rev-record-main-adapter';

/** @public */
export class RevRecordMainCellAdapter implements CellModel {
    constructor(
        private readonly _mainAdapter: RevRecordMainAdapter,
        private readonly _mainCellPainter: CellPainter) {
    }

    getCellPaintConfig(beingPaintedCell: ViewportCell): CellPaintConfig {
        return new RevRecordCellPaintConfigAccessor(beingPaintedCell, this._mainAdapter);
    }

    getCellPainter(): CellPainter {
        return this._mainCellPainter;
    }
}
