import { CellEditor, DataServer, DatalessViewCell, Focus, Revgrid, SchemaField } from '../../grid/grid-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';

/** @public */
export abstract class StandardCellEditor<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SF extends SchemaField
> implements CellEditor<BCS, SF> {
    pullCellValueEventer: CellEditor.PullCellValueEventer;
    pushCellValueEventer: CellEditor.PushCellValueEventer;
    cellClosedEventer: CellEditor.CellClosedEventer;

    /** @internal */
    private _readonly: boolean;

    constructor(
        protected readonly _grid: Revgrid<BGS, BCS, SF>,
        protected readonly _dataServer: DataServer<SF>,
    ) {
    }

    get readonly() { return this._readonly; }
    set readonly(value: boolean) {
        this._readonly = value;
    }

    abstract tryOpenCell(viewCell: DatalessViewCell<BCS, SF>, openingKeyDownEvent: KeyboardEvent | undefined, openingClickEvent: MouseEvent | undefined): boolean;
    abstract closeCell(field: SF, subgridRowIndex: number, cancel: boolean): void;

    abstract processGridKeyDownEvent(event: KeyboardEvent, fromEditor: boolean, field: SF, subgridRowIndex: number): boolean;

    protected isToggleKey(key: string) {
        return key === Focus.ActionKeyboardKey.Enter || key === ' ';
    }

    protected tryToggleBoolenValue(field: SF, subgridRowIndex: number) {
        const dataServer = this._dataServer;
        if (dataServer.getEditValue === undefined || dataServer.setEditValue === undefined) {
            return false;
        } else {
            const value = dataServer.getEditValue(field, subgridRowIndex);
            let newValue: boolean;
            if (value === undefined) {
                newValue = true;
            } else {
                if (typeof value !== 'boolean') {
                    newValue = true;
                } else {
                    newValue = !value;
                }
            }
            dataServer.setEditValue(field, subgridRowIndex, newValue);

            return true;
        }
    }
}
