import { Revgrid } from '../../grid/grid-public-api';
import { StandardMergableColumnSettings, StandardMergableGridSettings } from '../settings/standard-settings-public-api';
import { StandardInputEditor } from './standard-input-editor';

export abstract class StandardColorInputEditor<MGS extends StandardMergableGridSettings, MCS extends StandardMergableColumnSettings> extends StandardInputEditor<MGS, MCS> {
    constructor(grid: Revgrid<MGS, MCS>) {
        super(grid, 'color');
        this.inputElement.classList.add('revgrid-color-input-editor');
    }
}
