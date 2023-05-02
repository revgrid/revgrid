import { CellModel, Revgrid, SimpleCellPainter, ViewportCell } from '..';

export class CellAdapter implements CellModel {
    private readonly _painter = new SimpleCellPainter();
    private _grid: Revgrid;

    setGrid(value: Revgrid) {
        this._grid = value;
    }

    getCellPainter(viewportCell: ViewportCell, prefillColor: string | undefined) {
        this._painter.loadConfig(this._grid, viewportCell, prefillColor);
        return this._painter;
    }
}
