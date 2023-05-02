import { Column, ColumnsDataValuesObject } from '../column/column';
import { ColumnsManager } from '../column/columns-manager';
import { UnreachableCaseError } from '../lib/revgrid-error';
import { SelectionArea } from '../lib/selection-area';
import { DataModel } from '../model/data-model';
import { Selection } from '../selection/selection';

/** @internal */
export class DataExtractBehavior {
    constructor(
        private readonly _selection: Selection,
        private readonly _columnsManager: ColumnsManager,
    ) {

    }
    /**
     * @returns Tab separated value string from the selection and our data.
     */
    getSelectionAsTSV(): string {
        // This is wrong - assumes all selection areas are the same and each TSV line is a column - not a row
        // Needs fixing
        const selectionArea = this._selection.lastArea;
        if (selectionArea === undefined) {
            return '';
        } else {
            switch (selectionArea.areaType) {
                case SelectionArea.Type.Rectangle: {
                    const selectionMatrix = this.getSelectedValuesByRectangleColumnRowMatrix();
                    const selections = selectionMatrix[selectionMatrix.length - 1];
                    return this.convertDataValueArraysToTsv(selections);
                }
                case SelectionArea.Type.Row: {
                    return this.convertDataValueArraysToTsv(this.getRowSelectionMatrix());
                }
                case SelectionArea.Type.Column: {
                    return this.convertDataValueArraysToTsv(this.getColumnSelectionMatrix());
                }
                case undefined: {
                    return '';
                }
                default:
                    throw new UnreachableCaseError('MSGSATSV12998', selectionArea.areaType);
            }
        }
    }

    convertDataValueArraysToTsv(dataValueArrays: Array<Array<DataModel.DataValue>>) {
        let result = '';

        //only use the data from the last selection
        if (dataValueArrays.length) {
            const width = dataValueArrays.length;
            const height = dataValueArrays[0].length;
            const areaSize = width * height;
            const lastCol = width - 1;
            // Whitespace will only be added on non-singular rows, selections
            const whiteSpaceDelimiterForRow = (height > 1 ? '\n' : '');

            //disallow if selection is too big
            if (areaSize > 20000) {
                alert('selection size is too big to copy to the paste buffer'); // eslint-disable-line no-alert
                return '';
            }

            for (let h = 0; h < height; h++) {
                for (let w = 0; w < width; w++) {
                    result += dataValueArrays[w][h] + (w < lastCol ? '\t' : whiteSpaceDelimiterForRow);
                }
            }
        }

        return result;
    }

