import {
    DatalessSubgrid,
    DatalessViewCell,
    LinedHoverCell,
    Point,
    RevDataRowArraySchemaField,
    RevDataRowArrayServerSet,
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
        RevDataRowArraySchemaField
    > {

    cellFocusEventer: SimpleGrid.CellFocusEventer | undefined;
    clickEventer: SimpleGrid.RowFocusClickEventer | undefined;
    dblClickEventer: SimpleGrid.RowFocusDblClickEventer | undefined;

    private readonly _serverSet: RevDataRowArrayServerSet;

    private readonly _headerCellPainter: StandardHeaderTextCellPainter<
        StandardBehavioredGridSettings,
        StandardBehavioredColumnSettings,
        RevDataRowArraySchemaField
    >;
    private readonly _textCellPainter: StandardAlphaTextCellPainter<
        StandardBehavioredGridSettings,
        StandardBehavioredColumnSettings,
        RevDataRowArraySchemaField
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

        const serverSet = new RevDataRowArrayServerSet();
        const schemaServer = serverSet.schemaServer;

        const headerDataServer = serverSet.headerDataServer;
        const mainDataServer = serverSet.mainDataServer;

        const definition: Revgrid.Definition<StandardBehavioredColumnSettings, RevDataRowArraySchemaField> = {
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

    get schemaServer() { return this._serverSet.schemaServer; }
    get headerAdapter() { return this._serverSet.headerDataServer; }

    get fieldCount(): number { return this.schemaServer.getFields().length; }

    get columnCount(): number { return this.activeColumnCount; }

    get headerRowCount(): number {
        return this.headerAdapter.getRowCount();
    }

    protected override descendantProcessCellFocusChanged(oldPoint: Point | undefined, newPoint: Point | undefined) {
        if (this.cellFocusEventer !== undefined) {
            this.cellFocusEventer(oldPoint, newPoint);
        }
    }

    protected override descendantProcessClick(
        event: MouseEvent,
        hoverCell: LinedHoverCell<StandardBehavioredColumnSettings, RevDataRowArraySchemaField> | null | undefined
    ) {
        if (this.clickEventer !== undefined) {
            if (hoverCell !== null) {
                if (hoverCell === undefined) {
                    hoverCell = this.viewLayout.findLinedHoverCell(event.offsetX, event.offsetY);
                }
                if (hoverCell !== undefined) {
                    if (!LinedHoverCell.isMouseOverLine(hoverCell)) {
                        const viewCell = hoverCell.viewCell;
                        this.clickEventer(viewCell.viewLayoutColumn.activeColumnIndex, viewCell.viewLayoutRow.subgridRowIndex);
                    }
                }
            }
        }
    }

    protected override descendantProcessDblClick(
        event: MouseEvent,
        hoverCell: LinedHoverCell<StandardBehavioredColumnSettings, RevDataRowArraySchemaField> | null | undefined
    ) {
        if (this.dblClickEventer !== undefined) {
            if (hoverCell !== null) {
                if (hoverCell === undefined) {
                    hoverCell = this.viewLayout.findLinedHoverCell(event.offsetX, event.offsetY);
                }
                if (hoverCell !== undefined) {
                    if (!LinedHoverCell.isMouseOverLine(hoverCell)) {
                        const viewCell = hoverCell.viewCell;
                        this.dblClickEventer(viewCell.viewLayoutColumn.activeColumnIndex, viewCell.viewLayoutRow.subgridRowIndex);
                    }
                }
            }
        }
    }

    setData(data: RevDataRowArrayServerSet.DataRow[], headerRowCount = -1): void {
        this._serverSet.setData(data, headerRowCount)
    }

    private getHeaderCellPainter(_viewCell: DatalessViewCell<StandardBehavioredColumnSettings, RevDataRowArraySchemaField>) {
        return this._headerCellPainter;
    }

    private getMainCellPainter(_viewCell: DatalessViewCell<StandardBehavioredColumnSettings, RevDataRowArraySchemaField>) {
        return this._textCellPainter;
    }
}

export namespace SimpleGrid {
    export type CellFocusEventer = (this: void, newPoint: Point | undefined, oldPoint: Point | undefined) => void;
    export type RowFocusClickEventer = (this: void, columnIndex: number, rowIndex: number) => void;
    export type RowFocusDblClickEventer = (this: void, columnIndex: number, rowIndex: number) => void;
}

