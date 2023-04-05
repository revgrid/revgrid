import { Column, ColumnsDataValuesObject } from './column/column';
import { ColumnsManager } from './column/columns-manager';
import { UnreachableCaseError } from './lib/revgrid-error';
import { DataModel } from './model/data-model';
import { SchemaModel } from './model/schema-model';
import { Selection } from './selection/selection';
import { SelectionType } from './selection/selection-type';

/** @internal */
export class DataExtract {
    constructor(
        private readonly selection: Selection,
        private readonly _columnsManager: ColumnsManager,
    ) {

    }
    /**
     * @returns Tab separated value string from the selection and our data.
     */
    getSelectionAsTSV(): string {
        const selectionType = this.selection.getLastSelectionType();
        switch (selectionType) {
            case SelectionType.Cell: {
                const selectionMatrix = this.getSelectedValuesByRectangleColumnRowMatrix();
                const selections = selectionMatrix[selectionMatrix.length - 1];
                return this.getMatrixSelectionAsTSV(selections);
            }
            case SelectionType.Row: {
                return this.getMatrixSelectionAsTSV(this.getRowSelectionMatrix());
            }
            case SelectionType.Column: {
                return this.getMatrixSelectionAsTSV(this.getColumnSelectionMatrix());
            }
            case undefined: {
                return '';
            }
            default:
                throw new UnreachableCaseError('MSGSATSV12998', selectionType);
        }
    }

    getMatrixSelectionAsTSV(selections: Array<Array<DataModel.DataValue>>) {
        let result = '';

        //only use the data from the last selection
        if (selections.length) {
            const width = selections.length;
            const height = selections[0].length;
            const area = width * height;
            const lastCol = width - 1;
                //Whitespace will only be added on non-singular rows, selections
            const whiteSpaceDelimiterForRow = (height > 1 ? '\n' : '');

            //disallow if selection is too big
            if (area > 20000) {
                alert('selection size is too big to copy to the paste buffer'); // eslint-disable-line no-alert
                return '';
            }

            for (let h = 0; h < height; h++) {
                for (let w = 0; w < width; w++) {
                    result += selections[w][h] + (w < lastCol ? '\t' : whiteSpaceDelimiterForRow);
                }
            }
        }

        return result;
    }

    /**
     * @returns An object that represents the currently selection row.
     */
    getFirstSelectionRectangleTopRowValues() {
        const rectangles = this.selection.rectangles;
        if (rectangles.length > 0) {
            const dataModel = this.selection.focusedSubgrid.dataModel;
            const columnsManager = this._columnsManager;
            const colCount = this._columnsManager.getActiveColumnCount();
            const topSelectedRow = rectangles[0].origin.y;
            const row: Record<string, unknown> = {};

            for (let c = 0; c < colCount; c++) {
                const column = columnsManager.getActiveColumn(c);
                row[column.name] = dataModel.getValue(column.schemaColumn, topSelectedRow);
            }

            return row;
        } else {
            return undefined;
        }
    }

    getRowSelectionData(hiddenColumns: boolean | number[] | string[]): DataModel.DataRow {
        const selectedRowIndexes = this.selection.getRowIndices();
        const columns = this.getActiveAllOrSpecifiedColumns(hiddenColumns);
        const result: DataModel.DataRow = {};

        for (let c = 0, C = columns.length; c < C; c++) {
            const column = columns[c];
            const rows = result[column.name] = new Array(selectedRowIndexes.length);
            selectedRowIndexes.forEach( (selectedRowIndex, j) => {
                const dataRow = this.selection.focusedSubgrid.getRow(selectedRowIndex) as DataModel.DataRow; // should always exist
                rows[j] = this.valOrFunc(dataRow, column);
            });
        }

        return result;
    }

    getRowSelectionMatrix(hiddenColumns?: boolean | number[] | string[]): Array<Array<DataModel.DataValue>> {
        const selectedRowIndexes = this.selection.getRowIndices();
        const columns = this.getActiveAllOrSpecifiedColumns(hiddenColumns);
        const result = new Array<Array<DataModel.DataValue>>(columns.length);

        for (let c = 0, C = columns.length; c < C; c++) {
            const column = columns[c];
            result[c] = new Array<DataModel.DataValue>(selectedRowIndexes.length);
            selectedRowIndexes.forEach(
                (selectedRowIndex, r) => {
                    const dataRow = this.selection.focusedSubgrid.getRow(selectedRowIndex) as DataModel.DataRow; // should always exist
                    result[c][r] = this.valOrFunc(dataRow, column);
                }
            );
        }

        return result;
    }

    getColumnSelectionMatrix(): DataModel.DataValue[][] {
        const columnsManager = this._columnsManager;
        const selectedColumnIndexes = this.selection.getColumnIndices();
        const numRows = this.selection.focusedSubgrid.getRowCount();
        const result = new Array<Array<DataModel.DataValue>>(selectedColumnIndexes.length);

        selectedColumnIndexes.forEach((selectedColumnIndex, c) => {
            const column = columnsManager.getActiveColumn(selectedColumnIndex);
            const values = result[c] = new Array<DataModel.DataValue>(numRows);

            for (let r = 0; r < numRows; r++) {
                const dataRow = this.selection.focusedSubgrid.getRow(r) as DataModel.DataRow; // should always exist;
                values[r] = this.valOrFunc(dataRow, column);
            }
        });

        return result;
    }

