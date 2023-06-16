import {
    DatalessSubgrid,
    DatalessViewCell,
    LinedHoverCell,
    Point,
    RevSimpleSchemaServer,
    RevSimpleServerSet,
    Revgrid,
    StandardAlphaTextCellPainter,
    StandardBehavioredColumnSettings,
    StandardBehavioredGridSettings,
    StandardHeaderTextCellPainter,
    standardReadonlyDefaultBehavioredGridSettings
} from '..';

export class SimpleGrid extends Revgrid<
        StandardBehavioredGridSettings,
        StandardBehavioredColumnSettings,
        RevSimpleSchemaServer.Column<StandardBehavioredColumnSettings>
    > {

    cellFocusEventer: SimpleGrid.CellFocusEventer | undefined;
    clickEventer: SimpleGrid.RowFocusClickEventer | undefined;
    dblClickEventer: SimpleGrid.RowFocusDblClickEventer | undefined;

    private readonly _serverSet: RevSimpleServerSet<StandardBehavioredColumnSettings>;

    private readonly _headerCellPainter: StandardHeaderTextCellPainter<
        StandardBehavioredGridSettings, StandardBehavioredColumnSettings,
        RevSimpleSchemaServer.Column<StandardBehavioredColumnSettings>
    >;
    private readonly _textCellPainter: StandardAlphaTextCellPainter<
        StandardBehavioredGridSettings,
        StandardBehavioredColumnSettings,
        RevSimpleSchemaServer.Column<StandardBehavioredColumnSettings>
    >;

    constructor(
        gridElement: HTMLElement,
        gridSettings: StandardBehavioredGridSettings,
    ) {
        const serverSet = new RevSimpleServerSet(standardReadonlyDefaultBehavioredGridSettings);

        const headerDataServer = serverSet.headerDataServer;
        const mainDataServer = serverSet.mainDataServer;

        const definition: Revgrid.Definition<StandardBehavioredColumnSettings, RevSimpleSchemaServer.Column<StandardBehavioredColumnSettings>> = {
            schemaServer: serverSet.schemaServer,
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

        super(gridElement, definition, gridSettings);

        this._serverSet = serverSet;

        this._headerCellPainter = new StandardHeaderTextCellPainter(this, headerDataServer);
        this._textCellPainter = new StandardAlphaTextCellPainter(this, mainDataServer);
    }

    get schemaServer() { return this._serverSet.schemaServer; }
    get headerAdapter() { return this._serverSet.headerDataServer; }

    get fieldCount(): number { return this.schemaServer.getSchema().length; }

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
        hoverCell: LinedHoverCell<StandardBehavioredColumnSettings, RevSimpleSchemaServer.Column<StandardBehavioredColumnSettings>> | null | undefined
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
        hoverCell: LinedHoverCell<StandardBehavioredColumnSettings, RevSimpleSchemaServer.Column<StandardBehavioredColumnSettings>> | null | undefined
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

    setData(data: RevSimpleServerSet.DataRow[], headerRowCount = -1): void {
        this._serverSet.setData(data, headerRowCount)
    }

    private getHeaderCellPainter(_viewCell: DatalessViewCell<StandardBehavioredColumnSettings, RevSimpleSchemaServer.Column<StandardBehavioredColumnSettings>>) {
        return this._headerCellPainter;
    }

    private getMainCellPainter(_viewCell: DatalessViewCell<StandardBehavioredColumnSettings, RevSimpleSchemaServer.Column<StandardBehavioredColumnSettings>>) {
        return this._textCellPainter;
    }
}

export namespace SimpleGrid {
    export type CellFocusEventer = (this: void, newPoint: Point | undefined, oldPoint: Point | undefined) => void;
    export type RowFocusClickEventer = (this: void, columnIndex: number, rowIndex: number) => void;
    export type RowFocusDblClickEventer = (this: void, columnIndex: number, rowIndex: number) => void;
}

