import { RevClientObject, RevMetaServer, RevSchemaField } from '../../common';
import { RevColumnsManager } from '../components/column/columns-manager';
import { RevSubgridsManager } from '../components/subgrid/subgrids-manager';
import { RevViewCellImplementation } from '../components/view/view-cell-implementation';
import { RevViewLayout } from '../components/view/view-layout';
import { RevCellMetaSettings } from '../interfaces/cell-meta-settings';
import { RevColumn } from '../interfaces/column';
import { RevSubgrid } from '../interfaces/subgrid';
import { RevViewCell } from '../interfaces/view-cell';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevColumnSettings } from '../settings/internal-api';

export class RevCellPropertiesBehavior<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> implements RevClientObject {
    constructor(
        readonly clientId: string,
        readonly internalParent: RevClientObject,
        private readonly _columnsManager: RevColumnsManager<BCS, SF>,
        private readonly _subgridsManger: RevSubgridsManager<BCS, SF>,
        private readonly _viewLayout: RevViewLayout<BGS, BCS, SF>,
    ) {
    }
    /**
     * Get the properties object for cell.
     * @remarks This is the cell's own properties object if found; else the column object.
     *
     * If you are seeking a single specific property, consider calling {link RevCellPropertiesBehavior#getCellProperty} instead (which calls this method).
     * @param rowIndex - Data row coordinate.
     * @returns The properties of the cell at x,y in the grid.
     */
    /** @internal */
    getCellPropertiesAccessor(column: RevColumn<BCS, SF>, rowIndex: number, subgrid: RevSubgrid<BCS, SF>): RevCellMetaSettings {
        const cellOwnProperties = this.getCellOwnProperties(column, rowIndex, subgrid);
        return new RevCellPropertiesBehavior.CellMetaSettingsImplementation((cellOwnProperties ? cellOwnProperties : undefined), column.settings);
    }

    /**
     * @param rowIndex - Data row coordinate.
     * @param properties - Hash of cell properties. If `undefined`, this call is a no-op.
     * @returns New cell properties object, based on column properties object, with `properties` copied to it.
     */
    /** @internal */
    setCellOwnProperties(column: RevColumn<BCS, SF>, rowIndex: number, properties: RevMetaServer.CellOwnProperties | undefined, subgrid: RevSubgrid<BCS, SF>) {
        let metadata = subgrid.getRowMetadata(rowIndex);
        if (properties === undefined) {
            if (metadata !== undefined) {
                const key = column.field.name as keyof RevMetaServer.RowMetadata;
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete metadata[key]; // If we keep this code, should not use dynamic delete
                subgrid.setRowMetadata(rowIndex, metadata);
            }
        } else {
            if (metadata === undefined) {
                metadata = {};
            }
            const key = column.field.name as keyof RevMetaServer.RowMetadata;
            metadata[key] = properties;
            subgrid.setRowMetadata(rowIndex, metadata);
        }
    }

    /**
     * @param rowIndex - Data row coordinate.
     * @param properties - Hash of cell properties. If `undefined`, this call is a no-op.
     * @returns Cell's own properties object, which will be created by this call if it did not already exist.
     */
    /** @internal */
    addCellOwnProperties(column: RevColumn<BCS, SF>, rowIndex: number, properties: RevMetaServer.CellOwnProperties, subgrid: RevSubgrid<BCS, SF>) {
        const fieldKey = column.field.name as keyof RevMetaServer.RowMetadata;
        let metadata = subgrid.getRowMetadata(rowIndex);
        let existingProperties: RevMetaServer.CellOwnProperties | undefined;
        if (metadata === undefined) {
            metadata = {};
        } else {
            existingProperties = metadata[fieldKey];
        }

        if (existingProperties === undefined) {
            existingProperties = {};
            metadata[fieldKey] = existingProperties;
        }

        let added = false;
        for (const key in properties) {
            existingProperties[key] = properties;
            added = true;
        }

        if (added) {
            subgrid.setRowMetadata(rowIndex, metadata);
        }
    }

