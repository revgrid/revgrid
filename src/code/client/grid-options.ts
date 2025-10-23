import { RevSchemaField } from '../common';
import { RevScroller } from './components';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings } from './settings';
import { RevUiController } from './ui/controller/ui-controller';

/** @public */
export interface RevGridOptions<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
    /** Used to distinguish between Revgrid instances in an application.  If undefined, will generate an id from canvas element */
    id?: string;
    /** Internally generated ids are numbered using the canvas element's id as a base or the above id as a base and suffixing it with a number. Normally the first id generated from a
     * base is not numbered.  Subsequent ids generated from that base id are suffixed with numbers beginning with 2. This works well if Ids specified in canvas elements or RevGrid options are generally unique (so
     * suffices are generally not used).  However, if Ids are not specified or not unique, then it may be better for all internally generated ids to be suffixed with a number (starting
     * from 1).  Set `firstGeneratedIdFromBaseIsAlsoNumbered` to true to suffix all internally generated ids.
     */
    firstGeneratedIdFromBaseIsAlsoNumbered?: boolean;
    /** Optional link to Revgrid instance's parent Javascript object. Is used to set externalParent which is not used within Revgrid however may be helpful with debugging */
    externalParent?: unknown;
    /** The canvas element must have a positioned element to use as overlay element. By default it uses its parent element as the overlay element. (Requires that the canvas element takes up
     * the full size of its parent element and the parent element is positioned). If this is not possible/provided, then you can provide a specific overlay element using this option.
    */
    canvasOverlayElement?: HTMLElement | undefined;
    /** Set alpha to false to speed up rendering if no colors use alpha channel */
    canvasRenderingContext2DSettings?: CanvasRenderingContext2DSettings;
    /** Create functions to generate custom scrollbars */
    scrollerCreateFns?: [
        /** Will use all space along its axis */
        spaceAccommodated: RevScroller.CreateFn<BGS, BCS, SF>,
        /** Will relinquish space along its axis to make room for the space accommodated scrollbar */
        spaceRelinquishing: RevScroller.CreateFn<BGS, BCS, SF>
    ];
    customUiControllerDefinitions?: RevUiController.Definition<BGS, BCS, SF>[];
}
