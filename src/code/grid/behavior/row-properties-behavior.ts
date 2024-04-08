import { ViewLayout } from '../components/view/view-layout';
import { MetaModel } from '../interfaces/data/meta-model';
import { Subgrid } from '../interfaces/data/subgrid';
import { ViewCell } from '../interfaces/data/view-cell';
import { SchemaField } from '../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../interfaces/settings/behaviored-grid-settings';
import { RevgridObject } from '../types-utils/revgrid-object';

export class RowPropertiesBehavior<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> implements RevgridObject {
    constructor(
        readonly revgridId: string,
        readonly internalParent: RevgridObject,
        private readonly _viewLayout: ViewLayout<BGS, BCS, SF>
    ) {
    }

    /**
     * set the pixel height of a specific row
     * @param rowIndex - Data row index local to dataModel.
     * @param height - pixel height
     */
    setRowHeight(rowIndex: number, height: number, subgrid: Subgrid<BCS, SF>) {
        const setSucceeded = subgrid.setRowProperty(rowIndex, 'height', true, height);
        if (setSucceeded) {
            this._viewLayout.invalidateHorizontalAll(true);
        }
    }

    /**
     * Reset the row properties in its entirety to the given row properties object.
     * @param yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
     * @param properties - The new row properties object. If `undefined`, this call is a no-op.
     * @param subgrid - This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     */
    setRowPropertiesUsingCell(cell: ViewCell<BCS, SF>, properties: MetaModel.RowProperties | undefined) {
        this.setRowProperties(cell.viewLayoutRow.subgridRowIndex, properties, cell.subgrid)
    }

    setRowProperties(rowIndex: number, properties: MetaModel.RowProperties | undefined, subgrid: Subgrid<BCS, SF>): void {
        const setSucceeded = subgrid.setRowProperties(rowIndex, properties);
        if (setSucceeded) {
            this._viewLayout.invalidateHorizontalAll(false);
        }
    }

    /**
     * Sets a single row property on a specific individual row.
     * @param yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
     * @param key - The property name.
     * @param value - The new property value.
     * @param dataModel - This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     */

    setRowPropertyUsingCell(cell: ViewCell<BCS, SF>, key: string, value: unknown) {
        this.setRowProperty(cell.viewLayoutRow.subgridRowIndex, key, value, cell.subgrid);
    }

    setRowProperty(y: number, key: string, value: unknown, subgrid: Subgrid<BCS, SF>) {
        const isHeight = (key === 'height');
        const setSucceeded = subgrid.setRowProperty(y, key, isHeight, value);
        if (setSucceeded) {
            this._viewLayout.invalidateHorizontalAll(isHeight);
        }
    }

    // addRowPropertiesUsingCellEvent(cellEvent: CellEvent, properties: MetaModel.RowProperties | undefined, rowProps?: MetaModel.RowProperties) {
    //     this.addRowProperties(cellEvent.dataCell.y, properties, cellEvent.subgrid, rowProps);
    // }

    // /**
    //  * Add all the properties in the given row properties object to the row properties.
    //  * @param yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
    //  * @param properties - An object containing new property values(s) to assign to the row properties. If `undefined`, this call is a no-op.
    //  * @param subgrid - This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
    //  */

    // addRowProperties(y: number, properties: MetaModel.RowProperties | undefined, subgrid: Subgrid, rowProps?: MetaModel.RowProperties | false) {

    //     let isHeight: boolean;
    //     let hasHeight = false;

    //     let resolvedRowProps: MetaModel.RowProperties | false | undefined;
    //     if (rowProps) {
    //         resolvedRowProps = rowProps;
    //     } else {
    //         resolvedRowProps = this.getRowProperties(y, this._rowPropertiesPrototype, subgrid);
    //     }

    //     if (resolvedRowProps) {
    //         for (const key in properties) {
    //             const typedKey = key as (keyof MetaModel.RowProperties)
    //             const value = properties[typedKey];
    //             if (value !== undefined) {
    //                 resolvedRowProps[typedKey] = value;
    //             } else {
    //                 isHeight = key === 'height';
    //                 const fixedKey = (isHeight ? '_height' : typedKey) as (keyof MetaModel.RowProperties);
    //                 delete resolvedRowProps[fixedKey];
    //                 hasHeight ||= isHeight;
    //             }
    //         }

    //         if (hasHeight) {
    //             this._behaviorShapeChangedEventer();
    //         } else {
    //             this._behaviorStateChangedEventer();
    //         }
    //     }
    // }
}

export namespace RowPropertiesBehavior {
    export type InvalidateViewEventer = (this: void, scrollablePlaneDimensionAsWell: boolean) => void;
}
