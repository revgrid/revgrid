import { RevClientObject, RevSchemaField } from '../../../../common';
import { RevCellPropertiesBehavior } from '../../../behavior/cell-properties-behavior';
import { RevDataExtractBehavior } from '../../../behavior/data-extract-behavior';
import { RevEventBehavior } from '../../../behavior/event-behavior';
import { RevFocusScrollBehavior } from '../../../behavior/focus-scroll-behavior';
import { RevFocusSelectBehavior } from '../../../behavior/focus-select-behavior';
import { RevReindexBehavior } from '../../../behavior/reindex-behavior';
import { RevRowPropertiesBehavior } from '../../../behavior/row-properties-behavior';
import { RevCanvas } from '../../../components/canvas/canvas';
import { RevColumnsManager } from '../../../components/column/columns-manager';
import { RevFocus } from '../../../components/focus/focus';
import { RevMouse } from '../../../components/mouse/mouse';
import { RevRenderer } from '../../../components/renderer/renderer';
import { RevScroller } from '../../../components/scroller/scroller';
import { RevSelection } from '../../../components/selection/selection';
import { RevSubgridsManager } from '../../../components/subgrid/subgrids-manager';
import { RevViewLayout } from '../../../components/view/view-layout';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevGridSettings } from '../../../settings/internal-api';
import { RevUiControllerSharedState } from './ui-controller-shared-state';

/** @public */
export class RevUiControllerServices<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> implements RevClientObject {
    /** @internal */
    constructor(
        readonly clientId: string,
        readonly internalParent: RevClientObject,

        readonly sharedState: RevUiControllerSharedState,
        readonly hostElement: HTMLElement,
        readonly gridSettings: RevGridSettings,
        readonly canvas: RevCanvas<BGS>,
        readonly selection: RevSelection<BGS, BCS, SF>,
        readonly focus: RevFocus<BGS, BCS, SF>,
        readonly columnsManager: RevColumnsManager<BCS, SF>,
        readonly subgridsManager: RevSubgridsManager<BCS, SF>,
        readonly viewLayout: RevViewLayout<BGS, BCS, SF>,
        readonly renderer: RevRenderer<BGS, BCS, SF>,

        readonly mouse: RevMouse<BGS, BCS, SF>,
        readonly horizontalScroller: RevScroller<BGS, BCS, SF>,
        readonly verticalScroller: RevScroller<BGS, BCS, SF>,

        readonly reindexBehavior: RevReindexBehavior<BGS, BCS, SF>,
        readonly focusScrollBehavior: RevFocusScrollBehavior<BGS, BCS, SF>,
        readonly focusSelectBehavior: RevFocusSelectBehavior<BGS, BCS, SF>,
        readonly rowPropertiesBehavior: RevRowPropertiesBehavior<BGS, BCS, SF>,
        readonly cellPropertiesBehavior: RevCellPropertiesBehavior<BGS, BCS, SF>,
        readonly dataExtractBehavior: RevDataExtractBehavior<BGS, BCS, SF>,
        readonly eventBehavior: RevEventBehavior<BGS, BCS, SF>,
    ) {

    }
}
