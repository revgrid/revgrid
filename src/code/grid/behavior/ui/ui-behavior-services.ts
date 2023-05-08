import { CanvasEx } from '../../components/canvas-ex/canvas-ex';
import { ColumnsManager } from '../../components/column/columns-manager';
import { Focus } from '../../components/focus/focus';
import { Mouse } from '../../components/mouse/mouse';
import { ReindexStashManager } from '../../components/reindex-stash-manager/reindex-stash-manager';
import { Renderer } from '../../components/renderer/renderer';
import { Selection } from '../../components/selection/selection';
import { SubgridsManager } from '../../components/subgrid/subgrids-manager';
import { ViewLayout } from '../../components/view/view-layout';
import { GridSettings } from '../../interfaces/grid-settings';
import { CellPropertiesBehavior } from '../component/cell-properties-behavior';
import { DataExtractBehavior } from '../component/data-extract-behavior';
import { EventBehavior } from '../component/event-behavior';
import { FocusBehavior } from '../component/focus-behavior';
import { RowPropertiesBehavior } from '../component/row-properties-behavior';
import { ScrollBehavior } from '../component/scroll-behaviour';
import { SelectionBehavior } from '../component/selection-behavior';
import { UserInterfaceInputBehavior } from '../component/user-interface-input-behavior';
import { UiBehaviorSharedState } from './ui-behavior-shared-state';

export class UiBehaviorServices {

    constructor(
        readonly sharedState: UiBehaviorSharedState,
        readonly mouse: Mouse,
        readonly canvasEx: CanvasEx,
        readonly selection: Selection,
        readonly focus: Focus,
        readonly columnsManager: ColumnsManager,
        readonly subgridsManager: SubgridsManager,
        readonly viewLayout: ViewLayout,
        readonly renderer: Renderer,
        readonly gridProperties: GridSettings,
        readonly reindexStashManager: ReindexStashManager,

        readonly scrollBehavior: ScrollBehavior,
        readonly focusBehavior: FocusBehavior,
        readonly selectionBehavior: SelectionBehavior,
        readonly userInterfaceInputBehavior: UserInterfaceInputBehavior,
        readonly rowPropertiesBehavior: RowPropertiesBehavior,
        readonly cellPropertiesBehavior: CellPropertiesBehavior,
        readonly dataExtractBehavior: DataExtractBehavior,
        readonly eventBehavior: EventBehavior,
    ) {

    }


}