    /**
     * Get the cell's own properties object.
     * @remarks Due to memory constraints, we don't create a cell properties object for every cell.
     *
     * If the cell has its own properties object, it:
     * * was created by a previous call to `setCellProperties` or `setCellProperty`
     * * has the column properties object as its prototype
     * * is returned
     *
     * If the cell does not have its own properties object, this method returns `null`.
     *
     * Call this method only when you need to know if the the cell has its own properties object; otherwise call {@link RevCellPropertiesBehavior#getCellPropertiesAccessor|getCellProperties}.
     * @param rowIndex - Data row coordinate.
     * @returns The "own" properties of the cell at x,y in the grid. If the cell does not own a properties object, returns `null`.
     */
    /** @internal */
    getCellOwnProperties(column: RevColumn<BCS, SF>, rowIndex: number, subgrid: RevSubgrid<BCS, SF>) {
        const metadata = subgrid.getRowMetadata(rowIndex);
        if (metadata === undefined) {
            return undefined;
        } else {
            const key = column.field.name as keyof RevMetaServer.RowMetadata;
            return metadata[key];
        }
    }

    /**
     * Delete cell's own properties object.
     * @param rowIndex - Data row coordinate.
     */
    /** @internal */
    deleteCellOwnProperties(column: RevColumn<BCS, SF>, rowIndex: number, subgrid: RevSubgrid<BCS, SF>) {
        this.setCellOwnProperties(column, rowIndex, undefined, subgrid);
    }

    /**
     * Return a specific cell property.
     * @remarks If there is no cell properties object, defers to column properties object.
     * @param rowIndex - Data row coordinate.
     * @returns The specified property for the cell at x,y in the grid.
     */
    /** @internal */
    getCellProperty(column: RevColumn<BCS, SF>, rowIndex: number, key: string | number, subgrid: RevSubgrid<BCS, SF>): RevMetaServer.CellOwnProperty;
    getCellProperty<T extends keyof RevColumnSettings>(column: RevColumn<BCS, SF>, rowIndex: number, key: T, subgrid: RevSubgrid<BCS, SF>): RevColumnSettings[T];
    getCellProperty<T extends keyof RevColumnSettings>(
        column: RevColumn<BCS, SF>,
        rowIndex: number,
        key: string | number | T,
        subgrid: RevSubgrid<BCS, SF>
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    ): RevMetaServer.CellOwnProperty | RevColumnSettings[T] {
        const cellProperties = this.getCellPropertiesAccessor(column, rowIndex, subgrid);
        return cellProperties.get(key);
    }

    /**
     * @param rowIndex - Data row coordinate.
     * @returns Cell's own properties object, which will be created by this call if it did not already exist.
     */
    /** @internal */
    setCellProperty(
        column: RevColumn<BCS, SF>,
        rowIndex: number,
        key: string,
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
        value: unknown | undefined,
        subgrid: RevSubgrid<BCS, SF>,
        optionalCell: RevViewCell<BCS, SF> | undefined,
    ) {
        let metadata = subgrid.getRowMetadata(rowIndex);
        let properties: RevMetaServer.CellOwnProperties | undefined;
        if (value === undefined) {
            if (metadata !== undefined) {
                const fieldKey = column.field.name as keyof RevMetaServer.RowMetadata;
                properties = metadata[fieldKey];
                if (properties !== undefined) {
                    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                    delete properties[key]; // If we keep this code, should not use dynamic delete
                    subgrid.setRowMetadata(rowIndex, metadata);
                }
            } else {
                properties = undefined;
            }
        } else {
            if (metadata === undefined) {
                metadata = {};
            }
            const fieldKey = column.field.name as keyof RevMetaServer.RowMetadata;
            properties = metadata[fieldKey];
            if (properties === undefined) {
                properties = {}
            }
            properties[key] = value;
            subgrid.setRowMetadata(rowIndex, metadata);
        }

        if (optionalCell === undefined) {
            optionalCell = this._viewLayout.findCellAtDataPoint(column.field.index, rowIndex, subgrid);
        }
        if (optionalCell !== undefined) {
            (optionalCell as RevViewCellImplementation<BCS, SF>).clearCellOwnProperties();
        }

        return properties;
    }

