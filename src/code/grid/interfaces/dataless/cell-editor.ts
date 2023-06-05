import { Rectangle } from '../../types-utils/rectangle';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { CellPainter } from './cell-painter';
import { DatalessViewCell } from './dataless-view-cell';

/** @public */
export interface CellEditor<BCS extends BehavioredColumnSettings> extends CellPainter {
    /** If true, then CellPaint.paint() function should be used to paint cells - otherwise it can be ignored */
    readonly paintImplemented: boolean;

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

    // painting and positioning of control
    /** Close the editor */
    close(cancel: boolean): void;
    /** Implement if editor wants to be notified if is removed from view (but still exists). Typically a HTML Input element editor would use this to hide itself */
    hide?(): void;
    /** Implement if editor paints itself (eg a HTML Input element) and only needs positioning */
    setBounds?(bounds: Rectangle): void;

    // UI events
    /** Implement if editor wants key down events */
    keyDown?(event: KeyboardEvent): void;
    /** Implement if editor wants key up events */
    keyUp?(event: KeyboardEvent): void;

    /** Implement if editor wants mouse click events */
    click?(event: MouseEvent, cell: DatalessViewCell<BCS> | undefined): void;
    /** Implement if editor wants mouse double click events */
    dblClick?(event: MouseEvent, cell: DatalessViewCell<BCS> | undefined): void;
    /** Implement if editor wants mouse down events */
    mouseDown?(event: MouseEvent, cell: DatalessViewCell<BCS> | undefined): void;
    /** Implement if editor wants mouse up events */
    mouseUp?(event: MouseEvent, cell: DatalessViewCell<BCS> | undefined): void;
    /** Implement if editor wants wheel move events */
    wheelMove?(event: WheelEvent, cell: DatalessViewCell<BCS> | undefined): void;

    /** Editor can optionally use this eventer to notify Grid that it has completed */
    closedEventer?: ((this: void) => void) | undefined;
}
