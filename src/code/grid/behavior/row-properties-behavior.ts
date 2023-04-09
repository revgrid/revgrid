import { CellEvent } from '../cell/cell-event';
import { RenderedCell } from '../cell/rendered-cell';
import { SubgridInterface } from '../common/subgrid-interface';
import { GridProperties } from '../grid-properties';
import { AssertError } from '../lib/revgrid-error';
import { MetaModel } from '../model/meta-model';
import { Subgrid } from '../subgrid/subgrid';

export class RowPropertiesBehavior {
    constructor(
        private readonly _gridProperties: GridProperties,
        private readonly _rowPropertiesPrototype: MetaModel.RowPropertiesPrototype,
        private readonly _behaviorStateChangedEventer: RowPropertiesBehavior.BehaviouStateChangedEventer,
        private readonly _behaviorShapeChangedEventer: RowPropertiesBehavior.BehaviorShapeChangedEventer,
    ) {
    }

    // getRowProperties(yOrCellEvent: number | CellEvent,
    //     rowPropertiesPrototype?: DataModel.RowPropertiesPrototype,
    //     subgrid?: Subgrid): DataModel.RowProperties | false | undefined;
    // getRowProperties(y: number,
    //     rowPropertiesPrototype?: DataModel.RowPropertiesPrototype,
    //     subgrid?: Subgrid): DataModel.RowProperties | false | undefined;

    /**
     * @param yOrCellEvent - Data row index local to `dataModel`.
     * @returns The row height in pixels.
     */
    getRowHeight(y: number, subgrid: Subgrid) {
        const rowProps = this.getRowProperties(y, subgrid);
        if (rowProps === undefined) {
            return this._gridProperties.defaultRowHeight;
        } else {
            return rowProps.height ?? this._gridProperties.defaultRowHeight;
        }
    }

    /**
     * @desc set the pixel height of a specific row
     * @param yOrCellEvent - Data row index local to dataModel.
     * @param height - pixel height
     */
    setRowHeight(yOrCellEvent: number, height: number, subgrid: Subgrid) {
        this.setRowProperty(yOrCellEvent, 'height', height, subgrid);
    }


    getRowOwnPropertiesRC(cellEvent: CellEvent) {
        // undefined return means there is no row properties object
        return this.getRowPropertiesUsingCellEvent(cellEvent);
    }

    getRowPropertiesRC(renderedCell: RenderedCell) {
        // use carefully! creates new object as needed; only use when object definitely needed: for setting prop with `.rowProperties[key] = value` or `Object.assign(.rowProperties, {...})`; use `rowOwnProperties`  to avoid creating a new object when object does not exist, or `getRowProperty(key)` for getting a property that may not exist
        const properties = this.getRowPropertiesUsingCellEvent(renderedCell);
        if (properties) {
            return properties;
        } else {
            return undefined;
        }
    }

    getRowPropertyRC(renderedCell: RenderedCell, key: string) {
        // undefined return means there is no row properties object OR no such row property `[key]`
        const rowProps = this.getRowOwnPropertiesRC(renderedCell);
        return rowProps && rowProps[key as keyof MetaModel.RowProperties];
    }

    setRowPropertyRC(renderedCell: RenderedCell, key: string, value: unknown) {
        // creates new object as needed
        const rowProperties = this.getRowPropertiesRC(renderedCell);
        if (rowProperties !== undefined) {
            (rowProperties[key as keyof MetaModel.RowProperties] as unknown) = value; // todo: call `stateChanged()` after refac-as-flags
        }
    }