    /**
     * Delete a cell own property.
     * If the property is not an own property, it is not deleted.
     * @param rowIndex - Data row coordinate.
     */
    /** @internal */
    deleteCellProperty(column: RevColumn<BCS, SF>, rowIndex: number, key: string, subgrid: RevSubgrid<BCS, SF>) {
        this.setCellProperty(column, rowIndex, key, undefined, subgrid, undefined);
    }

    /**
     * Clear all cell properties from all cells in this column.
     */
    /** @internal */
    clearAllCellProperties(column: RevColumn<BCS, SF> | undefined) {
        const subgrids = this._subgridsManger.subgrids;
        subgrids.forEach((subgrid) => {
            const rowCount = subgrid.getRowCount();
            for (let y = rowCount - 1; y >= 0; y--) {
                if (column !== undefined) {
                    this.deleteCellOwnProperties(column, y, subgrid);
                } else {
                    const fieldColumns = this._columnsManager.fieldColumns;
                    for (const fieldColumn of fieldColumns) {
                        this.deleteCellOwnProperties(fieldColumn, y, subgrid);
                    }
                }
            }
        });
        this._viewLayout.resetAllCellPropertiesCaches();
    }

    /**
     * Get the properties object for cell.
     * @remarks This is the cell's own properties object if found else the column object.
     *
     * If you are seeking a single specific property, consider calling {link RevCellPropertiesBehavior#getCellProperty} instead.
     * @param viewCell - RevViewCell representing cell.
     * @returns The properties of the cell at x,y in the grid or falsy if not available.
     */
    getCellOwnPropertiesFromViewCell(viewCell: RevViewCell<BCS, SF>): RevMetaServer.CellOwnProperties | false | null | undefined{
        // do not use for get/set prop because may return null; instead use .getCellProperty('prop') or .properties.prop (preferred) to get, setCellProperty('prop', value) to set
        const viewCellImplementation = viewCell as RevViewCellImplementation<BCS, SF>;
        let cellOwnProperties = viewCellImplementation.cellOwnProperties;
        if (cellOwnProperties === undefined) {
            cellOwnProperties = this.getCellOwnProperties(viewCell.viewLayoutColumn.column, viewCell.viewLayoutRow.subgridRowIndex, viewCell.subgrid);
            viewCellImplementation.cellOwnProperties = cellOwnProperties;
        }
        return cellOwnProperties;
    }

    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    getCellOwnPropertyFromViewCell(viewCell: RevViewCell<BCS, SF>, key: string): RevMetaServer.CellOwnProperty | undefined {
        const cellOwnProperties = this.getCellOwnPropertiesFromViewCell(viewCell);
        if (cellOwnProperties) {
            return cellOwnProperties[key];
        } else {
            return undefined;
        }

    }
}

export namespace RevCellPropertiesBehavior {
    export type GetRowMetadataEventer<
        BCS extends RevBehavioredColumnSettings,
        SF extends RevSchemaField
    > = (this: void, rowIndex: number, subgrid: RevSubgrid<BCS, SF>) => RevMetaServer.RowMetadata | undefined;
    export type SetRowMetadataEventer<
        BCS extends RevBehavioredColumnSettings,
        SF extends RevSchemaField
    > = (this: void, rowIndex: number, subgrid: RevSubgrid<BCS, SF>) => void;


    export class CellMetaSettingsImplementation implements RevCellMetaSettings {
        constructor(
            private readonly _cellOwnProperties: RevMetaServer.CellOwnProperties | undefined,
            private readonly _columnSettings: RevColumnSettings
        ) {

        }

        get<T extends keyof RevColumnSettings>(key: T): RevColumnSettings[T];
        get(key: string | number): RevMetaServer.CellOwnProperty;
        get<T extends keyof RevColumnSettings>(key: string | number) {
            // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
            let result: RevMetaServer.CellOwnProperty | undefined;
            if (this._cellOwnProperties !== undefined) {
                result = this._cellOwnProperties[key];
            }
            if (result === undefined) {
                result = this._columnSettings[key as T];
            }
            return result;
        }
    }
}
