import { RevClientObject, RevDataServer, RevSchemaField, RevSelectionAreaTypeId, RevUnreachableCaseError } from '../../common';
import { RevColumnsManager } from '../components/column/columns-manager';
import { RevSelection } from '../components/selection/selection';
import { RevSubgridsManager } from '../components/subgrid';
import { RevSubgrid } from '../interfaces';
import { RevColumn } from '../interfaces/column';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings } from '../settings';

/** @public */
export class RevDataExtractBehavior<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> implements RevClientObject {
    /** @internal */
    constructor(
        readonly clientId: string,
        readonly internalParent: RevClientObject,
        /** @internal */
        private readonly _selection: RevSelection<BGS, BCS, SF>,
        /** @internal */
        private readonly _subgridsManager: RevSubgridsManager<BCS, SF>,
        /** @internal */
        private readonly _columnsManager: RevColumnsManager<BCS, SF>,
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
            const subgrid = selectionArea.subgrid;
            const definedSubgrid = subgrid === undefined ? this._subgridsManager.mainSubgrid : subgrid;
            switch (selectionArea.areaTypeId) {
                case RevSelectionAreaTypeId.dynamicAll: {
                    return this.convertDataValueArraysToTsv(this.getDynamicAllSelectionMatrix(definedSubgrid));
                }
                case RevSelectionAreaTypeId.rectangle: {
                    const selectionMatrix = this.getSelectedValuesByRectangleColumnRowMatrix(definedSubgrid);
                    const selections = selectionMatrix[selectionMatrix.length - 1];
                    return this.convertDataValueArraysToTsv(selections);
                }
                case RevSelectionAreaTypeId.row: {
                    return this.convertDataValueArraysToTsv(this.getRowSelectionMatrix(definedSubgrid));
                }
                case RevSelectionAreaTypeId.column: {
                    return this.convertDataValueArraysToTsv(this.getColumnSelectionMatrix(definedSubgrid));
                }
                default:
                    throw new RevUnreachableCaseError('MSGSATSV12998', selectionArea.areaTypeId);
            }
        }
    }

    convertDataValueArraysToTsv(dataValueArrays: RevDataServer.ViewValue[][]) {
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
                alert('selection size is too big to copy to the paste buffer');
                return '';
            }

            for (let h = 0; h < height; h++) {
                for (let w = 0; w < width; w++) {
                    result += (dataValueArrays[w][h] as string) + (w < lastCol ? '\t' : whiteSpaceDelimiterForRow);
                }
            }
        }

        return result;
    }

    /**
     * @returns An object that represents the currently selection row.
     */
    getLastSelectionRectangleTopRowValues() {
        const lastRectangle = this._selection.getLastRectangle();
        if (lastRectangle !== undefined) {
            const columnsManager = this._columnsManager;
            const colCount = this._columnsManager.activeColumnCount;
            const subgrid = lastRectangle.subgrid;
            const dataServer = subgrid.dataServer;
            const topSelectedRow = lastRectangle.topLeft.y;
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

    getRowSelectionData(subgrid: RevSubgrid<BCS, SF>, hiddenColumns: boolean | number[] | string[]): RevDataServer.ViewRow {
        const indices = this._selection.getSubgridRowIndices(subgrid);
        const indicesCount = indices.length;
        const result: RevDataServer.ViewRow = {};

        if (indicesCount > 0) {
            const columns = this.getActiveFieldOrSpecifiedColumns(hiddenColumns);
            for (let c = 0, C = columns.length; c < C; c++) {
                const column = columns[c];
                const rows = result[column.field.name] = new Array(indices.length);
                indices.forEach( (rowIndex, j) => {
                    const dataRow = subgrid.getSingletonViewDataRow(rowIndex); // should always exist
                    rows[j] = subgrid.getViewValueFromDataRowAtColumn(dataRow, column);
                });
            }
        }

        return result;
    }

    getDynamicAllSelectionMatrix(subgrid?: RevSubgrid<BCS, SF>): RevDataServer.ViewValue[][] {
        if (subgrid === undefined) {
            const subgridIndicesArray = this._selection.getDynamicAllRowIndices();
            const subgridIndicesArrayCount = subgridIndicesArray.length;
            let result: RevDataServer.ViewValue[][] = new Array<RevDataServer.ViewValue[]>();
            for (let i = 0; i < subgridIndicesArrayCount; i++) {
                const {subgrid, indices} = subgridIndicesArray[i];
                if (indices.length > 0) {
                    const subgridMatrix = this.getRowIndicesMatrix(subgrid, indices);
                    result = [...result, ...subgridMatrix];
                }
            }
            return result;
        } else {
            const indices = this._selection.getSubgridDynamicAllRowIndices(subgrid);
            if (indices.length === 0) {
                return [];
            } else {
                return this.getRowIndicesMatrix(subgrid, indices);
            }
        }
    }

    getRowSelectionMatrix(subgrid?: RevSubgrid<BCS, SF>, hiddenColumns?: boolean | number[] | string[]): RevDataServer.ViewValue[][] {
        if (subgrid === undefined) {
            const subgridIndicesArray = this._selection.getRowIndices(true);

            const subgridIndicesArrayCount = subgridIndicesArray.length;
            let result: RevDataServer.ViewValue[][] = new Array<RevDataServer.ViewValue[]>();
            for (let i = 0; i < subgridIndicesArrayCount; i++) {
                const {subgrid, indices} = subgridIndicesArray[i];
                if (indices.length > 0) {
                    const subgridMatrix = this.getRowIndicesMatrix(subgrid, indices, hiddenColumns);
                    result = [...result, ...subgridMatrix];
                }
            }
            return result;
        } else {
            const indices = this._selection.getSubgridRowIndices(subgrid);
            if (indices.length === 0) {
                return [];
            } else {
                return this.getRowIndicesMatrix(subgrid, indices, hiddenColumns);
            }
        }
    }

    getRowIndicesMatrix(subgrid: RevSubgrid<BCS, SF>, rowIndices: number[], hiddenColumns?: boolean | number[] | string[]) {
        const selectedRowIndexesCount = rowIndices.length;
        const columns = this.getActiveFieldOrSpecifiedColumns(hiddenColumns);
        const columnCount = columns.length;
        const result = new Array<RevDataServer.ViewValue[]>(columnCount);

        if (selectedRowIndexesCount === 0) {
            for (let c = 0; c < columnCount; c++) {
                result[c] = [];
            }
        } else {
            for (let rowIndex = 0; rowIndex < selectedRowIndexesCount; rowIndex++) {
                const dataRow = subgrid.getSingletonViewDataRow(rowIndex);
                result[rowIndex] = new Array<RevDataServer.ViewValue>(rowIndices.length);
                for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
                    const column = columns[columnIndex];
                    result[rowIndex][columnIndex] = subgrid.getViewValueFromDataRowAtColumn(dataRow, column);
                }
            }
        }

        return result;
    }

    getColumnSelectionMatrix(subgrid: RevSubgrid<BCS, SF>): RevDataServer.ViewValue[][] {
        const columnsManager = this._columnsManager;
        const selectedColumnIndexes = this._selection.getColumnIndices(true);
        const selectedColumnIndexesCount = selectedColumnIndexes.length;

        if (selectedColumnIndexesCount === 0) {
            return [];
        } else {
            const result = new Array<RevDataServer.ViewValue[]>(selectedColumnIndexesCount);
            const numRows = subgrid.getRowCount();
            selectedColumnIndexes.forEach((selectedColumnIndex, c) => {
                const column = columnsManager.getActiveColumn(selectedColumnIndex);
                const values = result[c] = new Array<RevDataServer.ViewValue>(numRows);

                for (let r = 0; r < numRows; r++) {
                    const dataRow = subgrid.getSingletonViewDataRow(r); // should always exist;
                    values[r] = subgrid.getViewValueFromDataRowAtColumn(dataRow, column);
                }
            });

            return result;
        }
    }

    getSelectedColumnsValues(subgrid: RevSubgrid<BCS, SF>) {
        const columnsManager = this._columnsManager;
        const selectedColumnIndexes = this._selection.getColumnIndices(true);
        const result: RevDataServer.ObjectViewRow = {};
        if (selectedColumnIndexes.length > 0) {
            const rowCount = subgrid.getRowCount();

            selectedColumnIndexes.forEach((selectedColumnIndex) => {
                const column = columnsManager.getActiveColumn(selectedColumnIndex);
                const values = result[column.field.name] = new Array<RevDataServer.ViewValue>(rowCount);

                for (let r = 0; r < rowCount; r++) {
                    const dataRow = subgrid.getSingletonViewDataRow(r); // should always exist;
                    values[r] = subgrid.getViewValueFromDataRowAtColumn(dataRow, column);
                }
            });
        }

        return result;
    }

    getSelectedValuesByRectangleAndColumn(subgrid: RevSubgrid<BCS, SF>): RevDataServer.ObjectViewRow[] {
        const columnsManager = this._columnsManager;
        const selectionRectangles = this._selection.getRectangles(subgrid);
        const selectionRectangleCount = selectionRectangles.length;
        const rects = new Array<RevDataServer.ObjectViewRow>(selectionRectangleCount);

        if (selectionRectangleCount > 0) {
            selectionRectangles.forEach(
                (selectionRect, i) => {
                    const colCount = selectionRect.width;
                    const rowCount = selectionRect.height;
                    const columns: RevDataServer.ObjectViewRow = {};

                    for (let c = 0, x = selectionRect.topLeft.x; c < colCount; c++, x++) {
                        const column = columnsManager.getActiveColumn(x);
                        const values = columns[column.field.name] = new Array<RevDataServer.ViewValue>(rowCount);

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

    getSelectedValuesByRectangleColumnRowMatrix(subgrid: RevSubgrid<BCS, SF>): RevDataServer.ViewValue[][][] {
        const columnsManager = this._columnsManager;
        const rectangles = this._selection.getRectangles(subgrid);
        const rectangleCount = rectangles.length;
        const rects = new Array<RevDataServer.ViewValue[][]>(rectangleCount);

        if (rectangleCount > 0) {
            rectangles.forEach(
                (rect, i) => {
                    const colCount = rect.width;
                    const rowCount = rect.height;
                    const columnArray = new Array<RevDataServer.ViewValue[]>(colCount);

                    let x = rect.topLeft.x
                    for (let c = 0; c < colCount; c++) {
                        const column = columnsManager.getActiveColumn(x);

                        const rowValues = new Array<RevDataServer.ViewValue>(rowCount);
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

    /**
     * @param hiddenColumns - One of:
     * `false or undefined` - Active column list
     * `true` - All column list
     * `Array` - Active column list with listed columns prefixed as needed (when not already in the list). Each item in the array may be either:
     * * `number` - field index
     * * `string` - field name
     * @internal
     */
    private getActiveFieldOrSpecifiedColumns(hiddenColumns: boolean | number[] | string[] | undefined): readonly RevColumn<BCS, SF>[] {
        const fieldColumns = this._columnsManager.fieldColumns;
        const activeColumns = this._columnsManager.activeColumns;

        if (hiddenColumns === undefined) {
            return activeColumns;
        } else {
            if (Array.isArray(hiddenColumns)) {
                let columns: RevColumn<BCS, SF>[] = [];
                hiddenColumns.forEach((fieldIndexOrName) => {
                    let activeColumnIndex: number;
                    if (typeof fieldIndexOrName === 'number') {
                        activeColumnIndex = this._columnsManager.getActiveColumnIndexByFieldIndex(fieldIndexOrName);
                    } else {
                        activeColumnIndex = this._columnsManager.getActiveColumnIndexByFieldName(fieldIndexOrName);
                    }
                    const column = this._columnsManager.getActiveColumn(activeColumnIndex);
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (column !== undefined) {
                        if (!activeColumns.includes(column)) {
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
