import { CachedCanvasRenderingContext2D, CellPainter, DataServer, DatalessViewCell, Revgrid, SchemaServer } from '../../grid/grid-public-api';
import { StandardAllGridSettings, StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';

/** @public */
export abstract class StandardCellPainter<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SC extends SchemaServer.Column<BCS>
> implements CellPainter<BCS, SC> {
    protected readonly _gridSettings: StandardAllGridSettings;
    protected readonly _renderingContext: CachedCanvasRenderingContext2D;

    constructor(
        protected readonly _grid: Revgrid<BGS, BCS, SC>,
        protected readonly _dataServer: DataServer<BCS>,
    ) {
        const grid = this._grid;
        this._gridSettings = grid.settings;
        this._renderingContext = grid.canvasManager.gc;
    }

    abstract paint(cell: DatalessViewCell<BCS, SC>, prefillColor: string | undefined): number | undefined;
}
