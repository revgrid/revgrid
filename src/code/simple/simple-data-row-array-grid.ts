// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevGridDefinition, RevGridOptions, RevSubgrid, RevViewCell } from '../client/internal-api';
import { RevDataRowArrayDataServer, RevDataRowArrayGrid, RevDataRowArraySchemaServer } from '../data-row-array/internal-api';
import { RevSingleHeadingDataServer, RevSingleHeadingSchemaField } from '../header/internal-api';
import { RevStandardHeaderTextCellPainter } from '../standard/internal-api';
import { RevSimpleAlphaTextCellPainter } from './cell-painter/internal-api';
import { RevSimpleInMemoryBehavioredGridSettings, revSimpleReadonlyDefaultBehavioredColumnSettings } from './settings-implementations/internal-api';
import { RevSimpleBehavioredColumnSettings, RevSimpleBehavioredGridSettings } from './settings/internal-api';

/** @public */
export class RevSimpleDataRowArrayGrid extends RevDataRowArrayGrid<
    RevSimpleBehavioredGridSettings,
    RevSimpleBehavioredColumnSettings,
    RevSingleHeadingSchemaField
> {
    private readonly _headerCellPainter: RevStandardHeaderTextCellPainter<
        RevSimpleBehavioredGridSettings,
        RevSimpleBehavioredColumnSettings,
        RevSingleHeadingSchemaField
    >;
    private readonly _textCellPainter: RevSimpleAlphaTextCellPainter<
        RevSimpleBehavioredGridSettings,
        RevSimpleBehavioredColumnSettings,
        RevSingleHeadingSchemaField
    >;


    constructor(
        gridHostElement: HTMLElement,
        settings?: RevSimpleInMemoryBehavioredGridSettings,
        options?: RevGridOptions<RevSimpleBehavioredGridSettings, RevSimpleBehavioredColumnSettings, RevSingleHeadingSchemaField>,
    ) {
        const schemaServer = new RevDataRowArraySchemaServer<RevSingleHeadingSchemaField>();
        const mainDataServer = new RevDataRowArrayDataServer<RevSingleHeadingSchemaField>();
        const headerDataServer = new RevSingleHeadingDataServer<RevSingleHeadingSchemaField>();

        const definition: RevGridDefinition<RevSimpleBehavioredColumnSettings, RevSingleHeadingSchemaField> = {
            schemaServer,
            subgrids: [
                {
                    role: RevSubgrid.Role.header,
                    dataServer: headerDataServer,
                    getCellPainterEventer: (viewCell) => this.getHeaderCellPainter(viewCell),
                },
                {
                    role: RevSubgrid.Role.main,
                    dataServer: mainDataServer,
                    getCellPainterEventer: (viewCell) => this.getMainCellPainter(viewCell),
                }
            ],
        };

        super(
            gridHostElement,
            definition,
            settings ?? new RevSimpleInMemoryBehavioredGridSettings,
            () => revSimpleReadonlyDefaultBehavioredColumnSettings,
            options
        );

        this._headerCellPainter = new RevStandardHeaderTextCellPainter(this, headerDataServer);
        this._textCellPainter = new RevSimpleAlphaTextCellPainter(this, mainDataServer);
    }

    private getHeaderCellPainter(_viewCell: RevViewCell<RevSimpleBehavioredColumnSettings, RevSingleHeadingSchemaField>) {
        return this._headerCellPainter;
    }

    private getMainCellPainter(_viewCell: RevViewCell<RevSimpleBehavioredColumnSettings, RevSingleHeadingSchemaField>) {
        return this._textCellPainter;
    }
}
