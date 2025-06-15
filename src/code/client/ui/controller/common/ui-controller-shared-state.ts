import { RevCellEditor } from '../../../interfaces/cell-editor';

export interface RevUiControllerSharedState extends RevCellEditor.PointerLocationInfo {
    locationCursorName: string | undefined;
    locationTitleText: string | undefined;
}

export namespace RevUiControllerSharedState {
    export function initialise(state: RevUiControllerSharedState) {
        state.locationCursorName = undefined;
        state.locationTitleText = undefined;
    }
}
