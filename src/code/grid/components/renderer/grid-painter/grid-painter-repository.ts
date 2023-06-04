import { MergableColumnSettings } from '../../../interfaces/settings/mergable-column-settings';
import { MergableGridSettings } from '../../../interfaces/settings/mergable-grid-settings';
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

export class GridPainterRepository<MGS extends MergableGridSettings, MCS extends MergableColumnSettings> {
    private constructorRegistry = new Registry<GridPainter.Constructor<MGS, MCS>>();
    private cache = new Map<string, GridPainter<MGS, MCS>>();

    constructor(
        private readonly _gridSettings: MGS,
        private readonly _canvasEx: CanvasManager<MGS>,
        private readonly _subgridsManager: SubgridsManager<MGS, MCS>,
        private readonly _viewLayout: ViewLayout<MGS, MCS>,
        private readonly _focus: Focus<MGS, MCS>,
        private readonly _selection: Selection<MGS, MCS>,
        private readonly _mouse: Mouse<MGS, MCS>,
        private readonly _repaintAllRequiredEventer: GridPainter.RepaintAllRequiredEventer,
    ) {
        // preregister the standard grid painters
        this.constructorRegistry.register(AsNeededGridPainter.key, AsNeededGridPainter<MGS, MCS>);
        this.constructorRegistry.register(ByColumnsGridPainter.key, ByColumnsGridPainter<MGS, MCS>);
        this.constructorRegistry.register(ByColumnsDiscreteGridPainter.key, ByColumnsDiscreteGridPainter<MGS, MCS>);
        this.constructorRegistry.register(ByColumnsAndRowsGridPainter.key, ByColumnsAndRowsGridPainter<MGS, MCS>);
        this.constructorRegistry.register(ByRowsGridPainter.key, ByRowsGridPainter<MGS, MCS>);
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

    register(key: string, constructor: GridPainter.Constructor<MGS, MCS>) {
        this.constructorRegistry.register(key, constructor);
    }
}
