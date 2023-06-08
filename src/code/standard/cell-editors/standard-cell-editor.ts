import { CellEditor, DataServer, Revgrid, SchemaServer } from '../../grid/grid-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';

export abstract class StandardCellEditor<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SC extends SchemaServer.Column<BCS>
> implements CellEditor<BCS, SC> {
    pullValueEventer: CellEditor.PullDataEventer;
    pushValueEventer: CellEditor.PushDataEventer;
    closedEventer: CellEditor.ClosedEventer;

    // protected readonly _gridSettings: StandardAllGridSettings;
    // protected readonly _renderingContext: CachedCanvasRenderingContext2D;
    // protected _cell: ViewCell<BCS>;
    // protected _columnSettings: StandardAllColumnSettings;
    // protected _dataServer: DataServer<BCS>;

    constructor(protected readonly _grid: Revgrid<BGS, BCS, SC>, readonly readonly: boolean) {
        // const grid = this._grid;
        // this._gridSettings = grid.settings;
        // this._renderingContext = grid.canvasManager.gc;
    }

    abstract open(value: DataServer.ViewValue, valueIsNew: boolean): void;
    abstract close(cancel: boolean): DataServer.ViewValue | undefined;

    abstract consumeKeyDownEvent(event: KeyboardEvent): void;
    abstract checkConsumeKeyDownEvent(event: KeyboardEvent, fromEditor: boolean): boolean;
}
