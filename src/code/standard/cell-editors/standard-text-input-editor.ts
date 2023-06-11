import { DataServer, DatalessViewCell, Revgrid, SchemaServer } from '../../grid/grid-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardInputElementEditor } from './standard-input-element-editor';

/** @public */
export class StandardTextInputEditor<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SC extends SchemaServer.Column<BCS>
> extends StandardInputElementEditor<BGS, BCS, SC> {
    constructor(grid: Revgrid<BGS, BCS, SC>, dataServer: DataServer<BCS>) {
        super(grid, dataServer, 'text');
        this.element.classList.add('revgrid-text-input-editor');
    }

    override tryOpen(cell: DatalessViewCell<BCS, SC>, keyDownEvent: KeyboardEvent | undefined, _mouseEvent: MouseEvent | undefined) {
        const dataServer = this._dataServer;
        if (dataServer.getEditValue === undefined) {
            return false;
        } else {
            const key = keyDownEvent !== undefined ? keyDownEvent.key : undefined;
            if (key !== undefined) {
                // trying to open from key down event
                const isPrintableKey = key.length === 1 || key === 'Unidentified';
                if (!isPrintableKey) {
                    return false; // only open if relevant key have been pushed down
                }
            }

            const result = super.tryOpen(cell, keyDownEvent, _mouseEvent);

            if (result && key !== undefined) {
                // was opened by keyboard
                const value = dataServer.getEditValue(cell.viewLayoutColumn.column.schemaColumn, cell.viewLayoutRow.subgridRowIndex);
                this.element.value = value as string;
                this.selectAll();
            }

            return result;
        }
    }

    override close(schemaColumn: SC, subgridRowIndex: number, cancel: boolean) {
        if (!cancel && !this.readonly && this._dataServer.setEditValue !== undefined) {
            this._dataServer.setEditValue(schemaColumn, subgridRowIndex, this.element.value);
        }
        super.close(schemaColumn, subgridRowIndex, cancel);
    }
}
