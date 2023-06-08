import { DataServer, Rectangle, Revgrid, SchemaServer } from '../../grid/grid-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardCellEditor } from './standard-cell-editor';

export abstract class StandardElementCellEditor<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SC extends SchemaServer.Column<BCS>
> extends StandardCellEditor<BGS, BCS, SC> {
    protected readonly element: HTMLElement;

    constructor(grid: Revgrid<BGS, BCS, SC>, readonly: boolean, element: HTMLElement) {
        super(grid, readonly);
        this.element = element;
        element.style.position = 'absolute';
    }

    override open(_value: DataServer.ViewValue, _valueIsNew: boolean) {
        this._grid.canvasManager.containerElement.appendChild(this.element);
        this.element.focus();
    }

    override close(_cancel: boolean) {
        this.element.blur(); // make sure it does not have focus
        this._grid.canvasManager.containerElement.removeChild(this.element);
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
