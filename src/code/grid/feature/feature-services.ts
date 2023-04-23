import { CanvasEx } from '../canvas/canvas-ex';
import { ColumnsManager } from '../column/columns-manager';
import { Focus } from '../focus';
import { GridProperties } from '../grid-properties';
import { Viewport } from '../renderer/viewport';
import { Selection } from '../selection/selection';
import { SubgridsManager } from '../subgrid/subgrids-manager';
import { FeaturesSharedState } from './features-shared-state';

export class FeatureServices {

    constructor(
        readonly sharedState: FeaturesSharedState,
        readonly canvasEx: CanvasEx,
        readonly selection: Selection,
        readonly focus: Focus,
        readonly columnsManager: ColumnsManager,
        readonly subgridsManager: SubgridsManager,
        readonly renderer: Viewport,
        readonly gridProperties: GridProperties,
    ) {

    }


}
