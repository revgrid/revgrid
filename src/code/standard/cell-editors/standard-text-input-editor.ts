import { DataServer, Revgrid, SchemaServer } from '../../grid/grid-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardInputEditor } from './standard-input-editor';

/** @public */
export class StandardTextInputEditor<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SC extends SchemaServer.Column<BCS>
> extends StandardInputEditor<BGS, BCS, SC> {
    constructor(grid: Revgrid<BGS, BCS, SC>, readonly: boolean) {
        super(grid, readonly, 'text');
        this.inputElement.classList.add('revgrid-text-input-editor');
    }

    override open(value: DataServer.DataValue) {
        super.open(value);
        this.inputElement.value = value as string;
    }

    override close(cancel: boolean) {
        const value = (cancel || this.readonly) ? undefined : this.inputElement.value;
        super.close(cancel);
        return value;
    }
}
