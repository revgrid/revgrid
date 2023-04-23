
import { Behavior } from '../behavior/behavior';
import { CellClickFeature } from '../feature/cell-click-feature';
import { Registry } from '../lib/registry';
import { Revgrid } from '../revgrid';
import { CellEditingFeature } from './cell-editing-feature';
import { CellSelectionFeature } from './cell-selection-feature';
import { ColumnMoving } from './column-moving-feature';
import { ColumnResizing } from './column-resizing-feature';
import { ColumnSelectionFeature } from './column-selection-feature';
import { ColumnSorting } from './column-sorting-feature';
import { Feature } from './feature';
import { FeatureServices } from './feature-services';
import { Filters } from './filters-feature';
import { KeyPaging } from './key-paging-feature';
import { OnHover } from './on-hover-feature';
import { RowResizing } from './row-resizing-feature'; // should this be commented out?
import { RowSelectionFeature } from './row-selection-feature';
import { ThumbwheelScrolling } from './thumbwheel-scrolling-feature';
import { TouchScrolling } from './touch-scrolling-feature';



/**
 * @classdesc Registry of feature constructors.
 */
export class FeatureFactory {
    private static _registry = new Registry<Feature.Constructor>();

    static register(name: string, constructor: Feature.Constructor) {
        this._registry.register(name, constructor);
    }

    static create(name: string, behavior: Behavior, grid: Revgrid, services: FeatureServices) {
        const constructor = this._registry.get(name);
        if (constructor === undefined) {
            return undefined;
        } else {
            return new constructor(behavior, grid, services);
        }
    }
}

FeatureFactory.register(CellClickFeature.typeName, CellClickFeature);
FeatureFactory.register(CellEditingFeature.typeName, CellEditingFeature);
FeatureFactory.register(CellSelectionFeature.typeName, CellSelectionFeature);
FeatureFactory.register(ColumnMoving.typeName, ColumnMoving);
FeatureFactory.register(ColumnResizing.typeName, ColumnResizing);
FeatureFactory.register(ColumnSelectionFeature.typeName, ColumnSelectionFeature);
FeatureFactory.register(ColumnSorting.typeName, ColumnSorting);
FeatureFactory.register(Filters.typeName, Filters);
FeatureFactory.register(KeyPaging.typeName, KeyPaging);
FeatureFactory.register(OnHover.typeName, OnHover);
FeatureFactory.register(RowResizing.typeName, RowResizing);
FeatureFactory.register(RowSelectionFeature.typeName, RowSelectionFeature);
FeatureFactory.register(ThumbwheelScrolling.typeName, ThumbwheelScrolling);
FeatureFactory.register(TouchScrolling.typeName, TouchScrolling);
