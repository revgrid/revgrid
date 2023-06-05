import { Revgrid } from '../../grid/grid-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardInputEditor } from './standard-input-editor';

export abstract class StandardTextInputEditor<BGS extends StandardBehavioredGridSettings, BCS extends StandardBehavioredColumnSettings> extends StandardInputEditor<BGS, BCS> {
    constructor(grid: Revgrid<BGS, BCS>) {
        super(grid, 'text');
        this.inputElement.classList.add('revgrid-text-input-editor');
    }
}
