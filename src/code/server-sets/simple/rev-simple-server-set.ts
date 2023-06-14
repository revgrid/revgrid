import { AssertError, BehavioredColumnSettings, DataServer } from '../../grid/grid-public-api';
import { RevSimpleHeaderDataServer } from './rev-simple-header-data-server';
import { RevSimpleMainDataServer } from './rev-simple-main-data-server';
import { RevSimpleSchemaServer } from './rev-simple-schema-server';

/** @public */
export class RevSimpleServerSet<BCS extends BehavioredColumnSettings> {
    private _schemaServer = new RevSimpleSchemaServer<BCS>();
    private _mainDataServer = new RevSimpleMainDataServer<BCS>();
    private _headerDataServer = new RevSimpleHeaderDataServer<BCS>();

    get schemaServer() { return this._schemaServer; }
    get mainDataServer() { return this._mainDataServer; }
    get headerDataServer() { return this._headerDataServer; }

    constructor(private readonly _columnSettings: BCS) {

    }


    /**
     * Establish new data and schema.
     * If no data provided, data will be set to 0 rows.
     * @param data - Array of congruent uniform objects containing the grid data and possibly also header rows.
     * @param headerRowCount - Number of Header rows. If greater than 0, then the initial rows in data actually contain headers. They
     * should be stripped from data and included in header. If less than 0, then there should be one header row and the header values
     * should be derived from column names in data.
     */
    setData(data: RevSimpleServerSet.DataRow[] | (() => RevSimpleServerSet.DataRow[]), headerRowCount = -1) {
        if (data === undefined) {
            return;
        } else {
            let dataRows = typeof data === 'function' ? data() : data;

            if (!Array.isArray(dataRows)) {
                throw new AssertError('BSD73766', 'Expected data to be an array of data row objects');
            } else {
                let schema: RevSimpleSchemaServer.Column<BCS>[];
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
        rows: RevSimpleServerSet.DataRow[],
        headerRowCount: number
    ): ExtractSchemaAndHeadersFromDataResult<BCS> {
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
            const schema = new Array<RevSimpleSchemaServer.Column<BCS>>(columnCount);
            for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
                const columnKey = columnKeys[columnIndex];
                const columnHeaders = new Array<string>(headerCount);
                for (let rowIndex = 0; rowIndex < headerCount; rowIndex++) {
                    const row = headerRows[rowIndex];
                    const header = this.convertDataValueToString(row[columnKey]);
                    columnHeaders[rowIndex] = header;
                }
                schema[columnIndex] = { name: columnKey, index: columnIndex, headers: columnHeaders, settings: this._columnSettings };
            }

            return {
                dataRows: rows,
                schema,
            };
        }
    }

    private convertDataValueToString(value: DataServer.ViewValue | string): string {
        switch (typeof value) {
            case 'string': return value;
            case 'number': return value.toString();
            case 'bigint': return value.toString();
            case 'boolean': return value.toString();
            case 'symbol': return value.toString();
            case 'undefined': return '?Undefined';
            case 'object': return '?Object';
            case 'function': return value.toString();
            default: return '?Unknown Type';
        }
}

    private calculateSchemaFromData(dataRows: RevSimpleServerSet.DataRow[], keyIsHeader: boolean): RevSimpleSchemaServer.Column<BCS>[] {
        const { rows } = this.getInitialDefinedRows(dataRows, 1);
        if (rows.length === 0) {
            return [];
        } else {
            const row = rows[0];
            const result = Object.keys(row).map((key, index) => ({
                name: key,
                index,
                settings: this._columnSettings,
                headers: keyIsHeader ? [key] : []
            }));
            return result;
        }
    }

    /**
     * @summary Find initial defined elements in rows.
     * @param maxCount - the maximum number of initial rows to return
     * @returns The initial rows (up to maxCount) and the number of source rows these covered (may be more
     * than max count if some rows are undefined).
     */
    getInitialDefinedRows(sourceRows: readonly RevSimpleServerSet.DataRow[], maxCount: number): GetInitialDefinedRowsResult {
        const rows = new Array<RevSimpleServerSet.DataRow>(maxCount);

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
export namespace RevSimpleServerSet {
    export interface DataRow extends RevSimpleMainDataServer.DataRow {
        [columnName: string]: DataServer.ViewValue | string; // can also have header
    }
}

interface ExtractSchemaAndHeadersFromDataResult<BCS extends BehavioredColumnSettings> {
    schema: RevSimpleSchemaServer.Column<BCS>[];
    dataRows: RevSimpleServerSet.DataRow[];
}

interface GetInitialDefinedRowsResult {
    rows: RevSimpleServerSet.DataRow[];
    sourceCount: number;
}
