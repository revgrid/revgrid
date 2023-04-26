import { ColumnsManager } from '../column/columns-manager';
import { GridProperties } from '../grid-properties';
import { Renderer } from '../renderer/renderer';
import { Viewport } from '../renderer/viewport';

export class RendererBehavior {
    constructor(
        private readonly _gridProperties: GridProperties,
        private readonly _columnsManager: ColumnsManager,
        private readonly _viewport: Viewport,
        private readonly _renderer: Renderer,
    ) {

    }

}
