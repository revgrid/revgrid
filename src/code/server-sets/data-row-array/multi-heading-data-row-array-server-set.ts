import { RevAssertError, RevDataServer } from '../../grid/grid-public-api';
import { MultiHeadingDataServer } from '../multi-heading/multi-heading-data-server';
import { MultiHeadingSchemaField } from '../multi-heading/multi-heading-schema-field';
import { DataRowArrayDataServer } from './data-row-array-data-server';
import { DataRowArraySchemaServer } from './data-row-array-schema-server';

/** @public */
export class MultiHeadingDataRowArrayServerSet<SF extends MultiHeadingSchemaField> {
    readonly schemaServer = new DataRowArraySchemaServer<SF>;
    readonly mainDataServer = new DataRowArrayDataServer<SF>();
    readonly headerDataServer = new MultiHeadingDataServer<SF>();

    constructor(
        /** @internal */
        private readonly _createFieldEventer: MultiHeadingDataRowArrayServerSet.CreateFieldEventer<SF>,
    ) {

    }

    /**
     * Establish new data and schema.
     * If no data provided, data will be set to 0 rows.
     * @param data - Array of congruent uniform objects containing the grid data and possibly also header rows.
     * @param headerRowCount - Number of Header rows. If greater than 0, then the initial rows in data actually contain headers. They
     * should be stripped from data and included in header. If less than 0, then there should be one header row and the header values
     * should be derived from column names in data.
     */
    setData(data: MultiHeadingDataRowArrayServerSet.DataRow[] | (() => MultiHeadingDataRowArrayServerSet.DataRow[]), headerRowCount = -1) {
        if (data === undefined) {
            return;
        } else {
            const dataRows = typeof data === 'function' ? data() : data;
            let mainDataRows: MultiHeadingDataRowArrayServerSet.DataRow[];

            if (!Array.isArray(dataRows)) {
                throw new RevAssertError('BSD73766', 'Expected data to be an array of data row objects');
            } else {
                let schema: SF[];
                if (headerRowCount < 0) {
                    schema = this.calculateSchemaFromData(dataRows, true);
                    mainDataRows = dataRows;
                } else {
                    if (headerRowCount === 0) {
                        schema = this.calculateSchemaFromData(dataRows, false);
                        mainDataRows = dataRows;
                    } else {
                        const schemaAndMainDataRows = this.extractSchemaAndMainDataRowsFromData(dataRows, headerRowCount);
                        schema = schemaAndMainDataRows.schema;
                        mainDataRows = schemaAndMainDataRows.mainDataRows;
                    }
                }

                if (schema.length === 0) {
                    headerRowCount = 0;
                } else {
                    headerRowCount = schema[0].headings.length;
                }

                this.mainDataServer.beginDataChange();
                try {
                    this.schemaServer.reset(schema);
                    this.headerDataServer.reset(headerRowCount);
                    this.mainDataServer.reset(mainDataRows);
                } finally {
                    this.mainDataServer.endDataChange();
                }
            }
        }
    }

    private extractSchemaAndMainDataRowsFromData(
        dataRows: MultiHeadingDataRowArrayServerSet.DataRow[],
        headerRowCount: number
    ): ExtractSchemaAndMainDataRowsFromDataResult<SF> {
        const { rows: headerRows, sourceCount: initialSourceCount } = this.getInitialDefinedRows(dataRows, headerRowCount);
        const headerCount = headerRows.length;
        if (headerCount === 0) {
            return {
                mainDataRows: [],
                schema: [],
            };
        } else {
            dataRows.splice(0, initialSourceCount);
            const firstHeaderRow = headerRows[0];
            const fieldKeys = Object.keys(firstHeaderRow);

            const fieldCount = fieldKeys.length;
            const schema = new Array<SF>(fieldCount);
            for (let fieldIndex = 0; fieldIndex < fieldCount; fieldIndex++) {
                const key = fieldKeys[fieldIndex];
                const headings = new Array<string>(headerCount);
                for (let rowIndex = 0; rowIndex < headerCount; rowIndex++) {
                    const row = headerRows[rowIndex];
                    const heading = this.convertDataValueToString(row[key]);
                    headings[rowIndex] = heading;
                }
                const field = this._createFieldEventer(fieldIndex, key, headings);
                field.index = fieldIndex;
                schema[fieldIndex] = field;
            }

            return {
                mainDataRows: dataRows,
                schema,
            };
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    private convertDataValueToString(value: RevDataServer.ViewValue | string): string {
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

    private calculateSchemaFromData(dataRows: MultiHeadingDataRowArrayServerSet.DataRow[], keyIsHeading: boolean): SF[] {
        const { rows } = this.getInitialDefinedRows(dataRows, 1);
        if (rows.length === 0) {
            return [];
        } else {
            const row = rows[0];
            const keys = Object.keys(row);
            const fieldCount = keys.length;
            const schema = new Array<SF>(fieldCount);
            for (let i = 0; i < fieldCount; i++) {
                const key = keys[i];
                const field = this._createFieldEventer(i, key, keyIsHeading ? [key] : []);
                field.index = i;
                schema[i] = field;
            }
            return schema;
        }
    }

    /**
     * Find initial defined elements in rows.
     * @param maxCount - the maximum number of initial rows to return
     * @returns The initial rows (up to maxCount) and the number of source rows these covered (may be more
     * than max count if some rows are undefined).
     */
    private getInitialDefinedRows(sourceRows: readonly MultiHeadingDataRowArrayServerSet.DataRow[], maxCount: number): GetInitialDefinedRowsResult {
        const rows = new Array<MultiHeadingDataRowArrayServerSet.DataRow>(maxCount);

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
export namespace MultiHeadingDataRowArrayServerSet {
    export type CreateFieldEventer<SF extends MultiHeadingSchemaField> = (this: void, index: number, key: string, headings: string[]) => SF;
    // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
    export interface DataRow extends RevDataServer.ObjectViewRow {
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
        [fieldName: string]: RevDataServer.ViewValue | string; // can also have header
    }
}

interface ExtractSchemaAndMainDataRowsFromDataResult<SF extends MultiHeadingSchemaField> {
    schema: SF[];
    mainDataRows: MultiHeadingDataRowArrayServerSet.DataRow[];
}

interface GetInitialDefinedRowsResult {
    rows: MultiHeadingDataRowArrayServerSet.DataRow[];
    sourceCount: number;
}
