import { CanvasEx } from '../../canvas/canvas-ex';
import { ColumnsManager } from '../../column/columns-manager';
import { Focus } from '../../focus';
import { GridProperties } from '../../grid-properties';
import { Renderer } from '../../renderer/renderer';
import { Viewport } from '../../renderer/viewport';
import { Selection } from '../../selection/selection';
import { SubgridsManager } from '../../subgrid/subgrids-manager';
import { Mouse } from '../../user-interface-input/mouse';
import { CellPropertiesBehavior } from '../cell-properties-behavior';
import { EventBehavior } from '../event-behavior';
import { FocusSelectionBehavior } from '../focus-selection-behavior';
import { RowPropertiesBehavior } from '../row-properties-behavior';
import { ScrollBehavior } from '../scroll-behaviour';
import { UserInterfaceInputBehavior } from '../user-interface-input-behavior';
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
        readonly viewport: Viewport,
        readonly renderer: Renderer,
        readonly gridProperties: GridProperties,

        readonly focusSelectionBehavior: FocusSelectionBehavior,
        readonly userInterfaceInputBehavior: UserInterfaceInputBehavior,
        readonly scrollBehavior: ScrollBehavior,
        readonly rowPropertiesBehavior: RowPropertiesBehavior,
        readonly cellPropertiesBehavior: CellPropertiesBehavior,
        readonly eventBehavior: EventBehavior,
    ) {

    }


}
