import { BehavioredColumnSettings, BehavioredGridSettings, CellEditor, DataServer, DatalessViewCell, Focus, Revgrid, SchemaField } from '../../client/internal-api';

/** @public */
export abstract class StandardCellEditor<
    BGS extends BehavioredGridSettings,
    BCS extends BehavioredColumnSettings,
    SF extends SchemaField
> implements CellEditor<BCS, SF> {
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
        this.setReadonly(value); // defer this to a method which can be safely overridden (cannot override a getter or setter in Javascript without overriding both)
    }

    abstract tryOpenCell(viewCell: DatalessViewCell<BCS, SF>, openingKeyDownEvent: KeyboardEvent | undefined, openingClickEvent: MouseEvent | undefined): boolean;
    abstract closeCell(field: SF, subgridRowIndex: number, cancel: boolean): void;

    abstract processGridKeyDownEvent(event: KeyboardEvent, fromEditor: boolean, field: SF, subgridRowIndex: number): boolean;

    protected setReadonly(value: boolean) { // make sure this is not a setter as overrided and JavaScript cannot override setters only
        this._readonly = value;
    }

    protected isToggleKey(key: string) {
        return (key as Focus.ActionKeyboardKey) === Focus.ActionKeyboardKey.Enter || key === ' ';
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
