import { ColumnsManager } from '../components/column/columns-manager';
import { SubgridsManager } from '../components/subgrid/subgrids-manager';
import { ViewCellImplementation } from '../components/view/view-cell-implementation';
import { ViewLayout } from '../components/view/view-layout';
import { CellMetaSettings } from '../interfaces/data/cell-meta-settings';
import { MetaModel } from '../interfaces/data/meta-model';
import { Subgrid } from '../interfaces/data/subgrid';
import { ViewCell } from '../interfaces/data/view-cell';
import { Column } from '../interfaces/dataless/column';
import { SchemaField } from '../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../interfaces/settings/behaviored-grid-settings';
import { ColumnSettings } from '../interfaces/settings/column-settings';
import { CellMetaSettingsImplementation } from '../settings/cell-meta-settings-implementation';
import { RevgridObject } from '../types-utils/revgrid-object';

export class CellPropertiesBehavior<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> implements RevgridObject {
    constructor(
        readonly revgridId: string,
        readonly internalParent: RevgridObject,
        private readonly _columnsManager: ColumnsManager<BCS, SF>,
        private readonly _subgridsManger: SubgridsManager<BCS, SF>,
        private readonly _viewLayout: ViewLayout<BGS, BCS, SF>,
    ) {
    }
    /**
     * @summary Get the properties object for cell.
     * @desc This is the cell's own properties object if found; else the column object.
     *
     * If you are seeking a single specific property, consider calling {@link CellPropertiesBehavior#getCellProperty} instead (which calls this method).
     * @param rowIndex - Data row coordinate.
     * @return The properties of the cell at x,y in the grid.
     */
    /** @internal */
    getCellPropertiesAccessor(column: Column<BCS, SF>, rowIndex: number, subgrid: Subgrid<BCS, SF>): CellMetaSettings {
        const cellOwnProperties = this.getCellOwnProperties(column, rowIndex, subgrid);
        return new CellMetaSettingsImplementation((cellOwnProperties ? cellOwnProperties : undefined), column.settings);
    }

