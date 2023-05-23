
import { Registry } from '../../lib/registry';
import { CellClickUiBehavior } from './cell-click-ui-behavior';
import { ClipboardUiBehavior } from './clipboard-ui-action';
import { ColumnMovingUiBehavior } from './column-moving-ui-behavior';
import { ColumnResizingUiBehavior } from './column-resizing-ui-behavior';
import { ColumnSortingUiBehavior } from './column-sorting-ui-behavior';
import { FiltersUiBehavior } from './filters-ui-behavior';
import { FocusScrollUiBehavior } from './focus-scroll-ui-behavior';
import { HoverUiBehavior } from './hover-ui-behavior';
import { RowResizingUiBehavior } from './row-resizing-ui-behavior'; // should this be commented out?
import { SelectionUiBehavior } from './selection-ui-behavior';
import { TouchScrollingUiBehavior } from './touch-scrolling-ui-behavior';
import { UiBehavior } from './ui-behavior';
import { UiBehaviorServices } from './ui-behavior-services';

/** @internal */
export class UiBehaviorFactory {
    private static _registry = new Registry<UiBehavior.Constructor>();

    static register(name: string, constructor: UiBehavior.Constructor) {
        this._registry.register(name, constructor);
    }

    static create(name: string, services: UiBehaviorServices) {
        const constructor = this._registry.get(name);
        if (constructor === undefined) {
            return undefined;
        } else {
            return new constructor(services);
        }
    }
}

UiBehaviorFactory.register(FocusScrollUiBehavior.typeName, FocusScrollUiBehavior);
UiBehaviorFactory.register(CellClickUiBehavior.typeName, CellClickUiBehavior);
// UiBehaviorFactory.register(CellEditingFeature.typeName, CellEditingFeature);
UiBehaviorFactory.register(SelectionUiBehavior.typeName, SelectionUiBehavior);
UiBehaviorFactory.register(ColumnMovingUiBehavior.typeName, ColumnMovingUiBehavior);
UiBehaviorFactory.register(ColumnResizingUiBehavior.typeName, ColumnResizingUiBehavior);
UiBehaviorFactory.register(ColumnSortingUiBehavior.typeName, ColumnSortingUiBehavior);
UiBehaviorFactory.register(FiltersUiBehavior.typeName, FiltersUiBehavior);
UiBehaviorFactory.register(HoverUiBehavior.typeName, HoverUiBehavior);
UiBehaviorFactory.register(RowResizingUiBehavior.typeName, RowResizingUiBehavior);
UiBehaviorFactory.register(TouchScrollingUiBehavior.typeName, TouchScrollingUiBehavior);
UiBehaviorFactory.register(ClipboardUiBehavior.typeName, ClipboardUiBehavior);
