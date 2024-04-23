import { CellPropertiesBehavior } from '../../../behavior/cell-properties-behavior';
import { DataExtractBehavior } from '../../../behavior/data-extract-behavior';
import { EventBehavior } from '../../../behavior/event-behavior';
import { FocusScrollBehavior } from '../../../behavior/focus-scroll-behavior';
import { FocusSelectBehavior } from '../../../behavior/focus-select-behavior';
import { ReindexBehavior } from '../../../behavior/reindex-behavior';
import { RowPropertiesBehavior } from '../../../behavior/row-properties-behavior';
import { Canvas } from '../../../components/canvas/canvas';
import { ColumnsManager } from '../../../components/column/columns-manager';
import { Focus } from '../../../components/focus/focus';
import { Mouse } from '../../../components/mouse/mouse';
import { Renderer } from '../../../components/renderer/renderer';
import { Scroller } from '../../../components/scroller/scroller';
import { Selection } from '../../../components/selection/selection';
import { SubgridsManager } from '../../../components/subgrid/subgrids-manager';
import { ViewLayout } from '../../../components/view/view-layout';
import { SchemaField } from '../../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../../interfaces/settings/behaviored-grid-settings';
import { GridSettings } from '../../../interfaces/settings/grid-settings';
import { RevgridObject } from '../../../types-utils/revgrid-object';
import { UiControllerSharedState } from './ui-controller-shared-state';

/** @public */
export class UiControllerServices<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> implements RevgridObject {
    /** @internal */
    constructor(
        readonly revgridId: string,
        readonly internalParent: RevgridObject,

        readonly sharedState: UiControllerSharedState,
        readonly hostElement: HTMLElement,
        readonly gridSettings: GridSettings,
        readonly canvas: Canvas<BGS>,
        readonly selection: Selection<BGS, BCS, SF>,
        readonly focus: Focus<BGS, BCS, SF>,
        readonly columnsManager: ColumnsManager<BCS, SF>,
        readonly subgridsManager: SubgridsManager<BCS, SF>,
        readonly viewLayout: ViewLayout<BGS, BCS, SF>,
        readonly renderer: Renderer<BGS, BCS, SF>,

        readonly mouse: Mouse<BGS, BCS, SF>,
        readonly horizontalScroller: Scroller<BGS, BCS, SF>,
        readonly verticalScroller: Scroller<BGS, BCS, SF>,

        readonly reindexBehavior: ReindexBehavior<BGS, BCS, SF>,
        readonly focusScrollBehavior: FocusScrollBehavior<BGS, BCS, SF>,
        readonly focusSelectBehavior: FocusSelectBehavior<BGS, BCS, SF>,
        readonly rowPropertiesBehavior: RowPropertiesBehavior<BGS, BCS, SF>,
        readonly cellPropertiesBehavior: CellPropertiesBehavior<BGS, BCS, SF>,
        readonly dataExtractBehavior: DataExtractBehavior<BGS, BCS, SF>,
        readonly eventBehavior: EventBehavior<BGS, BCS, SF>,
    ) {

    }
}
