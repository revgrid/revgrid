import { AssertError, DataServer } from '../../grid/grid-public-api';
import { StandardBehavioredColumnSettings, readonlyDefaultStandardBehavioredColumnSettings } from '../../standard/standard-public-api';
import { RevDataRowArrayHeaderDataServer } from './rev-data-row-array-header-data-server';
import { RevDataRowArrayMainDataServer } from './rev-data-row-array-main-data-server';
import { RevDataRowArraySchemaField } from './rev-data-row-array-schema-field';
import { RevDataRowArraySchemaServer } from './rev-data-row-array-schema-server';

/** @public */
export class RevDataRowArrayServerSet {
    readonly schemaServer = new RevDataRowArraySchemaServer<StandardBehavioredColumnSettings, RevDataRowArraySchemaField<StandardBehavioredColumnSettings>>;
    readonly mainDataServer = new RevDataRowArrayMainDataServer<StandardBehavioredColumnSettings, RevDataRowArraySchemaField<StandardBehavioredColumnSettings>>();
    readonly headerDataServer = new RevDataRowArrayHeaderDataServer<StandardBehavioredColumnSettings, RevDataRowArraySchemaField<StandardBehavioredColumnSettings>>();

    /**
     * Establish new data and schema.
     * If no data provided, data will be set to 0 rows.
     * @param data - Array of congruent uniform objects containing the grid data and possibly also header rows.
     * @param headerRowCount - Number of Header rows. If greater than 0, then the initial rows in data actually contain headers. They
     * should be stripped from data and included in header. If less than 0, then there should be one header row and the header values
     * should be derived from column names in data.
     */
    setData(data: RevDataRowArrayServerSet.DataRow[] | (() => RevDataRowArrayServerSet.DataRow[]), headerRowCount = -1) {
        if (data === undefined) {
            return;
        } else {
            let dataRows = typeof data === 'function' ? data() : data;

            if (!Array.isArray(dataRows)) {
                throw new AssertError('BSD73766', 'Expected data to be an array of data row objects');
            } else {
                let schema: RevDataRowArraySchemaField<StandardBehavioredColumnSettings>[];
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

                this.mainDataServer.beginDataChange();
                try {
                    this.schemaServer.reset(schema);
                    this.headerDataServer.reset(headerRowCount);
                    this.mainDataServer.reset(dataRows);
                } finally {
                    this.mainDataServer.endDataChange();
                }
            }
        }
    }

    private extractSchemaAndHeadersFromData(
        rows: RevDataRowArrayServerSet.DataRow[],
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
            const fieldKeys = Object.keys(firstHeaderRow);

            const fieldCount = fieldKeys.length;
            const schema = new Array<RevDataRowArraySchemaField<StandardBehavioredColumnSettings>>(fieldCount);
            for (let fieldIndex = 0; fieldIndex < fieldCount; fieldIndex++) {
                const columnKey = fieldKeys[fieldIndex];
                const columnHeaders = new Array<string>(headerCount);
                for (let rowIndex = 0; rowIndex < headerCount; rowIndex++) {
                    const row = headerRows[rowIndex];
                    const header = this.convertDataValueToString(row[columnKey]);
                    columnHeaders[rowIndex] = header;
                }
                schema[fieldIndex] = {
                    name: columnKey,
                    index: fieldIndex,
                    headers: columnHeaders,
                    columnSettings: readonlyDefaultStandardBehavioredColumnSettings,
                };
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

    private calculateSchemaFromData(dataRows: RevDataRowArrayServerSet.DataRow[], keyIsHeader: boolean): RevDataRowArraySchemaField<StandardBehavioredColumnSettings>[] {
        const { rows } = this.getInitialDefinedRows(dataRows, 1);
        if (rows.length === 0) {
            return [];
        } else {
            const row = rows[0];
            const result: RevDataRowArraySchemaField<StandardBehavioredColumnSettings>[] = Object.keys(row).map((key, index) => ({
                name: key,
                index,
                headers: keyIsHeader ? [key] : [],
                columnSettings: readonlyDefaultStandardBehavioredColumnSettings,
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
    getInitialDefinedRows(sourceRows: readonly RevDataRowArrayServerSet.DataRow[], maxCount: number): GetInitialDefinedRowsResult {
        const rows = new Array<RevDataRowArrayServerSet.DataRow>(maxCount);

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
export namespace RevDataRowArrayServerSet {
    export interface DataRow extends RevDataRowArrayMainDataServer.DataRow {
        [fieldName: string]: DataServer.ViewValue | string; // can also have header
    }
}

interface ExtractSchemaAndHeadersFromDataResult {
    schema: RevDataRowArraySchemaField<StandardBehavioredColumnSettings>[];
    dataRows: RevDataRowArrayServerSet.DataRow[];
}

interface GetInitialDefinedRowsResult {
    rows: RevDataRowArrayServerSet.DataRow[];
    sourceCount: number;
}
