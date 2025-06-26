import { RevGridDefinition, RevGridOptions, RevSubgrid, RevViewCell } from '../client';
import { RevDataRowArrayDataServer, RevDataRowArrayGrid, RevDataRowArraySchemaServer } from '../data-row-array';
import { RevSingleHeadingDataServer, RevSingleHeadingField } from '../header';
import { RevStandardHeaderTextCellPainter } from '../standard';
import { RevSimpleAlphaTextCellPainter } from './cell-painter';
import { RevSimpleBehavioredColumnSettings, RevSimpleBehavioredGridSettings } from './settings';
import { RevSimpleInMemoryBehavioredGridSettings, revSimpleReadonlyDefaultBehavioredColumnSettings } from './settings-implementations';

/** @public */
export class RevSimpleDataRowArrayGrid extends RevDataRowArrayGrid<
    RevSimpleBehavioredGridSettings,
    RevSimpleBehavioredColumnSettings,
    RevSingleHeadingField
> {
    private readonly _headerCellPainter: RevStandardHeaderTextCellPainter<
        RevSimpleBehavioredGridSettings,
        RevSimpleBehavioredColumnSettings,
        RevSingleHeadingField
    >;
    private readonly _textCellPainter: RevSimpleAlphaTextCellPainter<
        RevSimpleBehavioredGridSettings,
        RevSimpleBehavioredColumnSettings,
        RevSingleHeadingField
    >;


    constructor(
        gridHostElement: HTMLElement,
        settings?: RevSimpleInMemoryBehavioredGridSettings,
        options?: RevGridOptions<RevSimpleBehavioredGridSettings, RevSimpleBehavioredColumnSettings, RevSingleHeadingField>,
    ) {
        const schemaServer = new RevDataRowArraySchemaServer<RevSingleHeadingField>();
        const mainDataServer = new RevDataRowArrayDataServer<RevSingleHeadingField>();
        const headerDataServer = new RevSingleHeadingDataServer<RevSingleHeadingField>();

        const definition: RevGridDefinition<RevSimpleBehavioredColumnSettings, RevSingleHeadingField> = {
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

    private getHeaderCellPainter(_viewCell: RevViewCell<RevSimpleBehavioredColumnSettings, RevSingleHeadingField>) {
        return this._headerCellPainter;
    }

    private getMainCellPainter(_viewCell: RevViewCell<RevSimpleBehavioredColumnSettings, RevSingleHeadingField>) {
        return this._textCellPainter;
    }
}
