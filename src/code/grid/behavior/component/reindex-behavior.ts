import { Focus } from '../../components/focus/focus';
import { Selection } from '../../components/selection/selection';
import { SchemaField } from '../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { AssertError } from '../../types-utils/revgrid-error';

export class ReindexBehavior<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField<BCS>> {
    private _requestNestCount = 0;
    private _focusStash: Focus.Stash | undefined;
    private _selectionStash: Selection.Stash<BCS, SF> | undefined;

    constructor(
        private readonly _focus: Focus<BGS, BCS, SF>,
        private readonly _selection: Selection<BCS, SF>,
    ) {

    }

    stash() {
        if (this._requestNestCount++ === 0) {
            if (this._focusStash !== undefined || this._selectionStash !== undefined) {
                throw new AssertError('RSMS13360');
            } else {
                this._focusStash = this._focus.createStash();
                this._focus.clear();
                this._selectionStash = this._selection.createStash();
                this._selection.clear();
            }
        }

    }

    unstash() {
        if (--this._requestNestCount === 0) {
            if (this._focusStash === undefined || this._selectionStash === undefined) {
                throw new AssertError('RSMUU13360');
            } else {
                this._focus.restoreStash(this._focusStash);
                this._focusStash = undefined;
                this._selection.restoreStash(this._selectionStash);
                this._selectionStash = undefined;
            }
        } else {
            if (this._requestNestCount < 0) {
                throw new AssertError('RSMUN13360');
            }
        }
    }
}
