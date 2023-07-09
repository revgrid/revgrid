import { ApiError, AssertError, DataServer, SchemaField } from '../../../grid/grid-public-api';
import { DataRowArrayMainDataServer } from '../common/data-row-array-main-data-server';
import { DataRowArraySchemaServer } from '../common/server-sets-data-row-array-multi-heading-public-api';
import { SingleHeadingDataRowArrayHeaderDataServer } from './single-heading-data-row-array-header-data-server';
import { SingleHeadingDataRowArraySchemaField } from './single-heading-data-row-array-schema-field';

/** @public */
export class SingleHeadingDataRowArrayServerSet<SF extends SingleHeadingDataRowArraySchemaField> {
    readonly schemaServer = new DataRowArraySchemaServer<SF>;
    readonly mainDataServer = new DataRowArrayMainDataServer<SF>();
    readonly headerDataServer = new SingleHeadingDataRowArrayHeaderDataServer<SF>();

    constructor(
        /** @private */
        private readonly _createFieldEventer: SingleHeadingDataRowArrayServerSet.CreateFieldEventer<SF>,
    ) {

    }

    /**
     * Establish new data and schema.
     * If no data provided, data will be set to 0 rows.
     * @param data - Array of congruent uniform objects containing the grid data and possibly also header rows.
     */
    setData(data: SingleHeadingDataRowArrayServerSet.DataRow[] | (() => SingleHeadingDataRowArrayServerSet.DataRow[]), keyIsHeading: boolean) {
        if (data === undefined) {
            return;
        } else {
            const dataRows = typeof data === 'function' ? data() : data;
            let mainDataRows: SingleHeadingDataRowArrayServerSet.DataRow[];

            if (!Array.isArray(dataRows)) {
                throw new AssertError('BSD73766', 'Expected data to be an array of data row objects');
            } else {
                let schema: SF[];
                if (keyIsHeading) {
                    schema = this.calculateSchemaFromKeys(dataRows);
                    mainDataRows = dataRows;
                } else {
                    const schemaAndMainDataRows = this.extractSchemaAndMainDataRowsFromData(dataRows);
                    schema = schemaAndMainDataRows.schema;
                    mainDataRows = schemaAndMainDataRows.mainDataRows;
                }

                this.mainDataServer.beginDataChange();
                try {
                    this.schemaServer.reset(schema);
                    this.headerDataServer.reset();
                    this.mainDataServer.reset(mainDataRows);
                } finally {
                    this.mainDataServer.endDataChange();
                }
            }
        }
    }

    private extractSchemaAndMainDataRowsFromData(dataRows: SingleHeadingDataRowArrayServerSet.DataRow[]): ExtractSchemaAndMainDataRowsFromDataResult<SF> {
        if (dataRows.length === 0) {
            throw new ApiError('SHDRAHSSESAMDRFD20009', 'Cannot extract header row from empty data rows array');
        } else {
            const headerRow = dataRows[0];
            dataRows.splice(0, 1);
            const fieldKeys = Object.keys(headerRow);

            const fieldCount = fieldKeys.length;
            const schema = new Array<SF>(fieldCount);
            for (let fieldIndex = 0; fieldIndex < fieldCount; fieldIndex++) {
                const key = fieldKeys[fieldIndex];
                const headingDataValue = headerRow[key];
                const heading = this.convertDataValueToString(headingDataValue);
                const field = this._createFieldEventer(fieldIndex, key, heading);
                schema[fieldIndex] = field;
            }

            return {
                mainDataRows: dataRows,
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

    private calculateSchemaFromKeys(dataRows: SingleHeadingDataRowArrayServerSet.DataRow[]): SF[] {
        if (dataRows.length === 0) {
            return [];
        } else {
            const row = dataRows[0];
            const keys = Object.keys(row);
            const fieldCount = keys.length;
            const schema = new Array<SF>(fieldCount);
            for (let i = 0; i < fieldCount; i++) {
                const key = keys[i];
                const field = this._createFieldEventer(i, key, key);
                schema[i] = field;
            }
            return schema;
        }
    }
}

/** @public */
export namespace SingleHeadingDataRowArrayServerSet {
    export type CreateFieldEventer<SF extends SchemaField> = (this: void, index: number, key: string, heading: string) => SF;
    export interface DataRow extends DataRowArrayMainDataServer.DataRow {
        [fieldName: string]: DataServer.ViewValue | string; // can also have header
    }
}

interface ExtractSchemaAndMainDataRowsFromDataResult<SF extends SingleHeadingDataRowArraySchemaField> {
    schema: SF[];
    mainDataRows: SingleHeadingDataRowArrayServerSet.DataRow[];
}
