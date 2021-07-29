
import { Registry } from '../lib/registry';
import { CellClickFeature } from './cell-click-feature';
import { CellEditingFeature } from './cell-editing';
import { CellSelection } from './cell-selection';
import { ColumnMoving } from './column-moving';
import { ColumnResizing } from './column-resizing';
import { ColumnSelection } from './column-selection';
import { ColumnSorting } from './column-sorting';
import { Feature } from './feature';
import { Filters } from './filters';
import { KeyPaging } from './key-paging';
import { OnHover } from './on-hover';
import { RowResizing } from './row-resizing'; // should this be commented out?
import { RowSelection } from './row-selection';
import { ThumbwheelScrolling } from './thumbwheel-scrolling';
import { TouchScrolling } from './touch-scrolling';



/**
 * @classdesc Registry of feature constructors.
 */
class FeatureFactory {
    private _registry = new Registry<Feature.Constructor>();

    constructor() {
        this.register(CellClickFeature.typeName, CellClickFeature);
        this.register(CellEditingFeature.typeName, CellEditingFeature);
        this.register(CellSelection.typeName, CellSelection);
        this.register(ColumnMoving.typeName, ColumnMoving);
        this.register(ColumnResizing.typeName, ColumnResizing);
        this.register(ColumnSelection.typeName, ColumnSelection);
        this.register(ColumnSorting.typeName, ColumnSorting);
        this.register(Filters.typeName, Filters);
        this.register(KeyPaging.typeName, KeyPaging);
        this.register(OnHover.typeName, OnHover);
        this.register(RowResizing.typeName, RowResizing);
        this.register(RowSelection.typeName, RowSelection);
        this.register(ThumbwheelScrolling.typeName, ThumbwheelScrolling);
        this.register(TouchScrolling.typeName, TouchScrolling);
    }

    register(name: string, constructor: Feature.Constructor) {
        this._registry.register(name, constructor);
    }

    create(name: string) {
        const constructor = this._registry.get(name);
        if (constructor === undefined) {
            return undefined;
        } else {
            return new constructor();
        }
    }
}

export const featureFactory = new FeatureFactory();
