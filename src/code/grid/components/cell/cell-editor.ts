import { RectangleInterface } from '../../lib/rectangle-interface';
import { CellSettingsAccessor } from './cell-settings-accessor';
import { ViewCell } from './view-cell';

/** @public */
export interface CellEditor {
    // Request keys which would normally close editor and possibly exit a cell
    /** If true, editor wants to handle Tab key instead of grid */
    readonly wantTab?: boolean;
    /** If true, editor wants to handle Return key instead of grid */
    readonly wantReturn?: boolean;
    /** If true, editor wants to handle Escape key instead of grid */
    readonly wantEscape?: boolean;
    /** If true, editor wants to handle Left Arrow key instead of grid */
    readonly wantLeftArrow?: boolean;
    /** If true, editor wants to handle Right Arrow key instead of grid */
    readonly wantRightArrow?: boolean;
    /** If true, editor wants to handle Up Arrow key instead of grid */
    readonly wantUpArrow?: boolean;
    /** If true, editor wants to handle Down Arrow key instead of grid */
    readonly wantDownArrow?: boolean;
    /** If true, editor wants to handle Home key instead of grid */
    readonly wantHome?: boolean;
    /** If true, editor wants to handle End key instead of grid */
    readonly wantEnd?: boolean;

    /** If provided, a cell painter will use the CellEditor's painter to paint the editor when the cell contains the editor */
    readonly painter?: CellEditor.Painter;

    // painting and positioning of control
    /** Implement if editor wants to be notified if is removed from view (but still exists). Typically a HTML Input element editor would use this to hide itself */
    hide?(): void;
    /** Implement if editor paints itself (eg a HTML Input element) and only needs positioning */
    setBounds?(bounds: RectangleInterface): void;

    /** Close the editor */
    close(cancel: boolean): void;

    // UI events
    /** Implement if editor wants key down events */
    keyDown?(event: KeyboardEvent): void;
    /** Implement if editor wants key up events */
    keyUp?(event: KeyboardEvent): void;

    /** Implement if editor wants mouse click events */
    click?(event: MouseEvent, cell: ViewCell | undefined): void;
    /** Implement if editor wants mouse double click events */
    dblClick?(event: MouseEvent, cell: ViewCell | undefined): void;
    /** Implement if editor wants mouse down events */
    mouseDown?(event: MouseEvent, cell: ViewCell | undefined): void;
    /** Implement if editor wants mouse up events */
    mouseUp?(event: MouseEvent, cell: ViewCell | undefined): void;
    /** Implement if editor wants wheel move events */
    wheelMove?(event: WheelEvent, cell: ViewCell | undefined): void;

    /** Editor can optionally use this eventer to notify Grid that it has completed */
    closedEventer?: ((this: void) => void) | undefined;
}

/** @public */
export namespace CellEditor {
    /** Is specified when the Cell Painter should also paint the Cell Editor.  Contains the paint function and conditions that specify how the
     * cell painter should paint both the cell and the editor.
     * Note that normally only one of beforeCellBackground, beforeCellBorder, beforeCellContent of afterCell should be set to true.
     */
    export interface Painter {
        /** For cells containing an editor, the cell painter should paint the cell's background */
        readonly paintCellBackground: boolean;
        /** For cells containing an editor, the cell painter should paint the cell's border (if any) */
        readonly paintCellBorder: boolean;
        /** For cells containing an editor, the cell painter should paint the the cell's content (text, figures etc) */
        readonly paintCellContent: boolean;

        /** For cells containing a paintable editor, the cell painter should use the editor paint function before painting the cell background */
        readonly beforeCellBackground: boolean;
        /** For cells containing a paintable editor, the cell painter should use the editor paint function before painting the cell border */
        readonly beforeCellBorder: boolean;
        /** For cells containing a paintable editor, the cell painter should use the editor paint function before painting the cell content */
        readonly beforeCellContent: boolean;
        /** For cells containing a paintable editor, the cell painter should use the editor paint function after fully painting the cell */
        readonly afterCell: boolean;

        /**
         * Implement if Cell Painter should defer painting of editor to the editor itself (normally not defined if editor is (say) a HTML Input element)
         * Return the preferred width if the auto column sizing in the Grid should take into account the editor's width
        */
        paint(cell: ViewCell, cellSettingsAccessor: CellSettingsAccessor): number | undefined;
    }
}
