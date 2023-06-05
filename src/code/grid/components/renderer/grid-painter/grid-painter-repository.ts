import { BehavioredColumnSettings } from '../../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../../interfaces/settings/behaviored-grid-settings';
import { Registry } from '../../../types-utils/registry';
import { AssertError } from '../../../types-utils/revgrid-error';
import { CanvasManager } from '../../canvas/canvas-manager';
import { Focus } from '../../focus/focus';
import { Mouse } from '../../mouse/mouse';
import { Selection } from '../../selection/selection';
import { SubgridsManager } from '../../subgrid/subgrids-manager';
import { ViewLayout } from '../../view/view-layout';
import { AsNeededGridPainter } from './as-needed-grid-painter';
import { ByColumnsAndRowsGridPainter } from './by-columns-and-rows-grid-painter';
import { ByColumnsDiscreteGridPainter } from './by-columns-discrete-grid-painter';
import { ByColumnsGridPainter } from './by-columns-grid-painter';
import { ByRowsGridPainter } from './by-rows-grid-painter';
import { GridPainter } from './grid-painter';

export class GridPainterRepository<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings> {
    private constructorRegistry = new Registry<GridPainter.Constructor<BGS, BCS>>();
    private cache = new Map<string, GridPainter<BGS, BCS>>();

    constructor(
        private readonly _gridSettings: BGS,
        private readonly _canvasEx: CanvasManager<BGS>,
        private readonly _subgridsManager: SubgridsManager<BGS, BCS>,
        private readonly _viewLayout: ViewLayout<BGS, BCS>,
        private readonly _focus: Focus<BGS, BCS>,
        private readonly _selection: Selection<BGS, BCS>,
        private readonly _mouse: Mouse<BGS, BCS>,
        private readonly _repaintAllRequiredEventer: GridPainter.RepaintAllRequiredEventer,
    ) {
        // preregister the standard grid painters
        this.constructorRegistry.register(AsNeededGridPainter.key, AsNeededGridPainter<BGS, BCS>);
        this.constructorRegistry.register(ByColumnsGridPainter.key, ByColumnsGridPainter<BGS, BCS>);
        this.constructorRegistry.register(ByColumnsDiscreteGridPainter.key, ByColumnsDiscreteGridPainter<BGS, BCS>);
        this.constructorRegistry.register(ByColumnsAndRowsGridPainter.key, ByColumnsAndRowsGridPainter<BGS, BCS>);
        this.constructorRegistry.register(ByRowsGridPainter.key, ByRowsGridPainter<BGS, BCS>);
    }

    get(key: string) {
        let gridPainter = this.cache.get(key);
        if (gridPainter === undefined) {
            const constructor = this.constructorRegistry.get(key);
            if (constructor === undefined) {
                throw new AssertError('GPRG87773', key);
            } else {
                gridPainter = new constructor(
                    this._gridSettings,
                    this._canvasEx,
                    this._subgridsManager,
                    this._viewLayout,
                    this._focus,
                    this._selection,
                    this._mouse,
                    this._repaintAllRequiredEventer,
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

    register(key: string, constructor: GridPainter.Constructor<BGS, BCS>) {
        this.constructorRegistry.register(key, constructor);
    }
}
