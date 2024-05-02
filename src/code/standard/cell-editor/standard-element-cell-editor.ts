import { numberToPixels } from '@xilytix/sysutils';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevClientGrid, RevViewCell } from '../../client/internal-api';
import { RevDataServer, RevRectangle, RevSchemaField } from '../../common/internal-api';
import { RevStandardCellEditor } from './standard-cell-editor';

/** @public */
export abstract class RevStandardElementCellEditor<
    BGS extends RevBehavioredGridSettings,
    BCS extends RevBehavioredColumnSettings,
    SF extends RevSchemaField
> extends RevStandardCellEditor<BGS, BCS, SF> {
    protected readonly element: HTMLElement;

    constructor(grid: RevClientGrid<BGS, BCS, SF>, dataServer: RevDataServer<SF>, element: HTMLElement) {
        super(grid, dataServer);
        this.element = element;
        element.style.position = 'absolute';
        element.style.visibility = 'hidden';
    }

    override tryOpenCell(_viewCell: RevViewCell<BCS, SF>, _openingKeyDownEvent: KeyboardEvent | undefined, _openingClickEvent: MouseEvent | undefined) {
        this._grid.canvas.hostElement.appendChild(this.element);
        return true;
    }

    override closeCell(_schemaColumn: SF, _subgridRowIndex: number, _cancel: boolean) {
        this._grid.canvas.hostElement.removeChild(this.element);
    }

    focus() {
        this.element.focus({ preventScroll: true });
    }

    setBounds(bounds: RevRectangle | undefined) {
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
