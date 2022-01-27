import {
    CellEvent,
    GridProperties,
    Revgrid,
    RevSimpleAdapterSet,
    RevSimpleHeaderAdapter,
    RevSimpleMainAdapter,
    RevSimpleSchemaAdapter,
    SelectionDetail,
    Subgrid
} from "..";

export class SimpleGrid extends Revgrid {
    private _lastNotifiedFocusedRowIndex: number | undefined;

    private _rowFocusEventer: SimpleGrid.RowFocusEventer | undefined;
    private _rowFocusClickEventer: SimpleGrid.RowFocusClickEventer | undefined;
    private _rowFocusDblClickEventer: SimpleGrid.RowFocusDblClickEventer | undefined;

    private readonly _adapterSet: RevSimpleAdapterSet;

    private readonly _selectionChangedListener: (event: CustomEvent<SelectionDetail>) => void;
    private readonly _clickListener: (event: CustomEvent<CellEvent>) => void;
    private readonly _dblClickListener: (event: CustomEvent<CellEvent>) => void;

    constructor(
        gridElement: HTMLElement,
        gridProperties: Partial<GridProperties>,
    ) {
        const adapterSet = new RevSimpleAdapterSet();

        const options: Revgrid.Options = {
            adapterSet: {
                schemaModel: adapterSet.schemaAdapter,
                subgrids: [
                    {
                        role: Subgrid.RoleEnum.header,
                        dataModel: adapterSet.headerAdapter,
                    },
                    {
                        role: Subgrid.RoleEnum.main,
                        dataModel: adapterSet.mainAdapter,
                    }
                ],
            },
            gridProperties,
            loadBuiltinFinbarStylesheet: false,
        };

        super(gridElement, options);

        this._adapterSet = adapterSet;

        this._selectionChangedListener = (event: CustomEvent<SelectionDetail>) => this.handleHypegridSelectionChanged(event);
        this._clickListener = (event: CustomEvent<CellEvent>) => this.handleGridClickEvent(event);
        this._dblClickListener = (event: CustomEvent<CellEvent>) => this.handleGridDblClickEvent(event);

        this.allowEvents(true);
    }

    get schemaAdapter(): RevSimpleSchemaAdapter { return this._adapterSet.schemaAdapter; }
    get mainAdapter(): RevSimpleMainAdapter { return this._adapterSet.mainAdapter; }
    get headerAdapter(): RevSimpleHeaderAdapter { return this._adapterSet.headerAdapter; }

    get fieldCount(): number { return this.schemaAdapter.getSchema().length; }

    get columnCount(): number { return this.getActiveColumnCount(); }

    get focusedRowIndex(): number | undefined {
        const selections = this.selections;

        if (selections === null || selections.length === 0) {
            return undefined;
        } else {
            const rowIndex = selections[0].firstSelectedCell.y;

            if (rowIndex >= this.mainAdapter.getRowCount()) {
                return undefined;
            } else {
                return rowIndex
            }
        }
    }

    set focusedRowIndex(rowIndex: number | undefined) {
        if (rowIndex === undefined) {
            this.clearSelections();
        } else {
            if (rowIndex === undefined) {
                this.clearSelections();
            } else {
                this.selectRows(rowIndex, rowIndex);
            }
        }
    }

    get headerRowCount(): number {
        return this.headerAdapter.getRowCount();
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

    setData(data: RevSimpleAdapterSet.DataRow[], headerRowCount = -1): void {
        this._adapterSet.setData(data, headerRowCount)
    }

    private handleGridClickEvent(event: CustomEvent<CellEvent>): void {
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

    private handleGridDblClickEvent(event: CustomEvent<CellEvent>): void {
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
        const selections = event.detail.selections;

        if (selections.length === 0) {
            if (this._lastNotifiedFocusedRowIndex !== undefined) {
                const oldSelectedRowIndex = this._lastNotifiedFocusedRowIndex;
                this._lastNotifiedFocusedRowIndex = undefined;
                const rowFocusEventer = this.rowFocusEventer;
                if (rowFocusEventer !== undefined) {
                    rowFocusEventer(undefined, oldSelectedRowIndex);
                }
            }
        } else {
            const selection = selections[0];
            const rowIndex = selection.firstSelectedCell.y;
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

