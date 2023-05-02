import { CellProperties } from '../cell/cell-properties';
import { CellPropertiesAccessor } from '../cell/cell-properties-accessor';
import { ViewportCell } from '../cell/viewport-cell';
import { ColumnProperties } from '../column/column-properties';
import { ColumnsManager } from '../column/columns-manager';
import { ColumnInterface } from '../common/column-interface';
import { SubgridInterface } from '../common/subgrid-interface';
import { MetaModel } from '../model/meta-model';
import { Viewport } from '../renderer/viewport';
import { SubgridsManager } from '../subgrid/subgrids-manager';

export class CellPropertiesBehavior {
    constructor(
        private readonly _columnsManager: ColumnsManager,
        private readonly _subgridsManger: SubgridsManager,
        private readonly _viewport: Viewport,
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
    getCellPropertiesAccessor(column: ColumnInterface, rowIndex: number, subgrid: SubgridInterface): CellProperties {
        const cellOwnProperties = this.getCellOwnProperties(column, rowIndex, subgrid);
        return new CellPropertiesAccessor((cellOwnProperties ? cellOwnProperties : undefined), column.properties);
    }

    /**
     * @param rowIndex - Data row coordinate.
     * @param properties - Hash of cell properties. If `undefined`, this call is a no-op.
     * @returns New cell properties object, based on column properties object, with `properties` copied to it.
     */
    /** @internal */
    setCellOwnProperties(column: ColumnInterface, rowIndex: number, properties: MetaModel.CellOwnProperties | undefined, subgrid: SubgridInterface) {
        let metadata = subgrid.getRowMetadata(rowIndex);
        if (properties === undefined) {
            if (metadata !== undefined) {
                const key = column.name as keyof MetaModel.RowMetadata;
                delete metadata[key];
                subgrid.setRowMetadata(rowIndex, metadata);
            }
        } else {
            if (metadata === undefined) {
                metadata = {};
            }
            const key = column.name as keyof MetaModel.RowMetadata;
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
    addCellOwnProperties(column: ColumnInterface, rowIndex: number, properties: MetaModel.CellOwnProperties, subgrid: SubgridInterface) {
        const columnKey = column.name as keyof MetaModel.RowMetadata;
        let metadata = subgrid.getRowMetadata(rowIndex);
        let existingProperties: MetaModel.CellOwnProperties | undefined;
        if (metadata === undefined) {
            metadata = {};
        } else {
            existingProperties = metadata[columnKey];
        }

        if (existingProperties === undefined) {
            existingProperties = {};
            metadata[columnKey] = existingProperties;
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
    getCellOwnProperties(column: ColumnInterface, rowIndex: number, subgrid: SubgridInterface) {
        const metadata = subgrid.getRowMetadata(rowIndex);
        if (metadata === undefined) {
            return undefined;
        } else {
            const key = column.name as keyof MetaModel.RowMetadata;
            return metadata[key];
        }
    }

    /**
     * Delete cell's own properties object.
     * @param rowIndex - Data row coordinate.
     */
    /** @internal */
    deleteCellOwnProperties(column: ColumnInterface, rowIndex: number, subgrid: SubgridInterface) {
        this.setCellOwnProperties(column, rowIndex, undefined, subgrid);
    }

    /**
     * @summary Return a specific cell property.
     * @desc If there is no cell properties object, defers to column properties object.
     * @param rowIndex - Data row coordinate.
     * @return The specified property for the cell at x,y in the grid.
     */
    /** @internal */
    getCellProperty(column: ColumnInterface, rowIndex: number, key: string | number, subgrid: SubgridInterface): MetaModel.CellOwnProperty;
    getCellProperty<T extends keyof ColumnProperties>(column: ColumnInterface, rowIndex: number, key: T, subgrid: SubgridInterface): ColumnProperties[T];
    getCellProperty<T extends keyof ColumnProperties>(
        column: ColumnInterface,
        rowIndex: number,
        key: string | number | T,
        subgrid: SubgridInterface
    ): MetaModel.CellOwnProperty | ColumnProperties[T] {
        const cellProperties = this.getCellPropertiesAccessor(column, rowIndex, subgrid);
        return cellProperties.get(key);
    }

    /**
     * @param rowIndex - Data row coordinate.
     * @returns Cell's own properties object, which will be created by this call if it did not already exist.
     */
    /** @internal */
    setCellProperty(column: ColumnInterface, rowIndex: number, key: string, value: unknown | undefined, subgrid: SubgridInterface) {
        let metadata = subgrid.getRowMetadata(rowIndex);
        let properties: MetaModel.CellOwnProperties | undefined;
        if (value === undefined) {
            if (metadata !== undefined) {
                const columnKey = column.name as keyof MetaModel.RowMetadata;
                properties = metadata[columnKey];
                if (properties !== undefined) {
                    delete properties[key];
                    subgrid.setRowMetadata(rowIndex, metadata);
                }
            } else {
                properties = undefined;
            }
        } else {
            if (metadata === undefined) {
                metadata = {};
            }
            const columnKey = column.name as keyof MetaModel.RowMetadata;
            properties = metadata[columnKey];
            if (properties === undefined) {
                properties = {}
            }
            properties[key] = value;
            subgrid.setRowMetadata(rowIndex, metadata);
        }
        return properties;
    }

    /**
     * @summary Delete a cell own property.
     * @summary If the property is not an own property, it is not deleted.
     * @param rowIndex - Data row coordinate.
     */
    /** @internal */
    deleteCellProperty(column: ColumnInterface, rowIndex: number, key: string, subgrid: SubgridInterface) {
        this.setCellProperty(column, rowIndex, key, undefined, subgrid);
    }

    /**
     * Clear all cell properties from all cells in this column.
     */
    /** @internal */
    clearAllCellProperties(column: ColumnInterface | undefined) {
        const subgrids = this._subgridsManger.subgrids;
        subgrids.forEach((subgrid) => {
            const rowCount = subgrid.getRowCount();
            for (let y = rowCount - 1; y >= 0; y--) {
                if (column !== undefined) {
                    this.deleteCellOwnProperties(column, y, subgrid);
                } else {
                    const allColumns = this._columnsManager.allColumns;
                    for (const aColumn of allColumns) {
                        this.deleteCellOwnProperties(aColumn, y, subgrid);
                    }
                }
            }
        });
        this._viewport.resetAllCellPropertiesCaches();
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
    getCellOwnPropertiesFromRenderedCell(renderedCell: ViewportCell): MetaModel.CellOwnProperties | false | null | undefined{
        // do not use for get/set prop because may return null; instead use .getCellProperty('prop') or .properties.prop (preferred) to get, setCellProperty('prop', value) to set
        let cellOwnProperties = renderedCell.cellOwnProperties;
        if (cellOwnProperties === undefined) {
            cellOwnProperties = this.getCellOwnProperties(renderedCell.visibleColumn.column, renderedCell.visibleRow.subgridRowIndex, renderedCell.subgrid);
            renderedCell.cellOwnProperties = cellOwnProperties;
        }
        return cellOwnProperties;
    }

    getCellOwnPropertyFromRenderedCell(renderedCell: ViewportCell, key: string): MetaModel.CellOwnProperty | undefined {
        const cellOwnProperties = this.getCellOwnPropertiesFromRenderedCell(renderedCell);
        if (cellOwnProperties) {
            return cellOwnProperties[key];
        } else {
            return undefined;
        }

    }
}

export namespace CellPropertiesBehavior {
    export type GetRowMetadataEventer = (this: void, rowIndex: number, subgrid: SubgridInterface) => MetaModel.RowMetadata | undefined;
    export type SetRowMetadataEventer = (this: void, rowIndex: number, subgrid: SubgridInterface) => void;

}
