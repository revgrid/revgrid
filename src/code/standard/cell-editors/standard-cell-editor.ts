import { CachedCanvasRenderingContext2D, CellEditor, DataServer, DatalessViewCell, Revgrid, ViewCell } from '../../grid/grid-public-api';
import { StandardAllColumnSettings, StandardAllGridSettings, StandardMergableColumnSettings, StandardMergableGridSettings } from '../settings/standard-settings-public-api';

export abstract class StandardCellEditor<MGS extends StandardMergableGridSettings, MCS extends StandardMergableColumnSettings> implements CellEditor<MCS> {
    readonly paintImplemented: boolean = false;

    protected readonly _gridSettings: StandardAllGridSettings;
    protected readonly _renderingContext: CachedCanvasRenderingContext2D;
    protected _cell: DatalessViewCell<MCS>;
    protected _columnSettings: StandardAllColumnSettings;
    protected _dataServer: DataServer<MCS>;

    constructor(protected readonly _grid: Revgrid<MGS, MCS>) {
        const grid = this._grid;
        this._gridSettings = grid.settings;
        this._renderingContext = grid.canvasManager.gc;
    }

    paint(_prefillColor: string | undefined): number | undefined {
        return undefined;
    }

    open(viewCell: ViewCell<MCS>) {
        this._cell = viewCell;
        this._columnSettings = viewCell.columnSettings;
        this._dataServer = viewCell.subgrid.dataServer;
    }

    abstract close(cancel: boolean): void;
}
