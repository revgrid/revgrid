import { RevAssertError, RevClientObject, RevSchemaField } from '../../common';
import { RevFocus } from '../components/focus/focus';
import { RevSelection } from '../components/selection/selection';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings } from '../settings';

export class RevReindexBehavior<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> implements RevClientObject {
    private _requestNestCount = 0;
    private _focusStash: RevFocus.Stash<BCS, SF> | undefined;
    private _selectionStash: RevSelection.Stash<BCS, SF> | undefined;

    constructor(
        readonly clientId: string,
        readonly internalParent: RevClientObject,
        /** @internal */
        private readonly _focus: RevFocus<BGS, BCS, SF>,
        /** @internal */
        private readonly _selection: RevSelection<BGS, BCS, SF>,
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
