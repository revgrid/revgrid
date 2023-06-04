import { MergableGridSettingsImplementation } from '../../grid/grid-public-api';
import { CellPainterGridSettings } from '../cell-painter-grid-settings';
import { defaultCellPainterSettings } from './default-cell-painter-settings';

/** @public */
export abstract class CellPainterGridSettingsImplementation extends MergableGridSettingsImplementation implements CellPainterGridSettings {
    private _cellPadding = defaultCellPainterSettings.cellPadding;

    get cellPadding() { return this._cellPadding; }
    set cellPadding(value: number) {
        if (value !== this._cellPadding) {
            this._cellPadding = value;
            this.viewLayoutInvalidatedEventer(true);
        }
    }
}
