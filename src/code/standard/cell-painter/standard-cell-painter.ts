import {
    RevBehavioredColumnSettings,
    RevBehavioredGridSettings,
    RevCachedCanvasRenderingContext2D,
    RevClientGrid,
    RevDataServer,
    RevDatalessViewCell,
    RevRectangle,
    RevSchemaField
} from '../../client/internal-api';

/** @public */
export abstract class RevStandardCellPainter<
    BGS extends RevBehavioredGridSettings,
    BCS extends RevBehavioredColumnSettings,
    SF extends RevSchemaField
> {
    protected readonly _gridSettings: BGS;
    protected readonly _renderingContext: RevCachedCanvasRenderingContext2D;

    constructor(
        protected readonly _grid: RevClientGrid<BGS, BCS, SF>,
        protected readonly _dataServer: RevDataServer<SF>,
    ) {
        const grid = this._grid;
        this._gridSettings = grid.settings;
        this._renderingContext = grid.canvas.gc;
    }

    abstract paint(cell: RevDatalessViewCell<BCS, SF>, prefillColor: string | undefined): number | undefined;

    protected paintBackground(bounds: RevRectangle, backgroundColor: string) {
        const gc = this._renderingContext;
        gc.cache.fillStyle = backgroundColor;
        gc.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    protected paintBorder(bounds: RevRectangle, borderColor: string, focus: boolean) {
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
