// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { BehavioredColumnSettings, BehavioredGridSettings, DatalessSubgrid, RevApiError, RevAssertError, RevClientGrid, RevGridDefinition, RevGridOptions, Subgrid } from '../../../client/internal-api';
import { RevDataRowArrayDataServer, RevDataRowArrayGrid, RevDataRowArraySchemaServer } from '../../../data-row-array/internal-api';
import { SingleHeadingDataServer } from '../../../header/internal-api';
import { RevSourcedFieldGrid } from '../../sourced-field/internal-api';
import { RevAllowedSingleHeadingDataRowArraySourcedFieldsColumnLayoutDefinition, RevSingleHeadingDataRowArraySourcedField } from './server/internal-api';

/** @public */
export class RevSingleHeadingDataRowArraySourcedFieldGrid<
    BGS extends BehavioredGridSettings,
    BCS extends BehavioredColumnSettings,
    SF extends RevSingleHeadingDataRowArraySourcedField
> extends RevDataRowArrayGrid<BGS, BCS, SF> implements RevSourcedFieldGrid<SF> {
    declare headerDataServer: SingleHeadingDataServer<SF>;

    constructor(
        gridHostElement: HTMLElement,
        getHeaderCellPainterEventer: Subgrid.GetCellPainterEventer<BCS, SF>,
        getMainCellPainterEventer: Subgrid.GetCellPainterEventer<BCS, SF>,
        settings: BGS,
        customiseSettingsForNewColumnEventer: RevClientGrid.GetSettingsForNewColumnEventer<BCS, SF>,
        /** @internal */
        private readonly _createFieldEventer: RevSingleHeadingDataRowArraySourcedFieldGrid.CreateFieldEventer<SF>,
        options?: RevGridOptions<BGS, BCS, SF>,
    ) {
        const schemaServer = new RevDataRowArraySchemaServer<SF>();
        const mainDataServer = new RevDataRowArrayDataServer<SF>();
        const headerDataServer = new SingleHeadingDataServer<SF>();

        const definition: RevGridDefinition<BCS, SF> = {
            schemaServer,
            subgrids: [
                {
                    role: DatalessSubgrid.RoleEnum.header,
                    dataServer: headerDataServer,
                    getCellPainterEventer: getHeaderCellPainterEventer,
                },
                {
                    role: DatalessSubgrid.RoleEnum.main,
                    dataServer: mainDataServer,
                    getCellPainterEventer: getMainCellPainterEventer,
                },
            ],
        }
        super(gridHostElement, definition, settings, customiseSettingsForNewColumnEventer, options);
    }

    createAllowedSourcedFieldsColumnLayoutDefinition(allowedFields: readonly SF[]) {
        const definitionColumns = this.createColumnLayoutDefinitionColumns();
        return new RevAllowedSingleHeadingDataRowArraySourcedFieldsColumnLayoutDefinition(definitionColumns, allowedFields, this.settings.fixedColumnCount);
    }

    /**
     * Establish new data and schema.
     * If no data provided, data will be set to 0 rows.
     * @param data - Array of congruent uniform objects containing the grid data and possibly also header rows.
     */
    setData(data: RevDataRowArrayGrid.DataRow[] | (() => RevDataRowArrayGrid.DataRow[]), keyIsHeading: boolean) {
        const dataRows = typeof data === 'function' ? data() : data;
        let mainDataRows: RevDataRowArrayGrid.DataRow[];

        if (!Array.isArray(dataRows)) {
            throw new RevAssertError('SHDRASFGSD73766', 'Expected data to be an array of data row objects');
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

    private extractSchemaAndMainDataRowsFromData(dataRows: RevDataRowArrayGrid.DataRow[]): ExtractSchemaAndMainDataRowsFromDataResult<SF> {
        if (dataRows.length === 0) {
            throw new RevApiError('SHDRAHSSESAMDRFD20009', 'Cannot extract header row from empty data rows array');
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
                field.index = fieldIndex;
                schema[fieldIndex] = field;
            }

            return {
                mainDataRows: dataRows,
                schema,
            };
        }
    }

    private calculateSchemaFromKeys(dataRows: RevDataRowArrayGrid.DataRow[]): SF[] {
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
                field.index = i;
                schema[i] = field;
            }
            return schema;
        }
    }
}

/** @public */
export namespace RevSingleHeadingDataRowArraySourcedFieldGrid {
    export type CreateFieldEventer<SF extends RevSingleHeadingDataRowArraySourcedField> = (this: void, index: number, key: string, heading: string) => SF;
}

interface ExtractSchemaAndMainDataRowsFromDataResult<SF extends RevSingleHeadingDataRowArraySourcedField> {
    schema: SF[];
    mainDataRows: RevDataRowArrayGrid.DataRow[];
}
