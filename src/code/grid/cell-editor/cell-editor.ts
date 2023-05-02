import { CellEvent } from '../cell/cell-event';
import { ViewportCell } from '../cell/viewport-cell';
import { Effect, effectFactory } from '../effects/effects';
import { Formatter } from '../lib/localization';
import { WritablePoint } from '../lib/point';
import { RectangleInterface } from '../lib/rectangle-interface';
import { numberToPixels } from '../lib/utils';
import { Revgrid } from '../revgrid';

export abstract class CellEditor {

    errors: number;

    /**
     * if true, check that the editor is in the right location
     */
    checkEditorPositionFlag = false;
    initialValue: unknown;
    effecting = false;

    locale: string;
    localizer: Formatter;

    /**
     * @constructor
     * @desc Displays a cell editor and handles cell editor interactions.
     *
     * > This constructor (actually `initialize`) will be called upon instantiation of this class or of any class that extends from this class. See {@link https://github.com/joneit/extend-me|extend-me} for more info.
     *
     * Instances of `CellEditor` are used to render an HTML element on top of the grid exactly within the bound of a cell for purposes of editing the cell value.
     *
     * Extend this base class to implement your own cell editor.
     *
     * @param {Revgrid} grid
     * @param {object} options - Properties listed below + arbitrary mustache "variables" for merging into template.
     * @param {string} [options.format] - Name of a localizer with which to override prototype's `localizer` property.
     */
    /**
     * @this CellEditor
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(public readonly grid: Revgrid, public readonly viewportCell: ViewportCell, readonly el: HTMLElement) {
        // Mix in all enumerable properties for mustache use, typically `column` and `format`.
        // for (const key in cellEvent) {
        //     this[key] = cellEvent[key];
        // }

        let value = {}; //this.renderedCell.value;
        if (value instanceof Array) {
            value = value[1]; //it's a nested object
        }

        this.grid.cellEditor = this;

        this.locale = grid.localization.locale; // for template's `lang` attribute

        // Only override cell editor's default 'null' localizer if the custom localizer lookup succeeds.
        // Failure is when it returns the default ('string') localizer when 'string' is not what was requested.
        this.localizer = this.grid.localization.get(viewportCell.format); // try to get named localizer, if unsuccessful, descendants will assign

        this.initialValue = value;

        const container = document.createElement('DIV');
        // modules has been removed
        // was templater: require('mustache') // mustache interface: { render: function(template, context) }
        // was container.innerHTML = this.grid.modules.templater.render(template, this);
        // container.innerHTML = mustache.render(template, this);

        /**
         * This object's input control, one of:
         * * *input element* - an `HTMLElement` that has a `value` attribute, such as `HTMLInputElement`, `HTMLButtonElement`, etc.
         * * *container element* - an `HTMLElement` containing one or more input elements, only one of which contains the editor value.
         *
         * For access to the input control itself (which may or may not be the same as `this.el`), see `this.input`.
         *
         * @default null
         */
        this.el = container.firstChild as HTMLElement;

        this.errors = 0;

