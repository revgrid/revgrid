import { ColumnsManager } from '../components/column/columns-manager';
import { Selection } from '../components/selection/selection';
import { DataServer } from '../interfaces/data/data-server';
import { Column } from '../interfaces/dataless/column';
import { SchemaField } from '../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../interfaces/settings/behaviored-column-settings';
import { AssertError, UnreachableCaseError } from '../types-utils/revgrid-error';
import { SelectionAreaType } from '../types-utils/types';

/** @public */
export class DataExtractBehavior<BCS extends BehavioredColumnSettings, SF extends SchemaField> {
    constructor(
        private readonly _selection: Selection<BCS, SF>,
        private readonly _columnsManager: ColumnsManager<BCS, SF>,
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
                case SelectionAreaType.Rectangle: {
                    const selectionMatrix = this.getSelectedValuesByRectangleColumnRowMatrix();
                    const selections = selectionMatrix[selectionMatrix.length - 1];
                    return this.convertDataValueArraysToTsv(selections);
                }
                case SelectionAreaType.Row: {
                    return this.convertDataValueArraysToTsv(this.getRowSelectionMatrix());
                }
                case SelectionAreaType.Column: {
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

    convertDataValueArraysToTsv(dataValueArrays: Array<Array<DataServer.ViewValue>>) {
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
            const dataServer = this.getDefinedSubgrid().dataServer;
            const columnsManager = this._columnsManager;
            const colCount = this._columnsManager.activeColumnCount;
            const topSelectedRow = rectangles[0].topLeft.y;
            const row: Record<string, unknown> = {};

            for (let c = 0; c < colCount; c++) {
                const column = columnsManager.getActiveColumn(c);
                row[column.field.name] = dataServer.getViewValue(column.field, topSelectedRow);
            }

            return row;
        } else {
            return undefined;
        }
    }

    getRowSelectionData(hiddenColumns: boolean | number[] | string[]): DataServer.ViewRow {
        const selectedRowIndexes = this._selection.getRowIndices();
        const selectedRowIndexesCount = selectedRowIndexes.length;
        const columns = this.getActiveFieldOrSpecifiedColumns(hiddenColumns);
        const result: DataServer.ViewRow = {};

        if (selectedRowIndexesCount >= 0) {
            const subgrid = this.getDefinedSubgrid();
            for (let c = 0, C = columns.length; c < C; c++) {
                const column = columns[c];
                const rows = result[column.field.name] = new Array(selectedRowIndexes.length);
                selectedRowIndexes.forEach( (selectedRowIndex, j) => {
                    const dataRow = subgrid.getSingletonViewDataRow(selectedRowIndex); // should always exist
                    rows[j] = subgrid.getViewValueFromDataRowAtColumn(dataRow, column);
                });
            }
        }

        return result;
    }

    getRowSelectionMatrix(hiddenColumns?: boolean | number[] | string[]): Array<Array<DataServer.ViewValue>> {
        const selectedRowIndexes = this._selection.getRowIndices();
        const selectedRowIndexesCount = selectedRowIndexes.length;
        const columns = this.getActiveFieldOrSpecifiedColumns(hiddenColumns);
        const columnCount = columns.length;
        const result = new Array<Array<DataServer.ViewValue>>(columnCount);

        if (selectedRowIndexesCount === 0) {
            for (let c = 0; c < columnCount; c++) {
                result[c] = [];
            }
        } else {
            const subgrid = this.getDefinedSubgrid();
            for (let rowIndex = 0; rowIndex < selectedRowIndexesCount; rowIndex++) {
                const dataRow = subgrid.getSingletonViewDataRow(rowIndex);
                result[rowIndex] = new Array<DataServer.ViewValue>(selectedRowIndexes.length);
                for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
                    const column = columns[columnIndex];
                    result[rowIndex][columnIndex] = subgrid.getViewValueFromDataRowAtColumn(dataRow, column);
                }
            }
        }

        return result;
    }

    getColumnSelectionMatrix(): DataServer.ViewValue[][] {
        const columnsManager = this._columnsManager;
        const selectedColumnIndexes = this._selection.getColumnIndices();
        const selectedColumnIndexesCount = selectedColumnIndexes.length;

        if (selectedColumnIndexesCount === 0) {
            return [];
        } else {
            const result = new Array<Array<DataServer.ViewValue>>(selectedColumnIndexesCount);
            const subgrid = this.getDefinedSubgrid();
            const numRows = subgrid.getRowCount();
            selectedColumnIndexes.forEach((selectedColumnIndex, c) => {
                const column = columnsManager.getActiveColumn(selectedColumnIndex);
                const values = result[c] = new Array<DataServer.ViewValue>(numRows);

                for (let r = 0; r < numRows; r++) {
                    const dataRow = subgrid.getSingletonViewDataRow(r); // should always exist;
                    values[r] = subgrid.getViewValueFromDataRowAtColumn(dataRow, column);
                }
            });

            return result;
        }
    }

