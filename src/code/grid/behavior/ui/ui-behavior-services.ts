import { CanvasManager } from '../../components/canvas/canvas-manager';
import { ColumnsManager } from '../../components/column/columns-manager';
import { Focus } from '../../components/focus/focus';
import { Mouse } from '../../components/mouse/mouse';
import { Renderer } from '../../components/renderer/renderer';
import { Scroller } from '../../components/scroller/scroller';
import { Selection } from '../../components/selection/selection';
import { SubgridsManager } from '../../components/subgrid/subgrids-manager';
import { ViewLayout } from '../../components/view/view-layout';
import { SchemaServer } from '../../interfaces/schema/schema-server';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { GridSettings } from '../../interfaces/settings/grid-settings';
import { CellPropertiesBehavior } from '../component/cell-properties-behavior';
import { DataExtractBehavior } from '../component/data-extract-behavior';
import { EventBehavior } from '../component/event-behavior';
import { FocusScrollBehavior } from '../component/focus-scroll-behavior';
import { FocusSelectBehavior } from '../component/focus-select-behavior';
import { ReindexBehavior } from '../component/reindex-behavior';
import { RowPropertiesBehavior } from '../component/row-properties-behavior';
import { UiBehaviorSharedState } from './ui-behavior-shared-state';

/** @public */
export class UiBehaviorServices<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> {

    /** @internal */
    constructor(
        readonly sharedState: UiBehaviorSharedState,
        readonly containerHtmlElement: HTMLElement,
        readonly gridSettings: GridSettings,
        readonly canvasManager: CanvasManager<BGS>,
        readonly selection: Selection<BGS, BCS, SF>,
        readonly focus: Focus<BGS, BCS, SF>,
        readonly columnsManager: ColumnsManager<BGS, BCS, SF>,
        readonly subgridsManager: SubgridsManager<BGS, BCS, SF>,
        readonly viewLayout: ViewLayout<BGS, BCS, SF>,
        readonly renderer: Renderer<BGS, BCS, SF>,

        readonly mouse: Mouse<BGS, BCS, SF>,
        readonly horizontalScroller: Scroller<BGS>,
        readonly verticalScroller: Scroller<BGS>,

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
