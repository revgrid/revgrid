import {
    RevHorizontalAlignId,
    RevLinedHoverCell,
    RevMultiHeadingDataRowArraySourcedField,
    RevMultiHeadingDataRowArraySourcedFieldDefinition,
    RevMultiHeadingDataRowArraySourcedFieldGrid,
    RevPoint,
    RevSimpleAlphaTextCellPainter,
    RevSimpleBehavioredColumnSettings,
    RevSimpleBehavioredGridSettings,
    RevStandardHeaderTextCellPainter,
    RevViewCell,
    revSimpleReadonlyDefaultBehavioredColumnSettings,
    revSimpleReadonlyDefaultBehavioredGridSettings
} from '../..';

export class DataRowArrayGrid extends RevMultiHeadingDataRowArraySourcedFieldGrid<
        RevSimpleBehavioredGridSettings,
        RevSimpleBehavioredColumnSettings,
        RevMultiHeadingDataRowArraySourcedField
    > {

    cellFocusEventer: DataRowArrayGrid.CellFocusEventer | undefined;
    clickEventer: DataRowArrayGrid.RowFocusClickEventer | undefined;
    dblClickEventer: DataRowArrayGrid.RowFocusDblClickEventer | undefined;

    private readonly _headerCellPainter: RevStandardHeaderTextCellPainter<
        RevSimpleBehavioredGridSettings,
        RevSimpleBehavioredColumnSettings,
        RevMultiHeadingDataRowArraySourcedField
    >;
    private readonly _textCellPainter: RevSimpleAlphaTextCellPainter<
        RevSimpleBehavioredGridSettings,
        RevSimpleBehavioredColumnSettings,
        RevMultiHeadingDataRowArraySourcedField
    >;

    constructor(
        gridElement: HTMLElement,
        externalParent: unknown,
    ) {
        const gridSettings: RevSimpleBehavioredGridSettings = {
            ...revSimpleReadonlyDefaultBehavioredGridSettings,
            mouseColumnSelectionEnabled: false,
            mouseRowSelectionEnabled: false,
            multipleSelectionAreas: false,
        };

        super(
            gridElement,
            (viewCell) => this.getHeaderCellPainter(viewCell),
            (viewCell) => this.getMainCellPainter(viewCell),
            gridSettings,
            () => revSimpleReadonlyDefaultBehavioredColumnSettings,
            (index: number, key: string, headings: string[]) => this.createField(index, key, headings),
            { externalParent }
        );

        this._headerCellPainter = new RevStandardHeaderTextCellPainter(this, this.headerDataServer);
        this._textCellPainter = new RevSimpleAlphaTextCellPainter(this, this.mainDataServer);
    }

    get columnCount(): number { return this.activeColumnCount; }

    protected override descendantProcessCellFocusChanged(oldPoint: RevPoint | undefined, newPoint: RevPoint | undefined) {
        if (this.cellFocusEventer !== undefined) {
            this.cellFocusEventer(oldPoint, newPoint);
        }
    }

    protected override descendantProcessClick(
        event: MouseEvent,
        hoverCell: RevLinedHoverCell<RevSimpleBehavioredColumnSettings, RevMultiHeadingDataRowArraySourcedField> | null | undefined
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
        hoverCell: RevLinedHoverCell<RevSimpleBehavioredColumnSettings, RevMultiHeadingDataRowArraySourcedField> | null | undefined
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

    // setData(data: MultiHeadingDataRowArrayServerSet.DataRow[], headerRowCount = -1): void {
    //     this._serverSet.setData(data, headerRowCount)
    // }

    private createField(index: number, key: string, headings: string[]) {
        const definition = RevMultiHeadingDataRowArraySourcedFieldDefinition.create(
            { name: '' },
            key,
            headings,
            undefined,
            RevHorizontalAlignId.Left,
        );

        return new RevMultiHeadingDataRowArraySourcedField(definition);
    }

    private getHeaderCellPainter(_viewCell: RevViewCell<RevSimpleBehavioredColumnSettings, RevMultiHeadingDataRowArraySourcedField>) {
        return this._headerCellPainter;
    }

    private getMainCellPainter(_viewCell: RevViewCell<RevSimpleBehavioredColumnSettings, RevMultiHeadingDataRowArraySourcedField>) {
        return this._textCellPainter;
    }
}

export namespace DataRowArrayGrid {
    export type CellFocusEventer = (this: void, newPoint: RevPoint | undefined, oldPoint: RevPoint | undefined) => void;
    export type RowFocusClickEventer = (this: void, columnIndex: number, rowIndex: number) => void;
    export type RowFocusDblClickEventer = (this: void, columnIndex: number, rowIndex: number) => void;
}

