export interface UiBehaviorSharedState {
    mouseDownUpClickUsedForMoveOrResize: boolean;
    columnMovingDragArmed: boolean;
    columnMovingDragging: boolean;

    /**
     * the cursor I want to be displayed
     */
    locationCursorName: string | undefined;
}

export namespace UiBehaviorSharedState {
    export function initialise(state: UiBehaviorSharedState) {
        state.mouseDownUpClickUsedForMoveOrResize = false;
        state.columnMovingDragArmed = false;
        state.columnMovingDragging = false;
    }
}
