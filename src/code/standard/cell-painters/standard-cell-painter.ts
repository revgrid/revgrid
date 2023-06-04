import { CachedCanvasRenderingContext2D, CellPainter, DataServer, DatalessViewCell, Revgrid } from '../../grid/grid-public-api';
import { StandardAllColumnSettings, StandardAllGridSettings, StandardMergableColumnSettings, StandardMergableGridSettings } from '../settings/standard-settings-public-api';

/** @public */
export abstract class StandardCellPainter<MGS extends StandardMergableGridSettings, MCS extends StandardMergableColumnSettings> implements CellPainter {
    protected readonly _gridSettings: StandardAllGridSettings;
    protected readonly _renderingContext: CachedCanvasRenderingContext2D;
    protected _cell: DatalessViewCell<MCS>;
    protected _columnSettings: StandardAllColumnSettings;

    constructor(
        protected readonly _grid: Revgrid<MGS, MCS>,
        protected readonly _dataServer: DataServer<MCS>,
    ) {
        const grid = this._grid;
        this._gridSettings = grid.settings;
        this._renderingContext = grid.canvasManager.gc;
    }

    setCell(value: DatalessViewCell<MCS>) {
        this._cell = value;
        this._columnSettings = value.columnSettings;
    }

    abstract paint(prefillColor: string | undefined): number | undefined;
}
