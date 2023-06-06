import { CellEditor, DataServer, Revgrid } from '../../grid/grid-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';

export abstract class StandardCellEditor<BGS extends StandardBehavioredGridSettings, BCS extends StandardBehavioredColumnSettings> implements CellEditor<BCS> {
    pullDataEventer: CellEditor.PullDataEventer;
    pushDataEventer: CellEditor.PushDataEventer;
    closedEventer: CellEditor.ClosedEventer;

    readonly paintImplemented: boolean = false;

    // protected readonly _gridSettings: StandardAllGridSettings;
    // protected readonly _renderingContext: CachedCanvasRenderingContext2D;
    // protected _cell: ViewCell<BCS>;
    // protected _columnSettings: StandardAllColumnSettings;
    // protected _dataServer: DataServer<BCS>;

    constructor(protected readonly _grid: Revgrid<BGS, BCS>) {
        // const grid = this._grid;
        // this._gridSettings = grid.settings;
        // this._renderingContext = grid.canvasManager.gc;
    }

    paint(_prefillColor: string | undefined): number | undefined {
        return undefined;
    }

    abstract initialise(value: DataServer.DataValue): void;
    abstract close(cancel: boolean): DataServer.DataValue | undefined;
}
