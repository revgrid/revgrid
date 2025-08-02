import { numberToPixels } from '@pbkware/js-utils';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevClientGrid, RevViewCell } from '../../client';
import { RevDataServer, RevRectangle, RevSchemaField } from '../../common';
import { RevStandardCellEditor } from './standard-cell-editor';

/** @public */
export abstract class RevStandardElementCellEditor<
    BGS extends RevBehavioredGridSettings,
    BCS extends RevBehavioredColumnSettings,
    SF extends RevSchemaField
> extends RevStandardCellEditor<BGS, BCS, SF> {
    protected readonly _element: HTMLElement;

    constructor(grid: RevClientGrid<BGS, BCS, SF>, dataServer: RevDataServer<SF>, element: HTMLElement) {
        super(grid, dataServer);
        this._element = element;
        element.style.position = 'absolute';
        element.style.visibility = 'hidden';
    }

    override tryOpenCell(_viewCell: RevViewCell<BCS, SF>, _openingKeyDownEvent: KeyboardEvent | undefined, _openingClickEvent: MouseEvent | undefined) {
        this._grid.canvas.hostElement.appendChild(this._element);
        return true;
    }

    override closeCell(_schemaColumn: SF, _dataServerRowIndex: number, _cancel: boolean) {
        this._grid.canvas.hostElement.removeChild(this._element);
    }

    focus() {
        this._element.focus({ preventScroll: true });
    }

    setBounds(bounds: RevRectangle | undefined) {
        if (bounds === undefined) {
            this._element.style.visibility = 'hidden';
        } else {
            this._element.style.left = numberToPixels(bounds.x);
            this._element.style.top = numberToPixels(bounds.y);
            this._element.style.width = numberToPixels(bounds.width);
            this._element.style.height = numberToPixels(bounds.height);
            this._element.style.visibility = 'visible';
        }
    }
}