    /**
     * @param yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
     * @param rowPropertiesPrototype - Prototype for a new properties object when one does not already exist. If you don't define this and one does not already exist, this call will return `undefined`.
     * Typical defined value is `null`, which creates a plain object with no prototype, or `Object.prototype` for a more "natural" object.
     * _(Required when 3rd param provided.)_
     * @param subgrid- This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     * @returns The row properties object which will be one of:
     * * object - existing row properties object or new row properties object created from `prototype`; else
     * * `false` - MetaModel get function not set up; else
     * * `null` - row does not exist
     * * `undefined` - row exists but does not have any properties
     */
    getRowProperties(y: number, subgrid: SubgridInterface): MetaModel.RowProperties | undefined {
        const metadata = subgrid.getRowMetadata(y);
        if (metadata === undefined) {
            return undefined;
        } else {
            return metadata.__ROW;
        }
    }

    getRowPropertiesUsingCellEvent(cellInfo: RenderedCell) {
        return this.getRowProperties(cellInfo.dataCell.y, cellInfo.subgrid);
    }

    /**
     * Reset the row properties in its entirety to the given row properties object.
     * @param yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
     * @param properties - The new row properties object. If `undefined`, this call is a no-op.
     * @param subgrid - This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     */
    setRowPropertiesUsingCellEvent(cellInfo: RenderedCell, properties: MetaModel.RowProperties | undefined) {
        this.setRowProperties(cellInfo.dataCell.y, properties, cellInfo.subgrid)
    }

    setRowProperties(y: number, properties: MetaModel.RowProperties | undefined, subgrid: SubgridInterface): void {
        const metadata = subgrid.getRowMetadata(y);
        this.setRowMetadataRowProperties(y, metadata, properties, subgrid);
        // if (metadata) {
        //     metadata.__ROW = Object.create(this._rowPropertiesPrototype);
        // }
    }

    /**
     * Sets a single row property on a specific individual row.
     * @param yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
     * @param key - The property name.
     * @param value - The new property value.
     * @param dataModel - This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     */

    setRowPropertyUsingCellEvent(cellEvent: CellEvent, key: string, value: unknown) {
        this.setRowProperty(cellEvent.dataCell.y, key, value, cellEvent.subgrid);
    }

    setRowProperty(y: number, key: string, value: unknown, subgrid: SubgridInterface) {
        let metadata = subgrid.getRowMetadata(y);
        if (metadata === undefined) {
            metadata = Object.create(this._rowPropertiesPrototype) as MetaModel.RowMetadata;
        }
        let properties: MetaModel.RowProperties | undefined = metadata.__ROW;

        const isHeight = (key === 'height');
        if (value !== undefined) {
            if (properties === undefined) {
                const createdProperties = Object.create(this._rowPropertiesPrototype);
                if (createdProperties === null) {
                    throw new AssertError('RPBSRP99441');
                } else {
                    properties = createdProperties as MetaModel.RowProperties;
                }
            }
            properties[key as keyof MetaModel.RowProperties] = value;
        } else {
            if (properties !== undefined) {
                delete properties[(isHeight ? '_height' : key) as keyof MetaModel.RowProperties];
            }
        }

        this.setRowMetadataRowProperties(y, metadata, properties, subgrid);

        if (isHeight) {
            this._behaviorShapeChangedEventer();
        } else {
            this._behaviorStateChangedEventer();
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

    private setRowMetadataRowProperties(y: number, existingMetadata: MetaModel.RowMetadata | undefined, properties: MetaModel.RowProperties | undefined, subgrid: SubgridInterface) {
        if (existingMetadata === undefined) {
            // Row exists but does not yet have any Metadata
            if (properties !== undefined) {
                existingMetadata = {
                    __ROW: properties,
                }
                subgrid.setRowMetadata(y, existingMetadata);
                this._behaviorStateChangedEventer();
            }
        } else {
            // Row exists and has Metadata. Just update __ROW
            existingMetadata.__ROW = properties;
            subgrid.setRowMetadata(y, existingMetadata);
            this._behaviorStateChangedEventer();
        }
    }
}

export namespace RowPropertiesBehavior {
    export type BehaviouStateChangedEventer = (this: void) => void;
    export type BehaviorShapeChangedEventer = (this: void) => void;
}
