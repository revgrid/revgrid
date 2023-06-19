import {
    DatalessSubgrid,
    DatalessViewCell,
    LinedHoverCell,
    Point,
    RevDataRowArraySchemaServer,
    RevDataRowArrayServerSet,
    Revgrid,
    StandardAlphaTextCellPainter,
    StandardBehavioredColumnSettings,
    StandardBehavioredGridSettings,
    StandardHeaderTextCellPainter
} from '..';

export class SimpleGrid extends Revgrid<
        StandardBehavioredGridSettings,
        StandardBehavioredColumnSettings,
        RevDataRowArraySchemaServer.Field
    > {

    cellFocusEventer: SimpleGrid.CellFocusEventer | undefined;
    clickEventer: SimpleGrid.RowFocusClickEventer | undefined;
    dblClickEventer: SimpleGrid.RowFocusDblClickEventer | undefined;

    private readonly _serverSet: RevDataRowArrayServerSet<StandardBehavioredColumnSettings>;

    private readonly _headerCellPainter: StandardHeaderTextCellPainter<
        StandardBehavioredGridSettings,
        StandardBehavioredColumnSettings,
        RevDataRowArraySchemaServer.Field
    >;
    private readonly _textCellPainter: StandardAlphaTextCellPainter<
        StandardBehavioredGridSettings,
        StandardBehavioredColumnSettings,
        RevDataRowArraySchemaServer.Field
    >;

    constructor(
        gridElement: HTMLElement,
        gridSettings: StandardBehavioredGridSettings,
    ) {
        const serverSet = new RevDataRowArrayServerSet<StandardBehavioredColumnSettings>();
        const schemaServer = serverSet.schemaServer;
        // just use the grid settings for each column
        schemaServer.getFieldColumnSettingsEventer = (field) => gridSettings;

        const headerDataServer = serverSet.headerDataServer;
        const mainDataServer = serverSet.mainDataServer;

        const definition: Revgrid.Definition<StandardBehavioredColumnSettings, RevDataRowArraySchemaServer.Field> = {
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

        super(gridElement, definition, gridSettings);

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
        hoverCell: LinedHoverCell<StandardBehavioredColumnSettings, RevDataRowArraySchemaServer.Field> | null | undefined
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
        hoverCell: LinedHoverCell<StandardBehavioredColumnSettings, RevDataRowArraySchemaServer.Field> | null | undefined
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

    private getHeaderCellPainter(_viewCell: DatalessViewCell<StandardBehavioredColumnSettings, RevDataRowArraySchemaServer.Field>) {
        return this._headerCellPainter;
    }

    private getMainCellPainter(_viewCell: DatalessViewCell<StandardBehavioredColumnSettings, RevDataRowArraySchemaServer.Field>) {
        return this._textCellPainter;
    }
}

export namespace SimpleGrid {
    export type CellFocusEventer = (this: void, newPoint: Point | undefined, oldPoint: Point | undefined) => void;
    export type RowFocusClickEventer = (this: void, columnIndex: number, rowIndex: number) => void;
    export type RowFocusDblClickEventer = (this: void, columnIndex: number, rowIndex: number) => void;
}

