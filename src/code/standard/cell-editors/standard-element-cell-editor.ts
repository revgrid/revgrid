import { DataServer, DatalessViewCell, Rectangle, Revgrid, SchemaField } from '../../grid/grid-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardCellEditor } from './standard-cell-editor';

/** @public */
export abstract class StandardElementCellEditor<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SF extends SchemaField
> extends StandardCellEditor<BGS, BCS, SF> {
    protected readonly element: HTMLElement;

    constructor(grid: Revgrid<BGS, BCS, SF>, dataServer: DataServer<SF>, element: HTMLElement) {
        super(grid, dataServer);
        this.element = element;
        element.style.position = 'absolute';
    }

    override tryOpenCell(_viewCell: DatalessViewCell<BCS, SF>, _openingKeyDownEvent: KeyboardEvent | undefined, _openingClickEvent: MouseEvent | undefined) {
        this._grid.canvas.hostElement.appendChild(this.element);
        this.element.focus();
        return true;
    }

    override closeCell(_schemaColumn: SF, _subgridRowIndex: number, _cancel: boolean) {
        this.element.blur(); // make sure it does not have focus
        this._grid.canvas.hostElement.removeChild(this.element);
    }

    focus() {
        this.element.focus({ preventScroll: true });
    }

    setBounds(bounds: Rectangle | undefined) {
        if (bounds === undefined) {
            this.element.style.visibility = 'hidden';
        } else {
            this.element.style.left = bounds.x + 'px';
            this.element.style.top = bounds.y + 'px';
            this.element.style.width = bounds.width + 'px';
            this.element.style.height = bounds.height + 'px';
            this.element.style.visibility = 'visible';
        }
    }
}
