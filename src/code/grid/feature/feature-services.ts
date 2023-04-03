import { ColumnsManager } from '../column/columns-manager';
import { Focus } from '../focus';
import { GridProperties } from '../grid-properties';
import { Renderer } from '../renderer/renderer';
import { Selection } from '../selection/selection';
import { FeaturesSharedState } from './features-shared-state';

export class FeatureServices {

    constructor(
        readonly sharedState: FeaturesSharedState,
        readonly selection: Selection,
        readonly focus: Focus,
        readonly columnsManager: ColumnsManager,
        readonly renderer: Renderer,
        readonly gridProperties: GridProperties,
    ) {

    }


}
