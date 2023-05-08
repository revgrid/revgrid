import { HorizontalVertical } from './types';

export interface ScrollAction {
    readonly type: ScrollAction.Type;
    readonly viewportStart: number | undefined;
    readonly dimension: HorizontalVertical;
}

export namespace ScrollAction {
    export const enum Type {
        StepForward,
        StepBack,
        PageForward,
        PageBack,
        newViewportStart,
    }
}
