export interface UiBehaviorSharedState {
    mouseDownUpClickUsedForMoveOrResize: boolean;
    columnMovingDragArmed: boolean;
    columnMovingDragging: boolean;
}

export namespace UiBehaviorSharedState {
    export function initialise(state: UiBehaviorSharedState) {
        state.mouseDownUpClickUsedForMoveOrResize = false;
        state.columnMovingDragArmed = false;
        state.columnMovingDragging = false;
    }
}
