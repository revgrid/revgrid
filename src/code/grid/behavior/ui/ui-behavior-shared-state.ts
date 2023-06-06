export interface UiBehaviorSharedState {
    locationCursorName: string | undefined;
    locationTitleText: string | undefined;
}

export namespace UiBehaviorSharedState {
    export function initialise(state: UiBehaviorSharedState) {
        state.locationCursorName = undefined;
        state.locationTitleText = undefined;
    }
}
