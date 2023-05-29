import {
    GridSettings,
    RevSimpleHeaderDataServer,
    RevSimpleSchemaServer,
    RevSimpleServerSet,
    Revgrid,
    ViewCell
} from "..";

export class SimpleGrid extends Revgrid {
    private _lastNotifiedFocusedRowIndex: number | undefined;

    private _rowFocusEventer: SimpleGrid.RowFocusEventer | undefined;
    private _rowFocusClickEventer: SimpleGrid.RowFocusClickEventer | undefined;
    private _rowFocusDblClickEventer: SimpleGrid.RowFocusDblClickEventer | undefined;

    private readonly _serverSet: RevSimpleServerSet;

    private readonly _selectionChangedListener: (event: CustomEvent<SelectionDetail>) => void;
    private readonly _clickListener: (event: CustomEvent<ViewCell>) => void;
    private readonly _dblClickListener: (event: CustomEvent<ViewCell>) => void;

    constructor(
        gridElement: HTMLElement,
        gridSettings: Partial<GridSettings>,
    ) {
        const adapterSet = new RevSimpleServerSet();

        const headerDataServer = adapterSet.headerDataServer;
        const mainDataServer = adapterSet.mainDataServer;

        const adapterSetConfig: Revgrid.Definition = {
            schemaServer: adapterSet.schemaServer,
            subgrids: [
                {
                    role: Subgrid.RoleEnum.header,
                    dataServer: adapterSet.headerDataServer,
                },
                {
                    role: Subgrid.RoleEnum.main,
                    dataServer: adapterSet.mainDataServer,
                }
            ],
        };

        const options: Revgrid.Options = {
            gridSettings,
            loadBuiltinFinbarStylesheet: false,
        };

        super(gridElement, adapterSetConfig, options);

        this._serverSet = adapterSet;

        headerDataServer.cellPainter.setGrid(this);
        mainDataServer.cellPainter.setGrid(this);

        this._selectionChangedListener = (event: CustomEvent<SelectionDetail>) => this.handleHypegridSelectionChanged(event);
        this._clickListener = (event: CustomEvent<ViewCell>) => this.handleGridClickEvent(event);
        this._dblClickListener = (event: CustomEvent<ViewCell>) => this.handleGridDblClickEvent(event);

        this.allowEvents(true);
    }

    get schemaServer(): RevSimpleSchemaServer { return this._serverSet.schemaServer; }
    get headerAdapter(): RevSimpleHeaderDataServer { return this._serverSet.headerDataServer; }

    get fieldCount(): number { return this.schemaServer.getSchema().length; }

    get columnCount(): number { return this.activeColumnCount; }

    get headerRowCount(): number {
        return this.headerAdapter.getRowCount();
    }

    protected descendantProcessFocusChanged() {

    }
    get rowFocusEventer(): SimpleGrid.RowFocusEventer | undefined { return this._rowFocusEventer; }
    set rowFocusEventer(value: SimpleGrid.RowFocusEventer | undefined) {
        if (this._rowFocusEventer !== undefined) {
            this.removeEventListener('rev-selection-changed', this._selectionChangedListener)
        }
        this._rowFocusEventer = value;

        if (this._rowFocusEventer !== undefined) {
            this.addEventListener('rev-selection-changed', this._selectionChangedListener);
        }
    }

    get rowFocusClickEventer(): SimpleGrid.RowFocusClickEventer | undefined { return this._rowFocusClickEventer; }
    set rowFocusClickEventer(value: SimpleGrid.RowFocusClickEventer | undefined) {
        if (this._rowFocusClickEventer !== undefined) {
            this.removeEventListener('rev-click', this._clickListener)
        }
        this._rowFocusClickEventer = value;

        if (this._rowFocusClickEventer !== undefined) {
            this.addEventListener('rev-click', this._clickListener);
        }
    }

    get rowFocusDblClickEventer(): SimpleGrid.RowFocusDblClickEventer | undefined { return this._rowFocusDblClickEventer; }
    set rowFocusDblClickEventer(value: SimpleGrid.RowFocusDblClickEventer | undefined) {
        if (this._rowFocusDblClickEventer !== undefined) {
            this.removeEventListener('rev-double-click', this._dblClickListener)
        }
        this._rowFocusDblClickEventer = value;

        if (this._rowFocusDblClickEventer !== undefined) {
            this.addEventListener('rev-double-click', this._dblClickListener);
        }
    }

    setData(data: RevSimpleServerSet.DataRow[], headerRowCount = -1): void {
        this._serverSet.setData(data, headerRowCount)
    }

    private handleGridClickEvent(event: CustomEvent<ViewCell>): void {
        const gridY = event.detail.gridCell.y;
        if (gridY !== 0) { // Skip clicks to the column headers
            if (this._rowFocusClickEventer !== undefined) {
                const rowIndex = event.detail.dataCell.y;
                if (rowIndex === undefined) {
                    throw new Error('HandleGridClickEvent');
                } else {
                    const columnIndex = event.detail.dataCell.x;
                    this._rowFocusClickEventer(columnIndex, rowIndex);
                }
            }
        }
    }

    private handleGridDblClickEvent(event: CustomEvent<ViewCell>): void {
        if (event.detail.gridCell.y !== 0) { // Skip clicks to the column headers
            if (this._rowFocusClickEventer !== undefined) {
                const rowIndex = event.detail.dataCell.y;
                if (rowIndex === undefined) {
                    throw new Error('handleGridDblClickEvent');
                } else {
                    this._rowFocusClickEventer(event.detail.dataCell.x, rowIndex);
                }
            }
        }
    }

    private handleHypegridSelectionChanged(event: CustomEvent<SelectionDetail>) {
        const rectangles = event.detail.getSelectedRectangles();

        if (rectangles.length === 0) {
            if (this._lastNotifiedFocusedRowIndex !== undefined) {
                const oldSelectedRowIndex = this._lastNotifiedFocusedRowIndex;
                this._lastNotifiedFocusedRowIndex = undefined;
                const rowFocusEventer = this.rowFocusEventer;
                if (rowFocusEventer !== undefined) {
                    rowFocusEventer(undefined, oldSelectedRowIndex);
                }
            }
        } else {
            const rectangle = rectangles[0];
            const rowIndex = rectangle.firstSelectedCell.y;
            if (rowIndex !== this._lastNotifiedFocusedRowIndex) {
                const oldFocusedRowIndex = this._lastNotifiedFocusedRowIndex;
                this._lastNotifiedFocusedRowIndex = rowIndex;
                const rowFocusEventer= this.rowFocusEventer;
                if (rowFocusEventer !== undefined) {
                    rowFocusEventer(rowIndex, oldFocusedRowIndex);
                }
            }
        }
    }
}

export namespace SimpleGrid {
    export type RowFocusEventer = (this: void, newRowIndex: number | undefined, oldRowIndex: number | undefined) => void;
    export type RowFocusClickEventer = (this: void, columnIndex: number, rowIndex: number) => void;
    export type RowFocusDblClickEventer = (this: void, columnIndex: number, rowIndex: number) => void;
}

