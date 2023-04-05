import { CellEvent } from '../cell/cell-event';
import { RenderedCell } from '../cell/rendered-cell';
import { GridProperties } from '../grid-properties';
import { MetaModel } from '../model/meta-model';
import { MainSubgrid } from '../subgrid/main-subgrid';
import { Subgrid } from '../subgrid/subgrid';

export class RowPropertiesBehavior {
    private readonly _rowPropertiesPrototype: MetaModel.RowPropertiesPrototype;

    constructor(
        private readonly mainSubgrid: MainSubgrid,
        private readonly _gridProperties: GridProperties,
        rowPropertiesPrototype: MetaModel.RowPropertiesPrototype | undefined,
        private readonly _behaviorStateChangedEventer: RowPropertiesBehavior.BehaviouStateChangedEventer,
        private readonly _behaviorShapeChangedEventer: RowPropertiesBehavior.BehaviorShapeChangedEventer,
    ) {
        if (rowPropertiesPrototype !== undefined) {
            this._rowPropertiesPrototype = rowPropertiesPrototype;
        } else {
            this._rowPropertiesPrototype = new RowPropertiesBehavior.DefaultRowProperties(
                _gridProperties,
                () => this.handleBehaviorStateChangedEvent(),
            )
        }
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
    getRowHeight(y: number, subgrid?: Subgrid) {
        const rowProps = this.getRowProperties(y, undefined, subgrid);
        return rowProps && rowProps.height || this._gridProperties.defaultRowHeight;
    }

    /**
     * @desc set the pixel height of a specific row
     * @param yOrCellEvent - Data row index local to dataModel.
     * @param height - pixel height
     */
    setRowHeight(yOrCellEvent: number, height: number, subgrid?: Subgrid) {
        this.setRowProperty(yOrCellEvent, 'height', height, subgrid);
    }


    getRowOwnPropertiesRC(cellEvent: CellEvent) {
        // undefined return means there is no row properties object
        return this.getRowPropertiesUsingCellEvent(cellEvent, undefined);
    }

    getRowPropertiesRC(renderedCell: RenderedCell) {
        // use carefully! creates new object as needed; only use when object definitely needed: for setting prop with `.rowProperties[key] = value` or `Object.assign(.rowProperties, {...})`; use `rowOwnProperties`  to avoid creating a new object when object does not exist, or `getRowProperty(key)` for getting a property that may not exist
        const properties = this.getRowPropertiesUsingCellEvent(renderedCell, undefined);
        if (properties) {
            return properties;
        } else {
            return undefined;
        }
    }
    setRowPropertiesRC(renderedCell: RenderedCell, properties: MetaModel.RowProperties | undefined) {
        // for resetting whole row properties object: `.rowProperties = {...}`
        this.setRowPropertiesUsingCellEvent(renderedCell, properties); // calls `stateChanged()`
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
     * * `false` - row found but no existing row properties object and `prototype` was not defined; else
     * * `undefined` - no such row or DataModel does not support row properties
     */
    getRowPropertiesUsingCellEvent(cellInfo: RenderedCell, rowPropertiesPrototype?: MetaModel.RowPropertiesPrototype): MetaModel.RowProperties | false | undefined {
        return this.getRowProperties(cellInfo.dataCell.y, rowPropertiesPrototype, cellInfo.subgrid);
    }

    getRowProperties(y: number,
        rowPropertiesPrototype?: MetaModel.RowPropertiesPrototype,
        subgrid?: Subgrid): MetaModel.RowProperties | false | undefined {

        // if (typeof yOrCellEvent === 'object') {
        //     subgrid = yOrCellEvent.subgrid;
        //     yOrCellEvent = yOrCellEvent.dataCell.y;
        // }

        subgrid ??= this.mainSubgrid;
        const rowMetadataPrototype: MetaModel.RowMetadataPrototype = rowPropertiesPrototype === undefined ? null : null; // rowPropertiesPrototype;
        const metadata = subgrid.getRowMetadata(y, rowMetadataPrototype);
        return metadata && (metadata.__ROW ?? (rowPropertiesPrototype !== undefined && (metadata.__ROW = Object.create(rowPropertiesPrototype))));
    }

    /**
     * Reset the row properties in its entirety to the given row properties object.
     * @param yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
     * @param properties - The new row properties object. If `undefined`, this call is a no-op.
     * @param subgrid - This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     */
    setRowPropertiesUsingCellEvent(cellInfo: RenderedCell, properties: MetaModel.RowProperties | undefined) {
        // Do we need this?
        // if (subgrid === undefined) {
        //     subgrid = this.mainSubgrid;
        // }

        this.setRowProperties(cellInfo.dataCell.y, properties, cellInfo.subgrid)
    }
    setRowProperties(y: number, properties: MetaModel.RowProperties | undefined, subgrid: Subgrid): void {
        if (!properties) {
            return;
        }

        const metadata = subgrid.getRowMetadata(y, null);
        if (metadata) {
            metadata.__ROW = Object.create(this._rowPropertiesPrototype);
            this.addRowProperties(y, properties, subgrid, metadata.__ROW);
            this._behaviorStateChangedEventer();
        }
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

    setRowProperty(y: number, key: string, value: unknown, subgrid?: Subgrid) {
        let rowProps: MetaModel.RowProperties | false | undefined;
        const isHeight = (key === 'height');

        if (value !== undefined) {
            rowProps = this.getRowProperties(y, this._rowPropertiesPrototype, subgrid);
            if (rowProps) {
                (rowProps[key as keyof MetaModel.RowProperties] as unknown) = value;
            }
        } else {
            // only try to undefine key if row props object exists; no point in creating it just to delete a non-existant key
            rowProps = this.getRowProperties(y, undefined, subgrid);
            if (rowProps) {
                delete rowProps[(isHeight ? '_height' : key) as keyof MetaModel.RowProperties];
            }
        }

        if (isHeight) {
            this._behaviorShapeChangedEventer();
        } else {
            this._behaviorStateChangedEventer();
        }
    }

    addRowPropertiesUsingCellEvent(cellEvent: CellEvent, properties: MetaModel.RowProperties | undefined, rowProps?: MetaModel.RowProperties) {
        this.addRowProperties(cellEvent.dataCell.y, properties, cellEvent.subgrid, rowProps);
    }

    /**
     * Add all the properties in the given row properties object to the row properties.
     * @param yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
     * @param properties - An object containing new property values(s) to assign to the row properties. If `undefined`, this call is a no-op.
     * @param subgrid - This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     */

    addRowProperties(y: number, properties: MetaModel.RowProperties | undefined, subgrid: Subgrid, rowProps?: MetaModel.RowProperties | false) {
        if (!properties) {
            return;
        }

        let isHeight: boolean;
        let hasHeight = false;

        let resolvedRowProps: MetaModel.RowProperties | false | undefined;
        if (rowProps) {
            resolvedRowProps = rowProps;
        } else {
            resolvedRowProps = this.getRowProperties(y, this._rowPropertiesPrototype, subgrid);
        }

        if (resolvedRowProps) {
            for (const key in properties) {
                const typedKey = key as (keyof MetaModel.RowProperties)
                const value = properties[typedKey];
                if (value !== undefined) {
                    resolvedRowProps[typedKey] = value;
                } else {
                    isHeight = key === 'height';
                    const fixedKey = (isHeight ? '_height' : typedKey) as (keyof MetaModel.RowProperties);
                    delete resolvedRowProps[fixedKey];
                    hasHeight ||= isHeight;
                }
            }

            if (hasHeight) {
                this._behaviorShapeChangedEventer();
            } else {
                this._behaviorStateChangedEventer();
            }
        }
    }

    private handleBehaviorStateChangedEvent() {
        this._behaviorStateChangedEventer();
    }
}

export namespace RowPropertiesBehavior {
    export type BehaviouStateChangedEventer = (this: void) => void;
    export type BehaviorShapeChangedEventer = (this: void) => void;

    export class DefaultRowProperties implements MetaModel.HeightRowProperties {
        private _height: number | undefined;

        constructor(
            private readonly _gridProperties: GridProperties,
            private readonly _behaviourStateChangedEventer: RowPropertiesBehavior.BehaviouStateChangedEventer,
        ) {
        }

        get height() {
            return this._height ?? this._gridProperties.defaultRowHeight;
        }

        set height(height: number | undefined) {
            if (typeof height !== 'number' || isNaN(height)) {
                height = undefined;
            }
            if (height !== this._height) {
                if (height === undefined) {
                    delete this._height;
                } else {
                    height = Math.max(5, Math.ceil(height));
                    // Define `_height` as non-enumerable so won't be included in output of saveState.
                    // (Instead the `height` getter is explicitly invoked and the result is included.)
                    Object.defineProperty(this, '_height', { value: height, configurable: true });
                }
                this._behaviourStateChangedEventer();
            }
        }
    }
}
