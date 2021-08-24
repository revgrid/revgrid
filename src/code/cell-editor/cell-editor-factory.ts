import { Hypegrid } from '../grid/hypegrid';
import { Registry } from '../lib/registry';
import { CellEditor } from './cell-editor';
import { Color } from './color';
import { Date } from './date';
import { Number } from './number';
import { Slider } from './slider';
import { Spinner } from './spinner';
import { TextField } from './textfield';

/**
 * @classdesc Registry of cell editor constructors.
 */
export class CellEditorFactory {
    private constructorRegistry = new Registry<CellEditor.Constructor>();

    constructor() {
        // preregister the standard cell editors
        this.constructorRegistry.register(Color.typeName, Color);
        this.constructorRegistry.register(Date.typeName, Date);
        this.constructorRegistry.register(Number.typeName, Number);
        this.constructorRegistry.register(Slider.typeName, Slider);
        this.constructorRegistry.register(Spinner.typeName, Spinner);
        this.constructorRegistry.register(TextField.typeName, TextField);
    }

    tryCreate(grid: Hypegrid, type: string) {
        const constructor = this.constructorRegistry.get(type);
        if (constructor === undefined) {
            return undefined;
        } else {
            return new constructor(grid);
        }
    }

    create(grid: Hypegrid, type: string) {
        const constructor = this.constructorRegistry.get(type);
        return new constructor(grid);
    }
}

export const cellEditorFactory = new CellEditorFactory();
