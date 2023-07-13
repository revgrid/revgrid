import {
    DatalessSubgrid,
    DatalessViewCell,
    LinedHoverCell,
    MultiHeadingDataRowArraySchemaField,
    MultiHeadingDataRowArrayServerSet,
    Point,
    Revgrid,
    StandardAlphaTextCellPainter,
    StandardBehavioredColumnSettings,
    StandardBehavioredGridSettings,
    StandardHeaderTextCellPainter,
    readonlyDefaultStandardBehavioredColumnSettings,
    readonlyDefaultStandardBehavioredGridSettings
} from '..';

export class SimpleGrid extends Revgrid<
        StandardBehavioredGridSettings,
        StandardBehavioredColumnSettings,
        MultiHeadingDataRowArraySchemaField
    > {

    cellFocusEventer: SimpleGrid.CellFocusEventer | undefined;
    clickEventer: SimpleGrid.RowFocusClickEventer | undefined;
    dblClickEventer: SimpleGrid.RowFocusDblClickEventer | undefined;

    private readonly _serverSet: MultiHeadingDataRowArrayServerSet<MultiHeadingDataRowArraySchemaField>;

    private readonly _headerCellPainter: StandardHeaderTextCellPainter<
        StandardBehavioredGridSettings,
        StandardBehavioredColumnSettings,
        MultiHeadingDataRowArraySchemaField
    >;
    private readonly _textCellPainter: StandardAlphaTextCellPainter<
        StandardBehavioredGridSettings,
        StandardBehavioredColumnSettings,
        MultiHeadingDataRowArraySchemaField
    >;

    constructor(
        gridElement: HTMLElement,
    ) {
        const gridSettings: StandardBehavioredGridSettings = {
            ...readonlyDefaultStandardBehavioredGridSettings,
            mouseColumnSelection: false,
            mouseRowSelection: false,
            multipleSelectionAreas: false,
        };

        const serverSet = new MultiHeadingDataRowArrayServerSet<MultiHeadingDataRowArraySchemaField>(
            (index, key, headings) => ({
                index,
                name: key,
                headings,
            }),
        );
        const schemaServer = serverSet.schemaServer;

        const headerDataServer = serverSet.headerDataServer;
        const mainDataServer = serverSet.mainDataServer;

        const definition: Revgrid.Definition<StandardBehavioredColumnSettings, MultiHeadingDataRowArraySchemaField> = {
            schemaServer,
            subgrids: [
                {
                    role: DatalessSubgrid.RoleEnum.header,
                    dataServer: headerDataServer,
                    getCellPainterEventer: (viewCell) => this.getHeaderCellPainter(viewCell),
                },
                {
                    role: DatalessSubgrid.RoleEnum.main,
                    dataServer: mainDataServer,
                    getCellPainterEventer: (viewCell) => this.getMainCellPainter(viewCell),
                }
            ],
        };

        super(gridElement, definition, gridSettings, () => readonlyDefaultStandardBehavioredColumnSettings);

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

    protected override descendantProcessCellFocusChanged(oldPoint: Point | undefined, newPoint: Point | undefined) {
        if (this.cellFocusEventer !== undefined) {
            this.cellFocusEventer(oldPoint, newPoint);
        }
    }

    protected override descendantProcessClick(
        event: MouseEvent,
        hoverCell: LinedHoverCell<StandardBehavioredColumnSettings, MultiHeadingDataRowArraySchemaField> | null | undefined
    ) {
        if (this.clickEventer !== undefined) {
            if (hoverCell === null) {
                hoverCell = this.viewLayout.findLinedHoverCellAtCanvasOffset(event.offsetX, event.offsetY);
            }
            if (hoverCell !== undefined) {
                if (!LinedHoverCell.isMouseOverLine(hoverCell)) {
                    const viewCell = hoverCell.viewCell;
                    this.clickEventer(viewCell.viewLayoutColumn.activeColumnIndex, viewCell.viewLayoutRow.subgridRowIndex);
                }
            }
        }
    }

    protected override descendantProcessDblClick(
        event: MouseEvent,
        hoverCell: LinedHoverCell<StandardBehavioredColumnSettings, MultiHeadingDataRowArraySchemaField> | null | undefined
    ) {
        if (this.dblClickEventer !== undefined) {
            if (hoverCell === null) {
                hoverCell = this.viewLayout.findLinedHoverCellAtCanvasOffset(event.offsetX, event.offsetY);
            }
            if (hoverCell !== undefined) {
                if (!LinedHoverCell.isMouseOverLine(hoverCell)) {
                    const viewCell = hoverCell.viewCell;
                    this.dblClickEventer(viewCell.viewLayoutColumn.activeColumnIndex, viewCell.viewLayoutRow.subgridRowIndex);
                }
            }
        }
    }

    setData(data: MultiHeadingDataRowArrayServerSet.DataRow[], headerRowCount = -1): void {
        this._serverSet.setData(data, headerRowCount)
    }

    private getHeaderCellPainter(_viewCell: DatalessViewCell<StandardBehavioredColumnSettings, MultiHeadingDataRowArraySchemaField>) {
        return this._headerCellPainter;
    }

    private getMainCellPainter(_viewCell: DatalessViewCell<StandardBehavioredColumnSettings, MultiHeadingDataRowArraySchemaField>) {
        return this._textCellPainter;
    }
}

export namespace SimpleGrid {
    export type CellFocusEventer = (this: void, newPoint: Point | undefined, oldPoint: Point | undefined) => void;
    export type RowFocusClickEventer = (this: void, columnIndex: number, rowIndex: number) => void;
    export type RowFocusDblClickEventer = (this: void, columnIndex: number, rowIndex: number) => void;
}