        this.el.addEventListener('keyup', (e: KeyboardEvent) => this.keyup(e));
        this.el.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.keyCode === 9) {
                // prevent TAB from leaving input control
                e.preventDefault();
            }
            grid.fireSyntheticEditorKeyDownEvent(this, e);
        });
        this.el.addEventListener('keypress', (e) => {
            grid.fireSyntheticEditorKeyPressEvent(this, e);
        });
        this.el.addEventListener('mousedown', (e: MouseEvent) => {
            this.onmousedown(e);
        });
    }

    // If you override this method, be sure to call it as a final step (or call stopPropagation yourself).
    onmousedown(event: MouseEvent) {
        event.stopPropagation(); // Catch mousedown here before it gets to the document listener defined in Hypergrid().
    }

    specialKeyups: CellEditor.SpecialKeyUps = {
        //0x08: 'clearStopEditing', // backspace
        Tab: this.stopEditing, // tab
        Enter: this.stopEditing, // return/enter
        Escape: this.cancelEditing // escape
    }

    keyup(e: KeyboardEvent) {
        const grid = this.grid;
        const cellProps = this.viewportCell.columnProperties;
        const feedbackCount = cellProps.feedbackCount;
        const stopCancelFtn = this.specialKeyups[e.key as keyof CellEditor.SpecialKeyUps];
        let stopped = (stopCancelFtn) ? stopCancelFtn.call(this, feedbackCount) : false;

        // STEP 1: Call the special key handler as needed
        if (stopped) {
            // grid.repaint();
        }

        // STEP 2: If this is a possible "nav key" consumable by CellSelection#handleKeyDown, try to stop editing and send it along
        if (grid.generateNavKey(e)) {
            if (
                // !specialKeyup &&
                // We didn't try to stop editing above so try to stop it now
                (stopped = this.stopEditing(feedbackCount))
            ) {
                // grid.repaint();
            }

            if (stopped) {
                // Editing successfully stopped
                // -> send the event down the feature chain
                // const eventDetail: EventDetail.Keyboard = {
                //     revgrid_nowTime: Date.now(),
                //     primitiveEvent: e,
                //     editor: this
                // }
                // grid.delegateKeyDown(eventDetail);
            }
        }

        this.grid.fireSyntheticEditorKeyUpEvent(this, e);

        return stopped;
    }

    /**
     * @desc This function is a callback from the fin-hypergrid.   It is called after each paint of the canvas.
     */
    gridRenderedNotification() {
        this.checkEditor();
    }

    /**
     * @desc scroll values have changed, we've been notified
     */
    scrollValueChangedNotification() {
        this.checkEditorPositionFlag = true;
    }

    /**
     * @desc move the editor to the current editor point
     */
    moveEditor() {
        this.setBounds(this.viewportCell.bounds);
    }

    /**
     * @this CellEditor
     */
    beginEditing() {
        if (this.grid.fireRequestCellEdit(this, this.viewportCell, this.initialValue)) {
            this.checkEditorPositionFlag = true;
            this.checkEditor();
        }
    }

    /**
     * @summary Put the value into our editor.
     * @desc Formats the value and displays it.
     * The localizer's {@link localizerInterface#format|format} method will be called.
     *
     * @param value - The raw unformatted value from the data source that we want to edit.
     */
    abstract setEditorValue(value: unknown): void;

    /**
     * @desc display the editor
     */
    showEditor() {
        this.el.style.display = 'inline';
    }

    /**
     * @desc hide the editor
     */
    hideEditor() {
        this.el.style.display = 'none';
    }

    /** @summary Stops editing.
     * @desc Before saving, validates the edited value in two phases as follows:
     * 1. Call `validateEditorValue`. (Calls the localizer's `invalid()` function, if available.)
     * 2. Catch any errors thrown by the {@link CellEditor#getEditorValue|getEditorValue} method.
     *
     * **If the edited value passes both phases of the validation:**
     * Saves the edited value by calling the {@link CellEditor#saveEditorValue|saveEditorValue} method.
     *
     * **On validation failure:**
     * 1. If `feedback` was omitted, cancels editing, discarding the edited value.
     * 2. If `feedback` was provided, gives the user some feedback (see `feedback`, below).
     *
     * @param feedback What to do on validation failure. One of:
     * * **`undefined`** - Do not show the error effect or the end effect. Just discard the value and close the editor (as if `ESC` had been typed).
     * * **`0`** - Just shows the error effect (see the {@link CellEditor#errorEffect|errorEffect} property).
     * * **`1`** - Shows the error feedback effect followed by the detailed explanation.
     * * `2` or more:
     *   1. Shows the error feedback effect
     *   2. On every `feedback` tries, shows the detailed explanation.
     * * If `undefined` (omitted), simply cancels editing without saving edited value.
     * * If 0, shows the error feedback effect (see the {@link CellEditor#errorEffect|errorEffect} property).
     * * If > 0, shows the error feedback effect _and_ calls the {@link CellEditor#errorEffectEnd|errorEffectEnd} method) every `feedback` call(s) to `stopEditing`.
     * @returns Truthy means successful stop. Falsy means syntax error prevented stop. Note that editing is canceled when no feedback requested and successful stop includes (successful) cancel.
     */
    stopEditing(feedback?: number): boolean {
        const { value, errorText } = this.getEditorValueOrError();

        let error = errorText !== undefined;
        if (!error && this.grid.fireSyntheticEditorDataChangeEvent(this, this.initialValue, value)) {
            try {
                this.saveEditorValue(value);
            } catch {
                error = true;
            }
        }

        if (!error) {
            this.hideEditor();
            this.grid.cellEditor = undefined;
            this.el.remove();
        } else {
            if (feedback !== undefined && feedback >= 0) { // false when `feedback` undefined
                this.errorEffectBegin(++this.errors % feedback === 0 && error);
            } else { // invalid but no feedback
                this.cancelEditing();
            }
        }

        return !error;
    }

    /** @summary Cancels editing.
     * @returns {boolean} Successful. (Cancel is always successful.)
     */
    cancelEditing(): boolean {
        this.setEditorValue(this.initialValue);
        this.hideEditor();
        this.grid.cellEditor = undefined;
        this.el.remove();
        this.grid.takeFocus();

        return true;
    }

    /**
     * Calls the effect function indicated in the {@link module:defaults.feedbackEffect|feedbackEffect} property, which triggers a series of CSS transitions.
     * @param {boolean|string|Error} [error] - If defined, call the {@link CellEditor#errorEffectEnd|errorEffectEnd} method at the end of the last effect transition with this error.
     */
    errorEffectBegin(error: boolean | string | Error) {
        if (this.effecting) {
            return;
        }

        let name: string;
        let options: Effect.Options;
        const spec = this.grid.properties.feedbackEffect; // spec may e a string or an object with name and options props
        if (typeof spec === 'string') {
            name = spec;
            options = {};
        } else {
            name = spec.name;
            options = spec.options;
        }
        options.callback = () => this.errorEffectEnd(error, options);

        const effect = effectFactory.create(name, this.el);

        if (effect !== undefined) {
            this.effecting = true;
            effect.start();
        }
    }

    /**
     * This function expects to be passed an error. There is no point in calling this function if there is no error. Nevertheless, if called with a falsy `error`, returns without doing anything.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    errorEffectEnd(error: boolean | string | Error, options: Effect.Options) {
        if (error) {
            let msg =
                'Invalid value. To resolve, do one of the following:\n\n' +
                '   * Correct the error and try again.\n' +
                '         - or -\n' +
                '   * Cancel editing by pressing the "esc" (escape) key.';

            let errorMsg: string;
            switch (typeof error) {
                case 'string':
                    errorMsg = error;
                    break;
                case 'boolean':
                    errorMsg = '';
                    break;
                case 'object':
                    errorMsg = error.message;
                    break;
                default:
                    errorMsg = '';
            }

            if (this.localizer.expectation) {
                errorMsg = errorMsg ? errorMsg + '\n' + this.localizer.expectation : this.localizer.expectation;
            }

            if (errorMsg) {
                if (/[\n\r]/.test(errorMsg)) {
                    errorMsg = '\n' + errorMsg;
                    errorMsg = errorMsg.replace(/[\n\r]+/g, '\n\n   * ');
                }
                msg += '\n\nAdditional information about this error: ' + errorMsg;
            }

            setTimeout(() => { // allow animation to complete
                alert(msg); // eslint-disable-line no-alert
            });
        }
        this.effecting = false;
    }

    /**
     * @desc save the new value into the behavior (model)
     * @returns Data changed and pre-cell-edit event was not canceled.
     */
    saveEditorValue(value: unknown): boolean {
        // const save = (
        //     !(value && value === this.initialValue) && // data changed
        //     this.grid.fireBeforeCellEdit(this.viewportCell.gridPoint, this.initialValue, value, this) // proceed
        // );

        // if (save) {
        //     // this.renderedCell.value = value;
        //     this.grid.fireAfterCellEdit(this.viewportCell.gridPoint, this.initialValue, value, this);
        // }

        return false; // return save
    }

    /**
     * @summary Extract the edited value from the editor.
     * @desc De-format the edited string back into a primitive value.
     *
     * The localizer's {@link localizerInterface#parse|parse} method will be called on the text box contents.
     *
     * Override this method if your editor has additional or alternative GUI elements. The GUI elements will influence the primitive value, either by altering the edited string before it is parsed, or by transforming the parsed value before returning it.
     * @param str - current editors input string
     * @returns the current editor's value
     * @throws Throws an error on parse failure. If the error's `message` is defined, the message will eventually be displayed (every `feedbackCount`th attempt).
     */
    abstract getEditorValue(): unknown;
    abstract getEditorValueOrError(): { value: unknown,  errorText: string | undefined };

    /**
     * If there is no validator on the localizer, returns falsy (not invalid; possibly valid).
     * @param str - current editors input string
     * @returns Truthy value means invalid. If a string, this will be an error message. If not a string, it merely indicates a generic invalid result.
     * @throws {boolean|string|Error} May throw an error on syntax failure as an alternative to returning truthy. Define the error's `message` field as an alternative to returning string.
     */
    // validateEditorValue(str: string): boolean {
    //     const invalidFtn = this.localizer.invalid;
    //     return invalidFtn !== undefined && invalidFtn(str || this.input.value);
    // }

    /**
     * @summary Request focus for my input control.
     * @desc See GRID-95 "Scrollbar moves inward" for issue and work-around explanation.
     */
    takeFocus() {
        const el = this.el;
        const leftWas = el.style.left;
        const topWas = el.style.top;

        el.style.left = el.style.top = '0'; // work-around: move to upper left

        const x = window.scrollX, y = window.scrollY;
        this.el.focus();
        window.scrollTo(x, y);
        this.selectAll();

        el.style.left = leftWas;
        el.style.top = topWas;
    }

    /**
     * @desc select everything
     */
    selectAll() {
        // return nullPattern;
    }

    /**
     * @desc set the bounds of my input control
     * @param rectangle - the bounds to move to
     */
    setBounds(cellBounds: RectangleInterface) {
        const style = this.el.style;

        style.left = numberToPixels(cellBounds.x);
        style.top = numberToPixels(cellBounds.y);
        style.width = numberToPixels(cellBounds.width);
        style.height = numberToPixels(cellBounds.height);
    }

    /**
     * @desc check that the editor is in the correct location, and is showing/hidden appropriately
     */
    checkEditor() {
        if (this.checkEditorPositionFlag) {
            this.checkEditorPositionFlag = false;
            if (this.viewportCell.isCellVisible) {
                this.setEditorValue(this.initialValue);
                this.attachEditor();
                this.moveEditor();
                this.showEditor();
                this.takeFocus();
            } else {
                this.hideEditor();
            }
        }
    }

    attachEditor() {
        this.grid.containerHtmlElement.appendChild(this.el);
    }
}

export namespace CellEditor {
    export type Constructor = new (grid: Revgrid, cellEvent: CellEvent) => CellEditor;

    export interface EventDetail {
        editor: CellEditor;
    }

    export interface KeyEventDetail extends EventDetail {
        keyEvent: KeyboardEvent,
        // char: this.canvas.getKeyChar(keyEvent),
    }

    export interface DataChangeEventDetail extends EventDetail {
        oldValue: unknown,
        newValue: unknown,
        point: WritablePoint | undefined,
    }

    export interface RequestCellEditDetail extends EventDetail {
        value: unknown;
        cellEvent: CellEvent;
    }

    export type StopCancelFunction = (feedback?: number) => boolean
    export interface SpecialKeyUps {
        Tab: StopCancelFunction; // tab
        Enter: StopCancelFunction; // return/enter
        Escape: StopCancelFunction; // escape
    }
}
