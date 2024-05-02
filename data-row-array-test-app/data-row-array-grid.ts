import {
    MultiHeadingDataRowArrayServerSet,
    MultiHeadingSchemaField,
    RevClientGrid,
    RevLinedHoverCell,
    RevPoint,
    RevViewCell,
    StandardAlphaTextCellPainter,
    StandardBehavioredColumnSettings,
    StandardBehavioredGridSettings,
    StandardHeaderTextCellPainter,
    readonlyDefaultStandardBehavioredColumnSettings,
    readonlyDefaultStandardBehavioredGridSettings
} from '..';

export class DataRowArrayGrid extends RevClientGrid<
        StandardBehavioredGridSettings,
        StandardBehavioredColumnSettings,
        MultiHeadingSchemaField
    > {

    cellFocusEventer: DataRowArrayGrid.CellFocusEventer | undefined;
    clickEventer: DataRowArrayGrid.RowFocusClickEventer | undefined;
    dblClickEventer: DataRowArrayGrid.RowFocusDblClickEventer | undefined;

    private readonly _serverSet: MultiHeadingDataRowArrayServerSet<MultiHeadingSchemaField>;

    private readonly _headerCellPainter: StandardHeaderTextCellPainter<
        StandardBehavioredGridSettings,
        StandardBehavioredColumnSettings,
        MultiHeadingSchemaField
    >;
    private readonly _textCellPainter: StandardAlphaTextCellPainter<
        StandardBehavioredGridSettings,
        StandardBehavioredColumnSettings,
        MultiHeadingSchemaField
    >;

    constructor(
        gridElement: HTMLElement,
        externalParent: unknown,
    ) {
        const gridSettings: StandardBehavioredGridSettings = {
            ...readonlyDefaultStandardBehavioredGridSettings,
            mouseColumnSelectionEnabled: false,
            mouseRowSelectionEnabled: false,
            multipleSelectionAreas: false,
        };

        const serverSet = new MultiHeadingDataRowArrayServerSet<MultiHeadingSchemaField>(
            (index, key, headings) => ({
                index,
                name: key,
                headings,
            }),
        );
        const schemaServer = serverSet.schemaServer;

        const headerDataServer = serverSet.headerDataServer;
        const mainDataServer = serverSet.mainDataServer;

        const definition: RevClientGrid.Definition<StandardBehavioredColumnSettings, MultiHeadingSchemaField> = {
            schemaServer,
            subgrids: [
                {
                    role: RevSubgrid.RoleEnum.header,
                    dataServer: headerDataServer,
                    getCellPainterEventer: (viewCell) => this.getHeaderCellPainter(viewCell),
                },
                {
                    role: RevSubgrid.RoleEnum.main,
                    dataServer: mainDataServer,
                    getCellPainterEventer: (viewCell) => this.getMainCellPainter(viewCell),
                }
            ],
        };

        super(gridElement, definition, gridSettings, () => readonlyDefaultStandardBehavioredColumnSettings, { externalParent });

        this._serverSet = serverSet;

        this._headerCellPainter = new StandardHeaderTextCellPainter(this, headerDataServer);
        this._textCellPainter = new StandardAlphaTextCellPainter(this, mainDataServer);
    }

    get headerDataServer() { return this._serverSet.headerDataServer; }

    get fieldCount(): number { return this.schemaServer.getFields().length; }

    get columnCount(): number { return this.activeColumnCount; }

    get headerRowCount(): number {
        return this.headerDataServer.getRowCount();
    }

    protected override descendantProcessCellFocusChanged(oldPoint: RevPoint | undefined, newPoint: RevPoint | undefined) {
        if (this.cellFocusEventer !== undefined) {
            this.cellFocusEventer(oldPoint, newPoint);
        }
    }

    protected override descendantProcessClick(
        event: MouseEvent,
        hoverCell: RevLinedHoverCell<StandardBehavioredColumnSettings, MultiHeadingSchemaField> | null | undefined
    ) {
        if (this.clickEventer !== undefined) {
            if (hoverCell === null) {
                hoverCell = this.viewLayout.findLinedHoverCellAtCanvasOffset(event.offsetX, event.offsetY);
            }
            if (hoverCell !== undefined) {
                if (!RevLinedHoverCell.isMouseOverLine(hoverCell)) {
                    const viewCell = hoverCell.viewCell;
                    this.clickEventer(viewCell.viewLayoutColumn.activeColumnIndex, viewCell.viewLayoutRow.subgridRowIndex);
                }
            }
        }
    }

    protected override descendantProcessDblClick(
        event: MouseEvent,
        hoverCell: RevLinedHoverCell<StandardBehavioredColumnSettings, MultiHeadingSchemaField> | null | undefined
    ) {
        if (this.dblClickEventer !== undefined) {
            if (hoverCell === null) {
                hoverCell = this.viewLayout.findLinedHoverCellAtCanvasOffset(event.offsetX, event.offsetY);
            }
            if (hoverCell !== undefined) {
                if (!RevLinedHoverCell.isMouseOverLine(hoverCell)) {
                    const viewCell = hoverCell.viewCell;
                    this.dblClickEventer(viewCell.viewLayoutColumn.activeColumnIndex, viewCell.viewLayoutRow.subgridRowIndex);
                }
            }
        }
    }

    setData(data: MultiHeadingDataRowArrayServerSet.DataRow[], headerRowCount = -1): void {
        this._serverSet.setData(data, headerRowCount)
    }

    private getHeaderCellPainter(_viewCell: RevViewCell<StandardBehavioredColumnSettings, MultiHeadingSchemaField>) {
        return this._headerCellPainter;
    }

    private getMainCellPainter(_viewCell: RevViewCell<StandardBehavioredColumnSettings, MultiHeadingSchemaField>) {
        return this._textCellPainter;
    }
}

export namespace DataRowArrayGrid {
    export type CellFocusEventer = (this: void, newPoint: RevPoint | undefined, oldPoint: RevPoint | undefined) => void;
    export type RowFocusClickEventer = (this: void, columnIndex: number, rowIndex: number) => void;
    export type RowFocusDblClickEventer = (this: void, columnIndex: number, rowIndex: number) => void;
}

