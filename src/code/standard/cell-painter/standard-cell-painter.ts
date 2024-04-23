import { BehavioredColumnSettings, BehavioredGridSettings, CachedCanvasRenderingContext2D, DataServer, DatalessViewCell, Rectangle, Revgrid, SchemaField } from '../../grid/internal-api';

/** @public */
export abstract class StandardCellPainter<
    BGS extends BehavioredGridSettings,
    BCS extends BehavioredColumnSettings,
    SF extends SchemaField
> {
    protected readonly _gridSettings: BGS;
    protected readonly _renderingContext: CachedCanvasRenderingContext2D;

    constructor(
        protected readonly _grid: Revgrid<BGS, BCS, SF>,
        protected readonly _dataServer: DataServer<SF>,
    ) {
        const grid = this._grid;
        this._gridSettings = grid.settings;
        this._renderingContext = grid.canvas.gc;
    }

    abstract paint(cell: DatalessViewCell<BCS, SF>, prefillColor: string | undefined): number | undefined;

    protected paintBackground(bounds: Rectangle, backgroundColor: string) {
        const gc = this._renderingContext;
        gc.cache.fillStyle = backgroundColor;
        gc.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    protected paintBorder(bounds: Rectangle, borderColor: string, focus: boolean) {
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
