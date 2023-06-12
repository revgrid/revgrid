import { CellEditor } from '../../interfaces/data/cell-editor';

export interface UiBehaviorSharedState extends CellEditor.PointerLocationInfo {
    locationCursorName: string | undefined;
    locationTitleText: string | undefined;
}

export namespace UiBehaviorSharedState {
    export function initialise(state: UiBehaviorSharedState) {
        state.locationCursorName = undefined;
        state.locationTitleText = undefined;
    }
}
