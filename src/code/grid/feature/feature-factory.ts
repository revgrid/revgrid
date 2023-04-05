
import { Behavior } from '../behavior/behavior';
import { CellClickFeature } from '../feature/cell-click-feature';
import { CellEditingFeature } from '../feature/cell-editing';
import { CellSelection } from '../feature/cell-selection';
import { ColumnMoving } from '../feature/column-moving';
import { ColumnResizing } from '../feature/column-resizing';
import { ColumnSelection } from '../feature/column-selection';
import { ColumnSorting } from '../feature/column-sorting';
import { Filters } from '../feature/filters';
import { KeyPaging } from '../feature/key-paging';
import { OnHover } from '../feature/on-hover';
import { RowResizing } from '../feature/row-resizing'; // should this be commented out?
import { RowSelection } from '../feature/row-selection';
import { ThumbwheelScrolling } from '../feature/thumbwheel-scrolling';
import { TouchScrolling } from '../feature/touch-scrolling';
import { Registry } from '../lib/registry';
import { Revgrid } from '../revgrid';
import { Feature } from './feature';
import { FeatureServices } from './feature-services';



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
FeatureFactory.register(CellSelection.typeName, CellSelection);
FeatureFactory.register(ColumnMoving.typeName, ColumnMoving);
FeatureFactory.register(ColumnResizing.typeName, ColumnResizing);
FeatureFactory.register(ColumnSelection.typeName, ColumnSelection);
FeatureFactory.register(ColumnSorting.typeName, ColumnSorting);
FeatureFactory.register(Filters.typeName, Filters);
FeatureFactory.register(KeyPaging.typeName, KeyPaging);
FeatureFactory.register(OnHover.typeName, OnHover);
FeatureFactory.register(RowResizing.typeName, RowResizing);
FeatureFactory.register(RowSelection.typeName, RowSelection);
FeatureFactory.register(ThumbwheelScrolling.typeName, ThumbwheelScrolling);
FeatureFactory.register(TouchScrolling.typeName, TouchScrolling);
