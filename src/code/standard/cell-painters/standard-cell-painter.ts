import { CachedCanvasRenderingContext2D, CellPainter, DataServer, DatalessViewCell, Revgrid } from '../../grid/grid-public-api';
import { StandardAllColumnSettings, StandardAllGridSettings, StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';

/** @public */
export abstract class StandardCellPainter<BGS extends StandardBehavioredGridSettings, BCS extends StandardBehavioredColumnSettings> implements CellPainter {
    protected readonly _gridSettings: StandardAllGridSettings;
    protected readonly _renderingContext: CachedCanvasRenderingContext2D;
    protected _cell: DatalessViewCell<BCS>;
    protected _columnSettings: StandardAllColumnSettings;

    constructor(
        protected readonly _grid: Revgrid<BGS, BCS>,
        protected readonly _dataServer: DataServer<BCS>,
    ) {
        const grid = this._grid;
        this._gridSettings = grid.settings;
        this._renderingContext = grid.canvasManager.gc;
    }

    setCell(value: DatalessViewCell<BCS>) {
        this._cell = value;
        this._columnSettings = value.columnSettings;
    }

    abstract paint(prefillColor: string | undefined): number | undefined;
}
