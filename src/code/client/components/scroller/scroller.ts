/**
 * Defines the interface a scroller component must implement.
 * @public
 */

import { RevSchemaField } from "../../../common";
import { RevClientObject } from "../../../common/types-utils";
import { RevBehavioredGridSettings, RevBehavioredColumnSettings } from "../../settings";
import { RevCanvas } from "../canvas";
import { RevViewLayout } from "../view";
import { RevScrollDimension } from "../view/scroll-dimension";

export interface RevScroller extends RevClientObject {
    actionEventer: RevScroller.ActionEventer;
    wheelEventer: RevScroller.WheelEventer | undefined;
    visibilityChangedEventer: RevScroller.VisibilityChangedEventer | undefined;

    readonly axis: RevScrollDimension.Axis;
    readonly trailing: boolean; // true: right/bottom of canvas, false: otherwise left/top of canvas
    readonly hidden: boolean;
    readonly insideOverlap: number;

    destroy(): void;
    temporarilyGiveThumbFullVisibility(timePeriod: number): void;
}

export namespace RevScroller {
    /**
     * A function that handles a wheel event.
     */
    export type WheelEventer = (this: void, event: WheelEvent) => void;

    /** @public */
    export interface Action {
        readonly type: Action.TypeId;
        readonly viewportStart: number | undefined;
    }

    /** @public */
    export namespace Action {
        export const enum TypeId {
            StepForward,
            StepBack,
            PageForward,
            PageBack,
            newViewportStart,
        }
    }

    export type ActionEventer = (this: void, action: Action) => void;
    export type VisibilityChangedEventer = (this: void) => void;

    export type CreateFn<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> = (
        clientId: string,
        internalParent: RevClientObject,
        gridSettings: BGS,
        hostElement: HTMLElement, // Revgrid host element
        canvas: RevCanvas<BGS>,
        scrollDimension: RevScrollDimension<BGS>,
        viewLayout: RevViewLayout<BGS, BCS, SF>,
        spaceAccommodatedScroller: RevScroller | undefined,
    ) => RevScroller;

    export type CreateFnPair<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> = [
        spaceAccommodated: CreateFn<BGS, BCS, SF>,
        spaceRelinquishing: CreateFn<BGS, BCS, SF>
    ];
}
