import { Revgrid } from '../../grid/grid-public-api';
import { StandardMergableColumnSettings, StandardMergableGridSettings } from '../settings/standard-settings-public-api';
import { StandardInputEditor } from './standard-input-editor';

export abstract class StandardTextInputEditor<MGS extends StandardMergableGridSettings, MCS extends StandardMergableColumnSettings> extends StandardInputEditor<MGS, MCS> {
    constructor(grid: Revgrid<MGS, MCS>) {
        super(grid, 'text');
        this.inputElement.classList.add('revgrid-text-input-editor');
    }
}
