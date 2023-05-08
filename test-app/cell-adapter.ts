import { CellModel, Revgrid, SimpleCellPainter, ViewCell } from '..';

export class CellAdapter implements CellModel {
    private readonly _painter = new SimpleCellPainter();
    private _grid: Revgrid;

    setGrid(value: Revgrid) {
        this._grid = value;
    }

    getCellPainter(viewCell: ViewCell, prefillColor: string | undefined) {
        this._painter.loadConfig(this._grid, viewCell, prefillColor);
        return this._painter;
    }
}
