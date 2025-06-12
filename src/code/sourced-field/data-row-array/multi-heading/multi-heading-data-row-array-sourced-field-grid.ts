import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevClientGrid, RevGridDefinition, RevGridOptions, RevSubgrid } from '../../../client/internal-api';
import { RevAssertError } from '../../../common/internal-api';
import { RevDataRowArrayDataServer, RevDataRowArrayGrid, RevDataRowArraySchemaServer } from '../../../data-row-array/internal-api';
import { RevMultiHeadingDataServer } from '../../../header/internal-api';
import { RevSourcedFieldGrid } from '../../sourced-field/internal-api';
import { RevAllowedMultiHeadingDataRowArraySourcedFieldsColumnLayoutDefinition, RevMultiHeadingDataRowArraySourcedField } from './server/internal-api';

/** @public */
export class RevMultiHeadingDataRowArraySourcedFieldGrid<
    BGS extends RevBehavioredGridSettings,
    BCS extends RevBehavioredColumnSettings,
    SF extends RevMultiHeadingDataRowArraySourcedField
> extends RevDataRowArrayGrid<BGS, BCS, SF> implements RevSourcedFieldGrid<BGS, BCS, SF> {
    declare headerDataServer: RevMultiHeadingDataServer<SF>;

    constructor(
        gridHostElement: HTMLElement,
        getHeaderCellPainterEventer: RevSubgrid.GetCellPainterEventer<BCS, SF>,
        getMainCellPainterEventer: RevSubgrid.GetCellPainterEventer<BCS, SF>,
        settings: BGS,
        getSettingsForNewColumnEventer: RevClientGrid.GetSettingsForNewColumnEventer<BCS, SF>,
        /** @internal */
        private readonly _createFieldEventer: RevMultiHeadingDataRowArraySourcedFieldGrid.CreateFieldEventer<SF>,
        options?: RevGridOptions<BGS, BCS, SF>,
    ) {
        const schemaServer = new RevDataRowArraySchemaServer<SF>();
        const mainDataServer = new RevDataRowArrayDataServer<SF>();
        const headerDataServer = new RevMultiHeadingDataServer<SF>();

        const definition: RevGridDefinition<BCS, SF> = {
            schemaServer,
            subgrids: [
                {
                    role: RevSubgrid.Role.header,
                    dataServer: headerDataServer,
                    getCellPainterEventer: getHeaderCellPainterEventer,
                },
                {
                    role: RevSubgrid.Role.main,
                    dataServer: mainDataServer,
                    getCellPainterEventer: getMainCellPainterEventer,
                },
            ],
        }
        super(gridHostElement, definition, settings, getSettingsForNewColumnEventer, options);
    }

    createAllowedSourcedFieldsColumnLayoutDefinition(allowedFields: readonly SF[]) {
        const definitionColumns = this.createColumnLayoutDefinitionColumns();
        return new RevAllowedMultiHeadingDataRowArraySourcedFieldsColumnLayoutDefinition(definitionColumns, allowedFields, this.settings.fixedColumnCount);
    }

    /**
     * Establish new data and schema.
     * If no data provided, data will be set to 0 rows.
     * @param data - Array of congruent uniform objects containing the grid data and possibly also header rows.
     * @param headerRowCount - Number of Header rows. If greater than 0, then the initial rows in data actually contain headers. They
     * should be stripped from data and included in header. If less than 0, then there should be one header row and the header values
     * should be derived from column names in data.
     */
    setData(data: RevDataRowArrayGrid.DataRow[] | (() => RevDataRowArrayGrid.DataRow[]), headerRowCount = -1) {
        const dataRows = typeof data === 'function' ? data() : data;
        let mainDataRows: RevDataRowArrayGrid.DataRow[];

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

    private extractSchemaAndMainDataRowsFromData(
        dataRows: RevDataRowArrayGrid.DataRow[],
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

    private calculateSchemaFromData(dataRows: RevDataRowArrayGrid.DataRow[], keyIsHeading: boolean): SF[] {
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
    private getInitialDefinedRows(sourceRows: readonly RevDataRowArrayGrid.DataRow[], maxCount: number): GetInitialDefinedRowsResult {
        const rows = new Array<RevDataRowArrayGrid.DataRow>(maxCount);

        const sourceCount = sourceRows.length;
        let initialCount = 0;
        for (let i = 0; i < sourceCount; i++) {
            const row = sourceRows[i];
            rows[initialCount++] = row;
            if (initialCount === maxCount) {
                return {
                    rows,
                    sourceCount: i + 1,
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
export namespace RevMultiHeadingDataRowArraySourcedFieldGrid {
    export type CreateFieldEventer<SF extends RevMultiHeadingDataRowArraySourcedField> = (this: void, index: number, key: string, headings: string[]) => SF;
}

interface ExtractSchemaAndMainDataRowsFromDataResult<SF extends RevMultiHeadingDataRowArraySourcedField> {
    schema: SF[];
    mainDataRows: RevDataRowArrayGrid.DataRow[];
}

interface GetInitialDefinedRowsResult {
    rows: RevDataRowArrayGrid.DataRow[];
    sourceCount: number;
}
