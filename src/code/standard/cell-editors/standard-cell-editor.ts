import { CellEditor, DataServer, DatalessViewCell, Focus, Revgrid, SchemaServer } from '../../grid/grid-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';

export abstract class StandardCellEditor<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SC extends SchemaServer.Column<BCS>
> implements CellEditor<BCS, SC> {
    pullValueEventer: CellEditor.PullDataEventer;
    pushValueEventer: CellEditor.PushDataEventer;
    closedEventer: CellEditor.ClosedEventer;

    private _readonly: boolean;

    constructor(
        protected readonly _grid: Revgrid<BGS, BCS, SC>,
        protected readonly _dataServer: DataServer<BCS>,
    ) {
    }

    get readonly() { return this._readonly; }
    set readonly(value: boolean) {
        this._readonly = value;
    }

    abstract tryOpen(viewCell: DatalessViewCell<BCS, SC>, openingKeyDownEvent: KeyboardEvent | undefined, openingClickEvent: MouseEvent | undefined): boolean;
    abstract close(schemaColumn: SC, subgridRowIndex: number, cancel: boolean): void;

    abstract processKeyDownEvent(event: KeyboardEvent, fromEditor: boolean, schemaColumn: SC, subgridRowIndex: number): boolean;

    protected isToggleKey(key: string) {
        return key === Focus.ActionKeyboardKey.Enter || key === ' ';
    }

    protected tryToggleBoolenValue(schemaColumn: SC, subgridRowIndex: number) {
        const dataServer = this._dataServer;
        if (dataServer.getEditValue === undefined || dataServer.setEditValue === undefined) {
            return false;
        } else {
            const value = dataServer.getEditValue(schemaColumn, subgridRowIndex);
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
            dataServer.setEditValue(schemaColumn, subgridRowIndex, newValue);

            return true;
        }
    }
}
