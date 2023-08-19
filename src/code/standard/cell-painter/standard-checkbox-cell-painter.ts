
import { DataServer, DatalessViewCell, Rectangle, Revgrid, SchemaField } from '../../grid/grid-public-api';
import { StandardCheckboxPainter } from '../painters/standard-painters-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardCellPainter } from './standard-cell-painter';

/** @public */
export class StandardCheckboxCellPainter<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SF extends SchemaField
> extends StandardCellPainter<BGS, BCS, SF> {
    private readonly _checkboxPainter: StandardCheckboxPainter<BGS, BCS, SF>;

    constructor(
        grid: Revgrid<BGS, BCS, SF>,
        dataServer: DataServer<SF>,
        private readonly _editable: boolean,
    ) {
        super(grid, dataServer);
        this._checkboxPainter = new StandardCheckboxPainter<BGS, BCS, SF>(
            this._grid,
            this._dataServer,
            this._editable,
            this._renderingContext,
            (bounds, borderColor, focus) => this.tryPaintBorder(bounds, borderColor, focus)
        );
    }

    override paint(cell: DatalessViewCell<BCS, SF>, prefillColor: string | undefined): number | undefined {
        return this._checkboxPainter.paint(cell, prefillColor, cell.columnSettings);
    }

    calculateClickBox(cell: DatalessViewCell<BCS, SF>): Rectangle | undefined {
        return this._checkboxPainter.calculateClickBox(cell, cell.columnSettings);
    }
}
