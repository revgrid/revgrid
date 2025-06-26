import { RevClientObject, RevMetaServer, RevSchemaField } from '../../common';
import { RevViewLayout } from '../components/view/view-layout';
import { RevSubgrid } from '../interfaces/subgrid';
import { RevViewCell } from '../interfaces/view-cell';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings } from '../settings';

export class RevRowPropertiesBehavior<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> implements RevClientObject {
    constructor(
        readonly clientId: string,
        readonly internalParent: RevClientObject,
        private readonly _viewLayout: RevViewLayout<BGS, BCS, SF>
    ) {
    }

    /**
     * set the pixel height of a specific row
     * @param rowIndex - Data row index local to dataModel.
     * @param height - pixel height
     */
    setRowHeight(rowIndex: number, height: number, subgrid: RevSubgrid<BCS, SF>) {
        const setSucceeded = subgrid.setRowProperty(rowIndex, 'height', true, height);
        if (setSucceeded) {
            this._viewLayout.invalidateHorizontalAll(true);
        }
    }

    /**
     * Reset the row properties in its entirety to the given row properties object.
     * @param rowIndex - Data row index local to `dataModel`.
     * @param properties - The new row properties object. If `undefined`, this call is a no-op.
     * @param subgrid - This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     */
    setRowProperties(rowIndex: number, properties: RevMetaServer.RowProperties | undefined, subgrid: RevSubgrid<BCS, SF>): void {
        const setSucceeded = subgrid.setRowProperties(rowIndex, properties);
        if (setSucceeded) {
            this._viewLayout.invalidateHorizontalAll(false);
        }
    }

    setRowPropertiesUsingCell(cell: RevViewCell<BCS, SF>, properties: RevMetaServer.RowProperties | undefined) {
        this.setRowProperties(cell.viewLayoutRow.subgridRowIndex, properties, cell.subgrid)
    }


    /**
     * Sets a single row property on a specific individual row.
     * @param y - Data row index local to `dataModel`.
     * @param key - The property name.
     * @param value - The new property value.
     * @param subgrid - This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     */
    setRowProperty(y: number, key: string, value: unknown, subgrid: RevSubgrid<BCS, SF>) {
        const isHeight = (key === 'height');
        const setSucceeded = subgrid.setRowProperty(y, key, isHeight, value);
        if (setSucceeded) {
            this._viewLayout.invalidateHorizontalAll(isHeight);
        }
    }

    setRowPropertyUsingCell(cell: RevViewCell<BCS, SF>, key: string, value: unknown) {
        this.setRowProperty(cell.viewLayoutRow.subgridRowIndex, key, value, cell.subgrid);
    }

    // addRowPropertiesUsingCellEvent(cellEvent: CellEvent, properties: RevMetaServer.RowProperties | undefined, rowProps?: RevMetaServer.RowProperties) {
    //     this.addRowProperties(cellEvent.dataCell.y, properties, cellEvent.subgrid, rowProps);
    // }

    // /**
    //  * Add all the properties in the given row properties object to the row properties.
    //  * @param yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
    //  * @param properties - An object containing new property values(s) to assign to the row properties. If `undefined`, this call is a no-op.
    //  * @param subgrid - This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
    //  */

    // addRowProperties(y: number, properties: RevMetaServer.RowProperties | undefined, subgrid: Subgrid, rowProps?: RevMetaServer.RowProperties | false) {

    //     let isHeight: boolean;
    //     let hasHeight = false;

    //     let resolvedRowProps: RevMetaServer.RowProperties | false | undefined;
    //     if (rowProps) {
    //         resolvedRowProps = rowProps;
    //     } else {
    //         resolvedRowProps = this.getRowProperties(y, this._rowPropertiesPrototype, subgrid);
    //     }

    //     if (resolvedRowProps) {
    //         for (const key in properties) {
    //             const typedKey = key as (keyof RevMetaServer.RowProperties)
    //             const value = properties[typedKey];
    //             if (value !== undefined) {
    //                 resolvedRowProps[typedKey] = value;
    //             } else {
    //                 isHeight = key === 'height';
    //                 const fixedKey = (isHeight ? '_height' : typedKey) as (keyof RevMetaServer.RowProperties);
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

export namespace RevRowPropertiesBehavior {
    export type InvalidateViewEventer = (this: void, scrollablePlaneDimensionAsWell: boolean) => void;
}
