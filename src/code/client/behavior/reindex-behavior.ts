import { Focus } from '../components/focus/focus';
import { Selection } from '../components/selection/selection';
import { SchemaField } from '../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../interfaces/settings/behaviored-grid-settings';
import { RevClientObject } from '../types-utils/client-object';
import { RevAssertError } from '../types-utils/revgrid-error';

export class ReindexBehavior<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> implements RevClientObject {
    private _requestNestCount = 0;
    private _focusStash: Focus.Stash | undefined;
    private _selectionStash: Selection.Stash<BCS, SF> | undefined;

    constructor(
        readonly clientId: string,
        readonly internalParent: RevClientObject,
        /** @internal */
        private readonly _focus: Focus<BGS, BCS, SF>,
        /** @internal */
        private readonly _selection: Selection<BGS, BCS, SF>,
    ) {

    }

    stash() {
        if (this._requestNestCount++ === 0) {
            if (this._focusStash !== undefined || this._selectionStash !== undefined) {
                throw new RevAssertError('RSMS13360');
            } else {
                this._focusStash = this._focus.createStash();
                this._focus.clear();
                this._selectionStash = this._selection.createStash();
                this._selection.clear();
            }
        }

    }

    unstash(allRowsKept: boolean) {
        if (--this._requestNestCount === 0) {
            if (this._focusStash === undefined || this._selectionStash === undefined) {
                throw new RevAssertError('RSMUU13360');
            } else {
                this._focus.restoreStash(this._focusStash, allRowsKept);
                this._focusStash = undefined;
                this._selection.restoreStash(this._selectionStash, allRowsKept);
                this._selectionStash = undefined;
            }
        } else {
            if (this._requestNestCount < 0) {
                throw new RevAssertError('RSMUN13360');
            }
        }
    }
}
