import { RevCssTypes, RevSchemaField } from '../common';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings } from './settings';
import { RevUiController } from './ui/controller/ui-controller';

/** @public */
export interface RevGridOptions<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
    /** Used to distinguish between Revgrid instances in an application.  If undefined, will generate an id from host element */
    id?: string;
    /** Internally generated ids are numbered using the host HTML element's id as a base and suffixing it with a number. Normally the first id generated from a host element
     * base Id is not numbered.  Subsequent ids generated from that base id are suffixed with numbers beginning with 2. This works well if host elements all have different Ids (so
     * there suffices are not used).  However If host elements have the same id or no id, then it may be better for all internally generated ids to be suffixed with a number (starting
     * from 1).  Set {@link RevClientGrid:namespace.Options.interface.firstGeneratedIdFromBaseIsAlsoNumbered} to true to suffix all internally generated ids.
     */
    firstGeneratedIdFromBaseIsAlsoNumbered?: boolean;
    /** Optional link to Revgrid instance's parent Javascript object. Is used to set externalParent which is not used within Revgrid however may be helpful with debugging */
    externalParent?: unknown;
    /** Set alpha to false to speed up rendering if no colors use alpha channel */
    canvasRenderingContext2DSettings?: CanvasRenderingContext2DSettings;
    /** Normally the canvas HTML element created by Revgrid on which to draw the grid has its `overflow` property set to `clip`.  However it may be helpful to set its overflow property
     * to `visible` when debugging painters. The {@link RevClientGrid:namespace.Options.interface.canvasOverflowOverride} can be used to override the default value of this property.
     */
    canvasOverflowOverride?: RevCssTypes.Overflow;
    customUiControllerDefinitions?: RevUiController.Definition<BGS, BCS, SF>[];
}