    /**
     * @param rowIndex - Data row coordinate.
     * @param properties - Hash of cell properties. If `undefined`, this call is a no-op.
     * @returns New cell properties object, based on column properties object, with `properties` copied to it.
     */
    /** @internal */
    setCellOwnProperties(column: Column<BCS, SF>, rowIndex: number, properties: MetaModel.CellOwnProperties | undefined, subgrid: Subgrid<BCS, SF>) {
        let metadata = subgrid.getRowMetadata(rowIndex);
        if (properties === undefined) {
            if (metadata !== undefined) {
                const key = column.field.name as keyof MetaModel.RowMetadata;
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete metadata[key]; // If we keep this code, should not use dynamic delete
                subgrid.setRowMetadata(rowIndex, metadata);
            }
        } else {
            if (metadata === undefined) {
                metadata = {};
            }
            const key = column.field.name as keyof MetaModel.RowMetadata;
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
    addCellOwnProperties(column: Column<BCS, SF>, rowIndex: number, properties: MetaModel.CellOwnProperties, subgrid: Subgrid<BCS, SF>) {
        const fieldKey = column.field.name as keyof MetaModel.RowMetadata;
        let metadata = subgrid.getRowMetadata(rowIndex);
        let existingProperties: MetaModel.CellOwnProperties | undefined;
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
     * @summary Get the cell's own properties object.
     * @desc Due to memory constraints, we don't create a cell properties object for every cell.
     *
     * If the cell has its own properties object, it:
     * * was created by a previous call to `setCellProperties` or `setCellProperty`
     * * has the column properties object as its prototype
     * * is returned
     *
     * If the cell does not have its own properties object, this method returns `null`.
     *
     * Call this method only when you need to know if the the cell has its own properties object; otherwise call {@link CellPropertiesBehavior#getCellPropertiesAccessor|getCellProperties}.
     * @param rowIndex - Data row coordinate.
     * @returns The "own" properties of the cell at x,y in the grid. If the cell does not own a properties object, returns `null`.
     */
    /** @internal */
    getCellOwnProperties(column: Column<BCS, SF>, rowIndex: number, subgrid: Subgrid<BCS, SF>) {
        const metadata = subgrid.getRowMetadata(rowIndex);
        if (metadata === undefined) {
            return undefined;
        } else {
            const key = column.field.name as keyof MetaModel.RowMetadata;
            return metadata[key];
        }
    }

    /**
     * Delete cell's own properties object.
     * @param rowIndex - Data row coordinate.
     */
    /** @internal */
    deleteCellOwnProperties(column: Column<BCS, SF>, rowIndex: number, subgrid: Subgrid<BCS, SF>) {
        this.setCellOwnProperties(column, rowIndex, undefined, subgrid);
    }

    /**
     * @summary Return a specific cell property.
     * @desc If there is no cell properties object, defers to column properties object.
     * @param rowIndex - Data row coordinate.
     * @return The specified property for the cell at x,y in the grid.
     */
    /** @internal */
    getCellProperty(column: Column<BCS, SF>, rowIndex: number, key: string | number, subgrid: Subgrid<BCS, SF>): MetaModel.CellOwnProperty;
    getCellProperty<T extends keyof ColumnSettings>(column: Column<BCS, SF>, rowIndex: number, key: T, subgrid: Subgrid<BCS, SF>): ColumnSettings[T];
    getCellProperty<T extends keyof ColumnSettings>(
        column: Column<BCS, SF>,
        rowIndex: number,
        key: string | number | T,
        subgrid: Subgrid<BCS, SF>
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    ): MetaModel.CellOwnProperty | ColumnSettings[T] {
        const cellProperties = this.getCellPropertiesAccessor(column, rowIndex, subgrid);
        return cellProperties.get(key);
    }

    /**
     * @param rowIndex - Data row coordinate.
     * @returns Cell's own properties object, which will be created by this call if it did not already exist.
     */
    /** @internal */
    setCellProperty(
        column: Column<BCS, SF>,
        rowIndex: number,
        key: string,
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
        value: unknown | undefined,
        subgrid: Subgrid<BCS, SF>,
        optionalCell: ViewCell<BCS, SF> | undefined,
    ) {
        let metadata = subgrid.getRowMetadata(rowIndex);
        let properties: MetaModel.CellOwnProperties | undefined;
        if (value === undefined) {
            if (metadata !== undefined) {
                const fieldKey = column.field.name as keyof MetaModel.RowMetadata;
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
            const fieldKey = column.field.name as keyof MetaModel.RowMetadata;
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
            (optionalCell as ViewCellImplementation<BCS, SF>).clearCellOwnProperties();
        }

        return properties;
    }

    /**
     * @summary Delete a cell own property.
     * @summary If the property is not an own property, it is not deleted.
     * @param rowIndex - Data row coordinate.
     */
    /** @internal */
    deleteCellProperty(column: Column<BCS, SF>, rowIndex: number, key: string, subgrid: Subgrid<BCS, SF>) {
        this.setCellProperty(column, rowIndex, key, undefined, subgrid, undefined);
    }

    /**
     * Clear all cell properties from all cells in this column.
     */
    /** @internal */
    clearAllCellProperties(column: Column<BCS, SF> | undefined) {
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
     * @summary Get the properties object for cell.
     * @desc This is the cell's own properties object if found else the column object.
     *
     * If you are seeking a single specific property, consider calling {@link Behavior#getCellProperty} instead.
     * @param xOrCellEvent - Data x coordinate or CellEvent.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @return The properties of the cell at x,y in the grid or falsy if not available.
     */
    getCellOwnPropertiesFromRenderedCell(renderedCell: ViewCell<BCS, SF>): MetaModel.CellOwnProperties | false | null | undefined{
        // do not use for get/set prop because may return null; instead use .getCellProperty('prop') or .properties.prop (preferred) to get, setCellProperty('prop', value) to set
        const viewCellImplementation = renderedCell as ViewCellImplementation<BCS, SF>;
        let cellOwnProperties = viewCellImplementation.cellOwnProperties;
        if (cellOwnProperties === undefined) {
            cellOwnProperties = this.getCellOwnProperties(renderedCell.viewLayoutColumn.column, renderedCell.viewLayoutRow.subgridRowIndex, renderedCell.subgrid);
            viewCellImplementation.cellOwnProperties = cellOwnProperties;
        }
        return cellOwnProperties;
    }

    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    getCellOwnPropertyFromRenderedCell(renderedCell: ViewCell<BCS, SF>, key: string): MetaModel.CellOwnProperty | undefined {
        const cellOwnProperties = this.getCellOwnPropertiesFromRenderedCell(renderedCell);
        if (cellOwnProperties) {
            return cellOwnProperties[key];
        } else {
            return undefined;
        }

    }
}

export namespace CellPropertiesBehavior {
    export type GetRowMetadataEventer<
        BCS extends BehavioredColumnSettings,
        SF extends SchemaField
    > = (this: void, rowIndex: number, subgrid: Subgrid<BCS, SF>) => MetaModel.RowMetadata | undefined;
    export type SetRowMetadataEventer<
        BCS extends BehavioredColumnSettings,
        SF extends SchemaField
    > = (this: void, rowIndex: number, subgrid: Subgrid<BCS, SF>) => void;

}