    getSelectedColumnsValues() {
        const columnsManager = this._columnsManager;
        const selectedColumnIndexes = this.selection.getColumnIndices();
        const result: ColumnsDataValuesObject = {};
        const rowCount = this.selection.focusedSubgrid.getRowCount();

        selectedColumnIndexes.forEach((selectedColumnIndex) => {
            const column = columnsManager.getActiveColumn(selectedColumnIndex);
            const values = result[column.name] = new Array<DataModel.DataValue>(rowCount);

            for (let r = 0; r < rowCount; r++) {
                const dataRow = this.selection.focusedSubgrid.getRow(r) as DataModel.DataRow; // should always exist;
                values[r] = this.valOrFunc(dataRow, column);
            }
        });

        return result;
    }

    getSelectedValuesByRectangleAndColumn(): ColumnsDataValuesObject[] {
        const columnsManager = this._columnsManager;
        const selectionRectangles = this.selection.rectangles;
        const rects = new Array<ColumnsDataValuesObject>(selectionRectangles.length);

        selectionRectangles.forEach(
            (selectionRect, i) => {
                const colCount = selectionRect.width;
                const rowCount = selectionRect.height;
                const columns: ColumnsDataValuesObject = {};

                for (let c = 0, x = selectionRect.origin.x; c < colCount; c++, x++) {
                    const column = columnsManager.getActiveColumn(x);
                    const values = columns[column.name] = new Array<DataModel.DataValue>(rowCount);

                    for (let r = 0, y = selectionRect.origin.y; r < rowCount; r++, y++) {
                        const dataRow = this.selection.focusedSubgrid.getRow(y) as DataModel.DataRow; // should always exist;
                        values[r] = this.valOrFunc(dataRow, column);
                    }
                }

                rects[i] = columns;
            }
        );

        return rects;
    }

    getSelectedValuesByRectangleColumnRowMatrix(): DataModel.DataValue[][][] {
        const columnsManager = this._columnsManager;
        const rectangles = this.selection.rectangles;
        const rects = new Array<Array<Array<DataModel.DataValue>>>(rectangles.length);

        rectangles.forEach(
            (rect, i) => {
                const colCount = rect.width;
                const rowCount = rect.height;
                const rows = new Array<Array<DataModel.DataValue>>();

                for (let c = 0, x = rect.origin.x; c < colCount; c++, x++) {
                    const values = rows[c] = new Array<DataModel.DataValue>(rowCount);
                    const column = columnsManager.getActiveColumn(x);

                    for (let r = 0, y = rect.origin.y; r < rowCount; r++, y++) {
                        const dataRow = this.selection.focusedSubgrid.getRow(y) as DataModel.DataRow; // should always exist;
                        values[r] = this.valOrFunc(dataRow, column);
                    }
                }

                rects[i] = rows;
            }
        );

        return rects;
    }

    /**
     * @returns '' if data value is undefined
     * @internal
     */
    private valOrFunc(dataRow: DataModel.DataRow, column: Column): (DataModel.DataValue | '') {
        if (Array.isArray(dataRow)) {
            return dataRow[column.schemaColumn.index];
        } else {
            let result: DataModel.DataValue;
            if (dataRow) {
                result = dataRow[column.name];
                const calculator = (((typeof result)[0] === 'f' && result) || column.calculator) as SchemaModel.Column.CalculateFunction;
                if (calculator) {
                    result = calculator(dataRow, column.name);
                }
            }
            return result || result === 0 || result === false ? result : '';
        }
    }

    /**
     * @param hiddenColumns - One of:
     * `false or undefined` - Active column list
     * `true` - All column list
     * `Array` - Active column list with listed columns prefixed as needed (when not already in the list). Each item in the array may be either:
     * * `number` - index into all column list
     * * `string` - name of a column from the all column list
     * @internal
     */
    private getActiveAllOrSpecifiedColumns(hiddenColumns: boolean | number[] | string[] | undefined): readonly Column[] {
        const allColumns = this._columnsManager.allColumns;
        const activeColumns = this._columnsManager.activeColumns;

        if (hiddenColumns === undefined) {
            return activeColumns;
        } else {
            if (Array.isArray(hiddenColumns)) {
                let columns: Column[] = [];
                hiddenColumns.forEach((index: number | string) => {
                    const key = typeof index === 'number' ? 'index' : 'name';
                    const column = allColumns.find((allColumn) => { return allColumn[key] === index; });
                    if (column !== undefined) {
                        if (activeColumns.indexOf(column) < 0) {
                            columns.push(column);
                        }
                    }
                });
                columns = columns.concat(activeColumns);
                return columns;
            } else {
                return hiddenColumns ? allColumns : activeColumns;
            }
        }
    }
}
