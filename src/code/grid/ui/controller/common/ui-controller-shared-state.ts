import { CellEditor } from '../../../interfaces/data/cell-editor';

export interface UiControllerSharedState extends CellEditor.PointerLocationInfo {
    locationCursorName: string | undefined;
    locationTitleText: string | undefined;
}

export namespace UiControllerSharedState {
    export function initialise(state: UiControllerSharedState) {
        state.locationCursorName = undefined;
        state.locationTitleText = undefined;
    }
}
