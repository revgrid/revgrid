import { DataServer, Revgrid, SchemaServer } from '../../grid/grid-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardInputElementEditor } from './standard-input-element-editor';

/** @public */
export class StandardDateInputEditor<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SC extends SchemaServer.Column<BCS>
> extends StandardInputElementEditor<BGS, BCS, SC> {
    constructor(grid: Revgrid<BGS, BCS, SC>, readonly: boolean) {
        super(grid, readonly, 'date');
        this.element.classList.add('revgrid-date-input-editor');
    }

    override open(value: DataServer.ViewValue, valueIsNew: boolean) {
        super.open(value, valueIsNew);
        this.element.value = value as string;
        if (!valueIsNew) {
            this.selectAll();
        }
    }

    override close(cancel: boolean) {
        const value = (cancel || this.readonly) ? undefined : this.element.value;
        super.close(cancel);
        return value;
    }
}
