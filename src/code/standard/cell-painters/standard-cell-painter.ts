import { CachedCanvasRenderingContext2D, CellPainter, DataServer, DatalessViewCell, Rectangle, Revgrid, SchemaField } from '../../grid/grid-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';

/** @public */
export abstract class StandardCellPainter<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SF extends SchemaField
> implements CellPainter<BCS, SF> {
    protected readonly _gridSettings: BGS;
    protected readonly _renderingContext: CachedCanvasRenderingContext2D;

    constructor(
        protected readonly _grid: Revgrid<BGS, BCS, SF>,
        protected readonly _dataServer: DataServer<SF>,
    ) {
        const grid = this._grid;
        this._gridSettings = grid.settings;
        this._renderingContext = grid.canvasManager.gc;
    }

    abstract paint(cell: DatalessViewCell<BCS, SF>, prefillColor: string | undefined): number | undefined;

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
