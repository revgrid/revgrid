import { RevAssertError, RevRegistry, RevSchemaField } from '../../../../common/internal-api';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevGridSettings } from '../../../settings/internal-api';
import { RevCanvas } from '../../canvas/canvas';
import { RevFocus } from '../../focus/focus';
import { RevMouse } from '../../mouse/mouse';
import { RevSelection } from '../../selection/selection';
import { RevSubgridsManager } from '../../subgrid/subgrids-manager';
import { RevViewLayout } from '../../view/view-layout';
import { RevAsNeededGridPainter } from './as-needed-grid-painter';
import { RevByColumnsAndRowsGridPainter } from './by-columns-and-rows-grid-painter';
import { RevByColumnsDiscreteGridPainter } from './by-columns-discrete-grid-painter';
import { RevByColumnsGridPainter } from './by-columns-grid-painter';
import { RevByRowsGridPainter } from './by-rows-grid-painter';
import { RevGridPainter } from './grid-painter';

export class RevGridPainterRepository<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
    private constructorRegistry = new RevRegistry<RevGridPainter.Constructor<BGS, BCS, SF>>();
    private cache = new Map<string, RevGridPainter<BGS, BCS, SF>>();

    constructor(
        private readonly _gridSettings: RevGridSettings,
        private readonly _canvas: RevCanvas<BGS>,
        private readonly _subgridsManager: RevSubgridsManager<BCS, SF>,
        private readonly _viewLayout: RevViewLayout<BGS, BCS, SF>,
        private readonly _focus: RevFocus<BGS, BCS, SF>,
        private readonly _selection: RevSelection<BGS, BCS, SF>,
        private readonly _mouse: RevMouse<BGS, BCS, SF>,
        private readonly _repaintAllRequiredEventer: RevGridPainter.RepaintAllRequiredEventer,
    ) {
        // preregister the standard grid painters
        this.constructorRegistry.register(RevAsNeededGridPainter.key, RevAsNeededGridPainter<BGS, BCS, SF>);
        this.constructorRegistry.register(RevByColumnsGridPainter.key, RevByColumnsGridPainter<BGS, BCS, SF>);
        this.constructorRegistry.register(RevByColumnsDiscreteGridPainter.key, RevByColumnsDiscreteGridPainter<BGS, BCS, SF>);
        this.constructorRegistry.register(RevByColumnsAndRowsGridPainter.key, RevByColumnsAndRowsGridPainter<BGS, BCS, SF>);
        this.constructorRegistry.register(RevByRowsGridPainter.key, RevByRowsGridPainter<BGS, BCS, SF>);
    }

    get(key: string) {
        let gridPainter = this.cache.get(key);
        if (gridPainter === undefined) {
            const constructor = this.constructorRegistry.get(key);
            if (constructor === undefined) {
                throw new RevAssertError('GPRG87773', key);
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

    register(key: string, constructor: RevGridPainter.Constructor<BGS, BCS, SF>) {
        this.constructorRegistry.register(key, constructor);
    }
}
