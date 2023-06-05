import { CachedCanvasRenderingContext2D, CellEditor, DataServer, DatalessViewCell, Revgrid, ViewCell } from '../../grid/grid-public-api';
import { StandardAllColumnSettings, StandardAllGridSettings, StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';

export abstract class StandardCellEditor<BGS extends StandardBehavioredGridSettings, BCS extends StandardBehavioredColumnSettings> implements CellEditor<BCS> {
    readonly paintImplemented: boolean = false;

    protected readonly _gridSettings: StandardAllGridSettings;
    protected readonly _renderingContext: CachedCanvasRenderingContext2D;
    protected _cell: DatalessViewCell<BCS>;
    protected _columnSettings: StandardAllColumnSettings;
    protected _dataServer: DataServer<BCS>;

    constructor(protected readonly _grid: Revgrid<BGS, BCS>) {
        const grid = this._grid;
        this._gridSettings = grid.settings;
        this._renderingContext = grid.canvasManager.gc;
    }

    paint(_prefillColor: string | undefined): number | undefined {
        return undefined;
    }

    open(viewCell: ViewCell<BCS>) {
        this._cell = viewCell;
        this._columnSettings = viewCell.columnSettings;
        this._dataServer = viewCell.subgrid.dataServer;
    }

    abstract close(cancel: boolean): void;
}
