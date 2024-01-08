import { SchemaField } from '../../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../../interfaces/settings/behaviored-grid-settings';
import { GridSettings } from '../../../interfaces/settings/grid-settings';
import { Registry } from '../../../types-utils/registry';
import { AssertError } from '../../../types-utils/revgrid-error';
import { Canvas } from '../../canvas/canvas';
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

export class GridPainterRepository<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> {
    private constructorRegistry = new Registry<GridPainter.Constructor<BGS, BCS, SF>>();
    private cache = new Map<string, GridPainter<BGS, BCS, SF>>();

    constructor(
        private readonly _gridSettings: GridSettings,
        private readonly _canvas: Canvas<BGS>,
        private readonly _subgridsManager: SubgridsManager<BCS, SF>,
        private readonly _viewLayout: ViewLayout<BGS, BCS, SF>,
        private readonly _focus: Focus<BGS, BCS, SF>,
        private readonly _selection: Selection<BGS, BCS, SF>,
        private readonly _mouse: Mouse<BGS, BCS, SF>,
        private readonly _repaintAllRequiredEventer: GridPainter.RepaintAllRequiredEventer,
    ) {
        // preregister the standard grid painters
        this.constructorRegistry.register(AsNeededGridPainter.key, AsNeededGridPainter<BGS, BCS, SF>);
        this.constructorRegistry.register(ByColumnsGridPainter.key, ByColumnsGridPainter<BGS, BCS, SF>);
        this.constructorRegistry.register(ByColumnsDiscreteGridPainter.key, ByColumnsDiscreteGridPainter<BGS, BCS, SF>);
        this.constructorRegistry.register(ByColumnsAndRowsGridPainter.key, ByColumnsAndRowsGridPainter<BGS, BCS, SF>);
        this.constructorRegistry.register(ByRowsGridPainter.key, ByRowsGridPainter<BGS, BCS, SF>);
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
                    this._canvas,
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

    register(key: string, constructor: GridPainter.Constructor<BGS, BCS, SF>) {
        this.constructorRegistry.register(key, constructor);
    }
}
