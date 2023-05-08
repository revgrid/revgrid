import { CanvasEx } from '../canvas-ex/canvas-ex';

export class Cursor {
    constructor(
        private readonly _canvasEx: CanvasEx,
    ) {
    }

    /**
     * @desc Switch the cursor for a grid instance.
     * @param cursorName - A well know cursor name.
     * {@link http://www.javascripter.net/faq/stylesc.htm|cursor names}
     */
    set(cursorName: string | undefined) {
        this._canvasEx.setCursor(cursorName);
    }
}
