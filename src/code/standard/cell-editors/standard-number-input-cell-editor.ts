import { AssertError, DataServer, DatalessViewCell, Revgrid, SchemaServer } from '../../grid/grid-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardInputElementCellEditor } from './standard-input-element-cell-editor';

/** @public */
export class StandardNumberInputCellEditor<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SF extends SchemaServer.Field
> extends StandardInputElementCellEditor<BGS, BCS, SF> {
    constructor(grid: Revgrid<BGS, BCS, SF>, dataServer: DataServer<SF>) {
        super(grid, dataServer, 'number');
        this.element.classList.add('revgrid-number-input-editor');
    }

    override tryOpen(cell: DatalessViewCell<BCS, SF>, openingKeyDownEvent: KeyboardEvent | undefined, _openingClickEvent: MouseEvent | undefined) {
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
                const value = dataServer.getEditValue(cell.viewLayoutColumn.column.field, cell.viewLayoutRow.subgridRowIndex);
                if (typeof value !== 'number') {
                    throw new AssertError('SNIETO41112', typeof value);
                } else {
                    this.element.valueAsNumber = value;
                    this.selectAll();
                }
            }

            return result;
        }
    }

    override close(field: SF, subgridRowIndex: number, cancel: boolean) {
        if (!cancel && !this.readonly && this._dataServer.setEditValue !== undefined) {
            this._dataServer.setEditValue(field, subgridRowIndex, this.element.valueAsNumber);
        }
        super.close(field, subgridRowIndex, cancel);
    }
}
