import { AssertError, DataServer, DatalessViewCell, Revgrid, SchemaServer } from '../../grid/grid-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardInputElementCellEditor } from './standard-input-element-cell-editor';

/** @public */
export class StandardTextInputCellEditor<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SC extends SchemaServer.Column<BCS>
> extends StandardInputElementCellEditor<BGS, BCS, SC> {
    constructor(grid: Revgrid<BGS, BCS, SC>, dataServer: DataServer<BCS>) {
        super(grid, dataServer, 'text');
        this.element.classList.add('revgrid-text-input-editor');
    }

    override tryOpen(cell: DatalessViewCell<BCS, SC>, openingKeyDownEvent: KeyboardEvent | undefined, _openingClickEvent: MouseEvent | undefined) {
        const dataServer = this._dataServer;
        if (dataServer.getEditValue === undefined) {
            return false;
        } else {
            const key = openingKeyDownEvent !== undefined ? openingKeyDownEvent.key : undefined;
            if (key !== undefined) {
                // trying to open from key down event
                const isPrintableKey = key.length === 1 || key === 'Unidentified';
                if (!isPrintableKey) {
                    return false; // only open if relevant key have been pushed down
                }
            }

            const result = super.tryOpen(cell, openingKeyDownEvent, _openingClickEvent);

            if (result && key === undefined) {
                // was not opened by keyboard
                const value = dataServer.getEditValue(cell.viewLayoutColumn.column.schemaColumn, cell.viewLayoutRow.subgridRowIndex);
                if (typeof value !== 'string') {
                    throw new AssertError('STIETO41112', typeof value);
                } else {
                    this.element.value = value;
                    this.selectAll();
                }
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
