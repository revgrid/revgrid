import { CanvasManager } from '../../components/canvas/canvas-manager';
import { ColumnsManager } from '../../components/column/columns-manager';
import { Focus } from '../../components/focus/focus';
import { Mouse } from '../../components/mouse/mouse';
import { Renderer } from '../../components/renderer/renderer';
import { Selection } from '../../components/selection/selection';
import { SubgridsManager } from '../../components/subgrid/subgrids-manager';
import { ViewLayout } from '../../components/view/view-layout';
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
export class UiBehaviorServices<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings> {

    /** @internal */
    constructor(
        readonly sharedState: UiBehaviorSharedState,
        readonly containerHtmlElement: HTMLElement,
        readonly gridSettings: GridSettings,
        readonly canvasManager: CanvasManager<BGS>,
        readonly selection: Selection<BGS, BCS>,
        readonly focus: Focus<BGS, BCS>,
        readonly columnsManager: ColumnsManager<BGS, BCS>,
        readonly subgridsManager: SubgridsManager<BGS, BCS>,
        readonly viewLayout: ViewLayout<BGS, BCS>,
        readonly renderer: Renderer<BGS, BCS>,

        readonly mouse: Mouse<BGS, BCS>,

        readonly reindexBehavior: ReindexBehavior<BGS, BCS>,
        readonly focusScrollBehavior: FocusScrollBehavior<BGS, BCS>,
        readonly focusSelectBehavior: FocusSelectBehavior<BGS, BCS>,
        readonly rowPropertiesBehavior: RowPropertiesBehavior<BGS, BCS>,
        readonly cellPropertiesBehavior: CellPropertiesBehavior<BGS, BCS>,
        readonly dataExtractBehavior: DataExtractBehavior<BGS, BCS>,
        readonly eventBehavior: EventBehavior<BGS, BCS>,
    ) {

    }
}
