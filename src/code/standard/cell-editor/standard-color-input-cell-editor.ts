import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevClientGrid, RevViewCell } from '../../client';
import { RevAssertError, RevDataServer, RevSchemaField } from '../../common';
import { RevStandardInputElementCellEditor } from './standard-input-element-cell-editor';

/** @public */
export class RevStandardColorInputCellEditor<
    BGS extends RevBehavioredGridSettings,
    BCS extends RevBehavioredColumnSettings,
    SF extends RevSchemaField
> extends RevStandardInputElementCellEditor<BGS, BCS, SF> {
    constructor(grid: RevClientGrid<BGS, BCS, SF>, dataServer: RevDataServer<SF>) {
        super(grid, dataServer, 'color');
        this._element.classList.add('revgrid-color-input-editor');
    }

    override tryOpenCell(cell: RevViewCell<BCS, SF>, openingKeyDownEvent: KeyboardEvent | undefined, _openingClickEvent: MouseEvent | undefined) {
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
                    this._element.value = key;
                } else {
                    // was not opened by keyboard
                    const value = dataServer.getEditValue(cell.viewLayoutColumn.column.field, cell.viewLayoutRow.subgridRowIndex);
                    if (typeof value !== 'string') {
                        throw new RevAssertError('STIETO41112', typeof value);
                    } else {
                        this._element.value = value;
                        this.selectAll();
                    }
                }
            }

            return result;
        }
    }

    override closeCell(field: SF, subgridRowIndex: number, cancel: boolean) {
        if (!cancel && !this.readonly && this._dataServer.setEditValue !== undefined) {
            this._dataServer.setEditValue(field, subgridRowIndex, this._element.value);
        }
        super.closeCell(field, subgridRowIndex, cancel);
    }
}
