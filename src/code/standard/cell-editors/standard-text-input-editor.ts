import { DataServer, Revgrid } from '../../grid/grid-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardInputEditor } from './standard-input-editor';

/** @public */
export class StandardTextInputEditor<BGS extends StandardBehavioredGridSettings, BCS extends StandardBehavioredColumnSettings> extends StandardInputEditor<BGS, BCS> {
    constructor(grid: Revgrid<BGS, BCS>) {
        super(grid, 'text');
        this.inputElement.classList.add('revgrid-text-input-editor');
    }

    override initialise(value: DataServer.DataValue) {
        this.inputElement.value = value as string;
    }

    override close(cancel: boolean) {
        if (cancel) {
            return undefined;
        } else {
            return this.inputElement.value;
        }
    }
}