    /**
     * @returns An object that represents the currently selection row.
     */
    getFirstSelectionRectangleTopRowValues() {
        const rectangles = this._selection.rectangleList.rectangles;
        if (rectangles.length > 0) {
            const dataModel = this._selection.subgrid.dataModel;
            const columnsManager = this._columnsManager;
            const colCount = this._columnsManager.activeColumnCount;
            const topSelectedRow = rectangles[0].topLeft.y;
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
        const selectedRowIndexes = this._selection.getRowIndices();
        const columns = this.getActiveAllOrSpecifiedColumns(hiddenColumns);
        const result: DataModel.DataRow = {};

        for (let c = 0, C = columns.length; c < C; c++) {
            const column = columns[c];
            const rows = result[column.name] = new Array(selectedRowIndexes.length);
            selectedRowIndexes.forEach( (selectedRowIndex, j) => {
                const dataRow = this._selection.subgrid.getSingletonDataRow(selectedRowIndex) as DataModel.DataRow; // should always exist
                rows[j] = column.getValueFromDataRow(dataRow);
            });
        }

        return result;
    }

    getRowSelectionMatrix(hiddenColumns?: boolean | number[] | string[]): Array<Array<DataModel.DataValue>> {
        const selectedRowIndexes = this._selection.getRowIndices();
        const columns = this.getActiveAllOrSpecifiedColumns(hiddenColumns);
        const result = new Array<Array<DataModel.DataValue>>(columns.length);

        for (let c = 0, C = columns.length; c < C; c++) {
            const column = columns[c];
            result[c] = new Array<DataModel.DataValue>(selectedRowIndexes.length);
            selectedRowIndexes.forEach(
                (selectedRowIndex, r) => {
                    const dataRow = this._selection.subgrid.getSingletonDataRow(selectedRowIndex) as DataModel.DataRow; // should always exist
                    result[c][r] = column.getValueFromDataRow(dataRow);
                }
            );
        }

        return result;
    }

    getColumnSelectionMatrix(): DataModel.DataValue[][] {
        const columnsManager = this._columnsManager;
        const selectedColumnIndexes = this._selection.getColumnIndices();
        const numRows = this._selection.subgrid.getRowCount();
        const result = new Array<Array<DataModel.DataValue>>(selectedColumnIndexes.length);

        selectedColumnIndexes.forEach((selectedColumnIndex, c) => {
            const column = columnsManager.getActiveColumn(selectedColumnIndex);
            const values = result[c] = new Array<DataModel.DataValue>(numRows);

            for (let r = 0; r < numRows; r++) {
                const dataRow = this._selection.subgrid.getSingletonDataRow(r) as DataModel.DataRow; // should always exist;
                values[r] = column.getValueFromDataRow(dataRow);
            }
        });

        return result;
    }

    getSelectedColumnsValues() {
        const columnsManager = this._columnsManager;
        const selectedColumnIndexes = this._selection.getColumnIndices();
        const result: ColumnsDataValuesObject = {};
        const rowCount = this._selection.subgrid.getRowCount();

        selectedColumnIndexes.forEach((selectedColumnIndex) => {
            const column = columnsManager.getActiveColumn(selectedColumnIndex);
            const values = result[column.name] = new Array<DataModel.DataValue>(rowCount);

            for (let r = 0; r < rowCount; r++) {
                const dataRow = this._selection.subgrid.getSingletonDataRow(r) as DataModel.DataRow; // should always exist;
                values[r] = column.getValueFromDataRow(dataRow);
            }
        });

        return result;
    }

    getSelectedValuesByRectangleAndColumn(): ColumnsDataValuesObject[] {
        const columnsManager = this._columnsManager;
        const selectionRectangles = this._selection.rectangleList.rectangles;
        const rects = new Array<ColumnsDataValuesObject>(selectionRectangles.length);

        selectionRectangles.forEach(
            (selectionRect, i) => {
                const colCount = selectionRect.width;
                const rowCount = selectionRect.height;
                const columns: ColumnsDataValuesObject = {};

                for (let c = 0, x = selectionRect.topLeft.x; c < colCount; c++, x++) {
                    const column = columnsManager.getActiveColumn(x);
                    const values = columns[column.name] = new Array<DataModel.DataValue>(rowCount);

                    for (let r = 0, y = selectionRect.topLeft.y; r < rowCount; r++, y++) {
                        const dataRow = this._selection.subgrid.getSingletonDataRow(y) as DataModel.DataRow; // should always exist;
                        values[r] = column.getValueFromDataRow(dataRow);
                    }
                }

                rects[i] = columns;
            }
        );

        return rects;
    }

    getSelectedValuesByRectangleColumnRowMatrix(): DataModel.DataValue[][][] {
        const columnsManager = this._columnsManager;
        const rectangles = this._selection.rectangleList.rectangles;
        const rects = new Array<Array<Array<DataModel.DataValue>>>(rectangles.length);

        rectangles.forEach(
            (rect, i) => {
                const colCount = rect.width;
                const rowCount = rect.height;
                const columnArray = new Array<Array<DataModel.DataValue>>(colCount);

                let x = rect.topLeft.x
                for (let c = 0; c < colCount; c++) {
                    const column = columnsManager.getActiveColumn(x);

                    const rowValues = new Array<DataModel.DataValue>(rowCount);
                    for (let r = 0, y = rect.topLeft.y; r < rowCount; r++, y++) {
                        const dataRow = this._selection.subgrid.getSingletonDataRow(y) as DataModel.DataRow; // should always exist;
                        rowValues[r] = column.getValueFromDataRow(dataRow);
                    }

                    columnArray[c] = rowValues;
                    x++;
                }

                rects[i] = columnArray;
            }
        );

        return rects;
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
