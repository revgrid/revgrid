import { CanvasEx } from '../canvas/canvas-ex';
import { Focus } from '../focus';
import { GridProperties } from '../grid-properties';
import { Registry } from '../lib/registry';
import { AssertError } from '../lib/revgrid-error';
import { Renderer } from '../renderer/renderer';
import { Viewport } from '../renderer/viewport';
import { Selection } from '../selection/selection';
import { SubgridsManager } from '../subgrid/subgrids-manager';
import { Mouse } from '../user-interface-input/mouse';
import { AsNeededGridPainter } from './as-needed-grid-painter';
import { ByColumnsAndRowsGridPainter } from './by-columns-and-rows-grid-painter';
import { ByColumnsDiscreteGridPainter } from './by-columns-discrete-grid-painter';
import { ByColumnsGridPainter } from './by-columns-grid-painter';
import { ByRowsGridPainter } from './by-rows-grid-painter';
import { GridPainter } from './grid-painter';

export class GridPainterRepository {
    private constructorRegistry = new Registry<GridPainter.Constructor>();
    private cache = new Map<string, GridPainter>();

    constructor(
        private readonly _gridProperties: GridProperties,
        private readonly _mouse: Mouse,
        private readonly _canvasEx: CanvasEx,
        private readonly _subgridsManager: SubgridsManager,
        private readonly _viewport: Viewport,
        private readonly _focus: Focus,
        private readonly _selection: Selection,
        private readonly _renderer: Renderer,
    ) {
        // preregister the standard grid painters
        this.constructorRegistry.register(AsNeededGridPainter.key, AsNeededGridPainter);
        this.constructorRegistry.register(ByColumnsGridPainter.key, ByColumnsGridPainter);
        this.constructorRegistry.register(ByColumnsDiscreteGridPainter.key, ByColumnsDiscreteGridPainter);
        this.constructorRegistry.register(ByColumnsAndRowsGridPainter.key, ByColumnsAndRowsGridPainter);
        this.constructorRegistry.register(ByRowsGridPainter.key, ByRowsGridPainter);
    }

    get(key: string) {
        let gridPainter = this.cache.get(key);
        if (gridPainter === undefined) {
            const constructor = this.constructorRegistry.get(key);
            if (constructor === undefined) {
                throw new AssertError('GPRG87773', key);
            } else {
                gridPainter = new constructor(
                    this._gridProperties,
                    this._mouse,
                    this._canvasEx,
                    this._subgridsManager,
                    this._viewport,
                    this._focus,
                    this._selection,
                    this._renderer
                );
                this.cache.set(key, gridPainter);
            }
        }
        return gridPainter;
    }

    allCreatedEntries() {
        return this.cache.entries();
    }

    allCreated() {
        return this.cache.values();
    }

    register(key: string, constructor: GridPainter.Constructor) {
        this.constructorRegistry.register(key, constructor);
    }
}
