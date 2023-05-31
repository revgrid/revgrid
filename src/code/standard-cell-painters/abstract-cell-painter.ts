import { CachedCanvasRenderingContext2D, CellPainter, DataServer, DatalessViewCell, Revgrid } from '../grid/grid-public-api';

/** @public */
export abstract class AbstractCellPainter implements CellPainter {
    protected _cell: DatalessViewCell;
    protected _grid: Revgrid;
    protected _renderingContext: CachedCanvasRenderingContext2D;

    constructor(protected readonly _dataServer: DataServer) {

    }

    setGrid(value: Revgrid) {
        this._grid = value;
        this._renderingContext = value.canvasManager.gc;
    }

    setCell(value: DatalessViewCell) {
        this._cell = value;
    }

    abstract paint(prefillColor: string | undefined): number | undefined;
}
