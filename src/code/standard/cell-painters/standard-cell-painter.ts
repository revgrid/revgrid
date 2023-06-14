import { CachedCanvasRenderingContext2D, CellPainter, DataServer, DatalessViewCell, Rectangle, Revgrid, SchemaServer } from '../../grid/grid-public-api';
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

    protected tryPaintBorder(bounds: Rectangle, borderColor: string | undefined, focus: boolean) {
        if (borderColor !== undefined) {
            const gc = this._renderingContext;
            gc.beginPath();
            gc.cache.strokeStyle = borderColor;
            if (focus) {
                gc.cache.lineDash = [1, 1];
            }
            gc.strokeRect(bounds.x + 0.5, bounds.y + 0.5, bounds.width - 1, bounds.height - 1);
            if (focus) {
                gc.cache.lineDash = [];
            }
        }
    }
}
