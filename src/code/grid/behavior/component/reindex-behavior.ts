import { Focus } from '../../components/focus/focus';
import { Selection } from '../../components/selection/selection';
import { AssertError } from '../../types-utils/revgrid-error';

export class ReindexBehavior {
    private _requestNestCount = 0;
    private _focusStash: Focus.Stash | undefined;
    private _selectionStash: Selection.Stash | undefined;

    constructor(
        private readonly _focus: Focus,
        private readonly _selection: Selection,
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
