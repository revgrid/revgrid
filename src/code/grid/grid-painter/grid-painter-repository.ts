
import { AssertError } from '../grid-public-api';
import { Registry } from '../lib/registry';
import { Renderer } from '../renderer/renderer';
import { Selection } from '../selection/selection';
import { SubgridsManager } from '../subgrid/subgrids-manager';
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
        private readonly _subgridsManager: SubgridsManager,
        private readonly _renderer: Renderer,
        private readonly _selection: Selection
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
                gridPainter = new constructor(this._subgridsManager, this._renderer, this._selection);
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
