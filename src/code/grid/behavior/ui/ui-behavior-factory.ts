
import { Registry } from '../../lib/registry';
import { CellClickUiBehavior } from './cell-click-ui-behavior';
import { CellSelectionUiBehavior } from './cell-selection-ui-behavior';
import { ClipboardUiBehavior } from './clipboard-ui-action';
import { ColumnMovingUiBehavior } from './column-moving-ui-behavior';
import { ColumnResizingUiBehavior } from './column-resizing-ui-behavior';
import { ColumnSelectionUiBehavior } from './column-selection-ui-behavior';
import { ColumnSortingUiBehavior } from './column-sorting-ui-behavior';
import { FiltersUiBehavior } from './filters-ui-behavior';
import { FocusUiBehavior } from './focus-ui-behavior';
import { OnHoverUiBehavior } from './on-hover-ui-behavior';
import { RowResizingUiBehavior } from './row-resizing-ui-behavior'; // should this be commented out?
import { RowSelectionUiBehavior } from './row-selection-ui-behavior';
import { ThumbwheelScrollingUiBehavior } from './thumbwheel-scrolling-ui-behavior';
import { TouchScrollingUiBehavior } from './touch-scrolling-ui-behavior';
import { UiBehavior } from './ui-behavior';
import { UiBehaviorServices } from './ui-behavior-services';



/**
 * @classdesc Registry of feature constructors.
 */
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

UiBehaviorFactory.register(FocusUiBehavior.typeName, FocusUiBehavior);
UiBehaviorFactory.register(CellClickUiBehavior.typeName, CellClickUiBehavior);
// UiBehaviorFactory.register(CellEditingFeature.typeName, CellEditingFeature);
UiBehaviorFactory.register(CellSelectionUiBehavior.typeName, CellSelectionUiBehavior);
UiBehaviorFactory.register(ColumnMovingUiBehavior.typeName, ColumnMovingUiBehavior);
UiBehaviorFactory.register(ColumnResizingUiBehavior.typeName, ColumnResizingUiBehavior);
UiBehaviorFactory.register(ColumnSelectionUiBehavior.typeName, ColumnSelectionUiBehavior);
UiBehaviorFactory.register(ColumnSortingUiBehavior.typeName, ColumnSortingUiBehavior);
UiBehaviorFactory.register(FiltersUiBehavior.typeName, FiltersUiBehavior);
UiBehaviorFactory.register(OnHoverUiBehavior.typeName, OnHoverUiBehavior);
UiBehaviorFactory.register(RowResizingUiBehavior.typeName, RowResizingUiBehavior);
UiBehaviorFactory.register(RowSelectionUiBehavior.typeName, RowSelectionUiBehavior);
UiBehaviorFactory.register(ThumbwheelScrollingUiBehavior.typeName, ThumbwheelScrollingUiBehavior);
UiBehaviorFactory.register(TouchScrollingUiBehavior.typeName, TouchScrollingUiBehavior);
UiBehaviorFactory.register(ClipboardUiBehavior.typeName, ClipboardUiBehavior);
