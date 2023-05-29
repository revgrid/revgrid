import { AssertError, DataServer } from '../../grid/grid-public-api';
import { RevSimpleHeaderDataServer } from './rev-simple-header-data-server';
import { RevSimpleMainDataServer } from './rev-simple-main-data-server';
import { RevSimpleSchemaServer } from './rev-simple-schema-server';

/** @public */
export class RevSimpleServerSet {
    private _schemaServer = new RevSimpleSchemaServer();
    private _mainDataServer = new RevSimpleMainDataServer();
    private _headerDataServer = new RevSimpleHeaderDataServer();

    get schemaServer() { return this._schemaServer; }
    get mainDataServer() { return this._mainDataServer; }
    get headerDataServer() { return this._headerDataServer; }


    /**
     * Establish new data and schema.
     * If no data provided, data will be set to 0 rows.
     * @param data - Array of congruent uniform objects containing the grid data and possibly also header rows.
     * @param headerRowCount - Number of Header rows. If greater than 0, then the initial rows in data actually contain headers. They
     * should be stripped from data and included in header. If less than 0, then there should be one header row and the header values
     * should be derived from column names in data.
     */
    setData(data: RevSimpleAdapterSet.DataRow[] | (() => RevSimpleAdapterSet.DataRow[]), headerRowCount = -1) {
        if (data === undefined) {
            return;
        } else {
            let dataRows = typeof data === 'function' ? data() : data;

            if (!Array.isArray(dataRows)) {
                throw new AssertError('BSD73766', 'Expected data to be an array of data row objects');
            } else {
                let schema: RevSimpleSchemaServer.Column[];
                if (headerRowCount < 0) {
                    schema = this.calculateSchemaFromData(dataRows, true);
                } else {
                    if (headerRowCount === 0) {
                        schema = this.calculateSchemaFromData(dataRows, false);
                    } else {
                        ({ schema, dataRows } = this.extractSchemaAndHeadersFromData(dataRows, headerRowCount));
                    }
                }

                if (schema.length === 0) {
                    headerRowCount = 0;
                } else {
                    headerRowCount = schema[0].headers.length;
                }

                this._mainDataServer.beginDataChange();
                try {
                    this._schemaServer.reset(schema);
                    this._headerDataServer.reset(headerRowCount);
                    this._mainDataServer.reset(dataRows);
                } finally {
                    this._mainDataServer.endDataChange();
                }
            }
        }
    }

    private extractSchemaAndHeadersFromData(
        rows: RevSimpleAdapterSet.DataRow[],
        headerRowCount: number
    ): ExtractSchemaAndHeadersFromDataResult {
        const { rows: headerRows, sourceCount: initialSourceCount } = this.getInitialDefinedRows(rows, headerRowCount);
        const headerCount = headerRows.length;
        if (headerCount === 0) {
            return {
                dataRows: [],
                schema: [],
            };
        } else {
            rows.splice(0, initialSourceCount);
            const firstHeaderRow = headerRows[0];
            const columnKeys = Object.keys(firstHeaderRow);

            const columnCount = columnKeys.length;
            const schema = new Array<RevSimpleSchemaServer.Column>(columnCount);
            for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
                const columnKey = columnKeys[columnIndex];
                const columnHeaders = new Array<string>(headerCount);
                for (let rowIndex = 0; rowIndex < headerCount; rowIndex++) {
                    const row = headerRows[rowIndex];
                    let header = row[columnKey];
                    if (typeof header !== 'string') {
                        header = columnKey;
                    }
                    columnHeaders[rowIndex] = header as string; // should not need this cast
                }
                schema[columnIndex] = { name: columnKey, index: columnIndex, headers: columnHeaders, initialSettings: undefined };
            }

            return {
                dataRows: rows,
                schema,
            };
        }
    }

    private calculateSchemaFromData(dataRows: RevSimpleAdapterSet.DataRow[], keyIsHeader: boolean): RevSimpleSchemaServer.Column[] {
        const { rows } = this.getInitialDefinedRows(dataRows, 1);
        if (rows.length === 0) {
            return [];
        } else {
            const row = rows[0];
            const result = Object.keys(row).map((key, index) => ({ name: key, index, initialSettings: undefined, headers: keyIsHeader ? [key] : [] }));
            return result;
        }
    }

    /**
     * @summary Find initial defined elements in rows.
     * @param maxCount - the maximum number of initial rows to return
     * @returns The initial rows (up to maxCount) and the number of source rows these covered (may be more
     * than max count if some rows are undefined).
     */
    getInitialDefinedRows(sourceRows: readonly RevSimpleAdapterSet.DataRow[], maxCount: number): GetInitialDefinedRowsResult {
        const rows = new Array<RevSimpleAdapterSet.DataRow>(maxCount);

        const sourceCount = sourceRows.length;
        let initialCount = 0;
        for (let i = 0; i < sourceCount; i++) {
            const row = sourceRows[i];
            if (row !== undefined) {
                rows[initialCount++] = row;
                if (initialCount === maxCount) {
                    return {
                        rows,
                        sourceCount: i + 1,
                    }
                }
            }
        }

        rows.length = initialCount;
        return {
            rows,
            sourceCount,
        }
    }
}

/** @public */
export namespace RevSimpleAdapterSet {
    export interface DataRow extends RevSimpleMainDataServer.DataRow {
        [columnName: string]: DataServer.DataValue | string; // can also have header
    }
}

interface ExtractSchemaAndHeadersFromDataResult {
    schema: RevSimpleSchemaServer.Column[];
    dataRows: RevSimpleAdapterSet.DataRow[];
}

interface GetInitialDefinedRowsResult {
    rows: RevSimpleAdapterSet.DataRow[];
    sourceCount: number;
}
