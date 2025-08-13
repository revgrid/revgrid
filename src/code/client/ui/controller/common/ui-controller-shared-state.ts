import { RevMouse } from '../../../components/mouse/mouse';
import { RevCellEditor } from '../../../interfaces/cell-editor';

export interface RevUiControllerSharedState extends RevCellEditor.MouseActionPossible {
    mouseActionPossible: RevMouse.ActionPossible | undefined;
}

export namespace RevUiControllerSharedState {
    export function initialise(state: RevUiControllerSharedState) {
        state.mouseActionPossible = undefined;
        state.cursorName = undefined;
        state.titleText = undefined;
    }
}
