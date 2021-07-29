
import { CellEditor } from './cell-editor';

export class Combo extends CellEditor {

    /**
     * the list of items to pick from
     * @type {Array}
     * @memberOf Combo.prototype
     */
    items: [];

    /**
     * @memberOf Combo.prototype
     * @desc request focus for my input control
     */
    override takeFocus() {
        setTimeout(() => {
            //this.input.focus();
            this.selectAll();
        }, 300);
    }

    /**
     * @memberOf Combo.prototype
     */
    override selectAll() {
        const lastCharPlusOne = this.getEditorValue().length;
        this.input.setSelectionRange(0, lastCharPlusOne);
    }

}
