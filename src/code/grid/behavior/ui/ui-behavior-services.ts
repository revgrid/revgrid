import { CanvasEx } from '../../components/canvas-ex/canvas-ex';
import { ColumnsManager } from '../../components/column/columns-manager';
import { Focus } from '../../components/focus/focus';
import { ReindexStashManager } from '../../components/model-callback-router/reindex-stash-manager';
import { Mouse } from '../../components/mouse/mouse';
import { Renderer } from '../../components/renderer/renderer';
import { Selection } from '../../components/selection/selection';
import { SubgridsManager } from '../../components/subgrid/subgrids-manager';
import { ViewLayout } from '../../components/view/view-layout';
import { GridSettings } from '../../interfaces/grid-settings';
import { CellPropertiesBehavior } from '../component/cell-properties-behavior';
import { DataExtractBehavior } from '../component/data-extract-behavior';
import { EventBehavior } from '../component/event-behavior';
import { FocusScrollBehavior } from '../component/focus-scroll-behavior';
import { RowPropertiesBehavior } from '../component/row-properties-behavior';
import { SelectionBehavior } from '../component/selection-behavior';
import { UiBehaviorSharedState } from './ui-behavior-shared-state';

/** @internal */
export class UiBehaviorServices {

    constructor(
        readonly sharedState: UiBehaviorSharedState,
        readonly containerHtmlElement: HTMLElement,
        readonly gridSettings: GridSettings,
        readonly canvasEx: CanvasEx,
        readonly selection: Selection,
        readonly focus: Focus,
        readonly columnsManager: ColumnsManager,
        readonly subgridsManager: SubgridsManager,
        readonly viewLayout: ViewLayout,
        readonly renderer: Renderer,
        readonly reindexStashManager: ReindexStashManager,

        readonly mouse: Mouse,

        readonly focusScrollBehavior: FocusScrollBehavior,
        readonly selectionBehavior: SelectionBehavior,
        readonly rowPropertiesBehavior: RowPropertiesBehavior,
        readonly cellPropertiesBehavior: CellPropertiesBehavior,
        readonly dataExtractBehavior: DataExtractBehavior,
        readonly eventBehavior: EventBehavior,
    ) {

    }
}
