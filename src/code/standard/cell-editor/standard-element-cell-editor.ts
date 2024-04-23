import { numberToPixels } from '@xilytix/sysutils';
import { BehavioredColumnSettings, BehavioredGridSettings, DataServer, DatalessViewCell, Rectangle, Revgrid, SchemaField } from '../../client/internal-api';
import { StandardCellEditor } from './standard-cell-editor';

/** @public */
export abstract class StandardElementCellEditor<
    BGS extends BehavioredGridSettings,
    BCS extends BehavioredColumnSettings,
    SF extends SchemaField
> extends StandardCellEditor<BGS, BCS, SF> {
    protected readonly element: HTMLElement;

    constructor(grid: Revgrid<BGS, BCS, SF>, dataServer: DataServer<SF>, element: HTMLElement) {
        super(grid, dataServer);
        this.element = element;
        element.style.position = 'absolute';
        element.style.visibility = 'hidden';
    }

    override tryOpenCell(_viewCell: DatalessViewCell<BCS, SF>, _openingKeyDownEvent: KeyboardEvent | undefined, _openingClickEvent: MouseEvent | undefined) {
        this._grid.canvas.hostElement.appendChild(this.element);
        return true;
    }

    override closeCell(_schemaColumn: SF, _subgridRowIndex: number, _cancel: boolean) {
        this._grid.canvas.hostElement.removeChild(this.element);
    }

    focus() {
        this.element.focus({ preventScroll: true });
    }

    setBounds(bounds: Rectangle | undefined) {
        if (bounds === undefined) {
            this.element.style.visibility = 'hidden';
        } else {
            this.element.style.left = numberToPixels(bounds.x);
            this.element.style.top = numberToPixels(bounds.y);
            this.element.style.width = numberToPixels(bounds.width);
            this.element.style.height = numberToPixels(bounds.height);
            this.element.style.visibility = 'visible';
        }
    }
}
