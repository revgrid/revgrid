import { BehavioredColumnSettings, BehavioredGridSettings, DataServer, DatalessViewCell, RevAssertError, Revgrid, SchemaField } from '../../grid/grid-public-api';
import { StandardInputElementCellEditor } from './standard-input-element-cell-editor';

/** @public */
export class StandardTextInputCellEditor<
    BGS extends BehavioredGridSettings,
    BCS extends BehavioredColumnSettings,
    SF extends SchemaField
> extends StandardInputElementCellEditor<BGS, BCS, SF> {
    constructor(grid: Revgrid<BGS, BCS, SF>, dataServer: DataServer<SF>) {
        super(grid, dataServer, 'text');
        this.element.classList.add('revgrid-text-input-editor');
    }

    override tryOpenCell(cell: DatalessViewCell<BCS, SF>, openingKeyDownEvent: KeyboardEvent | undefined, _openingClickEvent: MouseEvent | undefined) {
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

            const result = super.tryOpenCell(cell, openingKeyDownEvent, _openingClickEvent);

            if (result) {
                if (key !== undefined) {
                    // was opened by keyboard
                    this.element.value = '';
                } else {
                    // was not opened by keyboard
                    const value = dataServer.getEditValue(cell.viewLayoutColumn.column.field, cell.viewLayoutRow.subgridRowIndex);
                    if (typeof value !== 'string') {
                        throw new RevAssertError('STIETO41112', typeof value);
                    } else {
                        this.element.value = value;
                        this.selectAll();
                    }
                }
            }

            return result;
        }
    }

    override closeCell(field: SF, subgridRowIndex: number, cancel: boolean) {
        if (!cancel && !this.readonly && this._dataServer.setEditValue !== undefined) {
            this._dataServer.setEditValue(field, subgridRowIndex, this.element.value);
        }
        super.closeCell(field, subgridRowIndex, cancel);
    }
}