    getSelectedColumnsValues() {
        const columnsManager = this._columnsManager;
        const selectedColumnIndexes = this._selection.getColumnIndices();
        const result: DataServer.ObjectViewRow = {};
        if (selectedColumnIndexes.length > 0) {
            const subgrid = this.getDefinedSubgrid();
            const rowCount = subgrid.getRowCount();

            selectedColumnIndexes.forEach((selectedColumnIndex) => {
                const column = columnsManager.getActiveColumn(selectedColumnIndex);
                const values = result[column.field.name] = new Array<DataServer.ViewValue>(rowCount);

                for (let r = 0; r < rowCount; r++) {
                    const dataRow = subgrid.getSingletonViewDataRow(r); // should always exist;
                    values[r] = subgrid.getViewValueFromDataRowAtColumn(dataRow, column);
                }
            });
        }

        return result;
    }

    getSelectedValuesByRectangleAndColumn(): DataServer.ObjectViewRow[] {
        const columnsManager = this._columnsManager;
        const selectionRectangles = this._selection.rectangleList.rectangles;
        const selectionRectangleCount = selectionRectangles.length;
        const rects = new Array<DataServer.ObjectViewRow>(selectionRectangleCount);

        if (selectionRectangleCount > 0) {
            const subgrid = this.getDefinedSubgrid();
            selectionRectangles.forEach(
                (selectionRect, i) => {
                    const colCount = selectionRect.width;
                    const rowCount = selectionRect.height;
                    const columns: DataServer.ObjectViewRow = {};

                    for (let c = 0, x = selectionRect.topLeft.x; c < colCount; c++, x++) {
                        const column = columnsManager.getActiveColumn(x);
                        const values = columns[column.field.name] = new Array<DataServer.ViewValue>(rowCount);

                        for (let r = 0, y = selectionRect.topLeft.y; r < rowCount; r++, y++) {
                            const dataRow = subgrid.getSingletonViewDataRow(y); // should always exist;
                            values[r] = subgrid.getViewValueFromDataRowAtColumn(dataRow, column);
                        }
                    }

                    rects[i] = columns;
                }
            );
        }

        return rects;
    }

    getSelectedValuesByRectangleColumnRowMatrix(): DataServer.ViewValue[][][] {
        const columnsManager = this._columnsManager;
        const rectangles = this._selection.rectangleList.rectangles;
        const rectangleCount = rectangles.length;
        const rects = new Array<Array<Array<DataServer.ViewValue>>>(rectangleCount);

        if (rectangleCount > 0) {
            const subgrid = this.getDefinedSubgrid();

            rectangles.forEach(
                (rect, i) => {
                    const colCount = rect.width;
                    const rowCount = rect.height;
                    const columnArray = new Array<Array<DataServer.ViewValue>>(colCount);

                    let x = rect.topLeft.x
                    for (let c = 0; c < colCount; c++) {
                        const column = columnsManager.getActiveColumn(x);

                        const rowValues = new Array<DataServer.ViewValue>(rowCount);
                        for (let r = 0, y = rect.topLeft.y; r < rowCount; r++, y++) {
                            const dataRow = subgrid.getSingletonViewDataRow(y); // should always exist;
                            rowValues[r] = subgrid.getViewValueFromDataRowAtColumn(dataRow, column);
                        }

                        columnArray[c] = rowValues;
                        x++;
                    }

                    rects[i] = columnArray;
                }
            );
            }

        return rects;
    }

    /** @internal */
    private getDefinedSubgrid() {
        const subgrid = this._selection.subgrid;
        if (subgrid === undefined) {
            throw new AssertError('DEBGS33321');
        } else {
            return subgrid;
        }
    }

    /**
     * @param hiddenColumns - One of:
     * `false or undefined` - Active column list
     * `true` - All column list
     * `Array` - Active column list with listed columns prefixed as needed (when not already in the list). Each item in the array may be either:
     * * `number` - field index
     * * `string` - field name
     * @internal
     */
    private getActiveFieldOrSpecifiedColumns(hiddenColumns: boolean | number[] | string[] | undefined): readonly Column<BCS, SF>[] {
        const fieldColumns = this._columnsManager.fieldColumns;
        const activeColumns = this._columnsManager.activeColumns;

        if (hiddenColumns === undefined) {
            return activeColumns;
        } else {
            if (Array.isArray(hiddenColumns)) {
                let columns: Column<BCS, SF>[] = [];
                hiddenColumns.forEach((fieldIndexOrName) => {
                    let activeColumnIndex: number;
                    if (typeof fieldIndexOrName === 'number') {
                        activeColumnIndex = this._columnsManager.getActiveColumnIndexByFieldIndex(fieldIndexOrName);
                    } else {
                        activeColumnIndex = this._columnsManager.getActiveColumnIndexByFieldName(fieldIndexOrName);
                    }
                    const column = this._columnsManager.getActiveColumn(activeColumnIndex);
                    if (column !== undefined) {
                        if (activeColumns.indexOf(column) < 0) {
                            columns.push(column);
                        }
                    }
                });
                columns = columns.concat(activeColumns);
                return columns;
            } else {
                return hiddenColumns ? fieldColumns : activeColumns;
            }
        }
    }
}