import { CanvasManager } from '../../components/canvas/canvas-manager';
import { ColumnsManager } from '../../components/column/columns-manager';
import { Focus } from '../../components/focus/focus';
import { Mouse } from '../../components/mouse/mouse';
import { Renderer } from '../../components/renderer/renderer';
import { Selection } from '../../components/selection/selection';
import { SubgridsManager } from '../../components/subgrid/subgrids-manager';
import { ViewLayout } from '../../components/view/view-layout';
import { GridSettings } from '../../interfaces/settings/grid-settings';
import { MergableColumnSettings } from '../../interfaces/settings/mergable-column-settings';
import { MergableGridSettings } from '../../interfaces/settings/mergable-grid-settings';
import { CellPropertiesBehavior } from '../component/cell-properties-behavior';
import { DataExtractBehavior } from '../component/data-extract-behavior';
import { EventBehavior } from '../component/event-behavior';
import { FocusScrollBehavior } from '../component/focus-scroll-behavior';
import { FocusSelectBehavior } from '../component/focus-select-behavior';
import { ReindexBehavior } from '../component/reindex-behavior';
import { RowPropertiesBehavior } from '../component/row-properties-behavior';
import { UiBehaviorSharedState } from './ui-behavior-shared-state';

/** @internal */
export class UiBehaviorServices<MGS extends MergableGridSettings, MCS extends MergableColumnSettings> {

    constructor(
        readonly sharedState: UiBehaviorSharedState,
        readonly containerHtmlElement: HTMLElement,
        readonly gridSettings: GridSettings,
        readonly canvasManager: CanvasManager<MGS>,
        readonly selection: Selection<MGS, MCS>,
        readonly focus: Focus<MGS, MCS>,
        readonly columnsManager: ColumnsManager<MGS, MCS>,
        readonly subgridsManager: SubgridsManager<MGS, MCS>,
        readonly viewLayout: ViewLayout<MGS, MCS>,
        readonly renderer: Renderer<MGS, MCS>,

        readonly mouse: Mouse<MGS, MCS>,

        readonly reindexBehavior: ReindexBehavior<MGS, MCS>,
        readonly focusScrollBehavior: FocusScrollBehavior<MGS, MCS>,
        readonly focusSelectBehavior: FocusSelectBehavior<MGS, MCS>,
        readonly rowPropertiesBehavior: RowPropertiesBehavior<MGS, MCS>,
        readonly cellPropertiesBehavior: CellPropertiesBehavior<MGS, MCS>,
        readonly dataExtractBehavior: DataExtractBehavior<MGS, MCS>,
        readonly eventBehavior: EventBehavior<MGS, MCS>,
    ) {

    }
}
