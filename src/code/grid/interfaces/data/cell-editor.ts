import { Rectangle } from '../../types-utils/rectangle';
import { DatalessViewCell } from '../dataless/dataless-view-cell';
import { SchemaServer } from '../schema/schema-server';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { CellPossiblyPaintable } from './cell-possibly-paintable';
import { DataServer } from './data-server';

/** @public */
export interface CellEditor<
    BCS extends BehavioredColumnSettings,
    SF extends SchemaServer.Field
> extends CellPossiblyPaintable<BCS, SF> {

    // Common properties, methods and events

    /** Indicates if editor can only display data */
    readonly: boolean;

    /** Provide the initial data to the editor. This is done after all events have been subscribed to - so editor can start running */
    tryOpen(viewCell: DatalessViewCell<BCS, SF>, openingKeyDownEvent: KeyboardEvent | undefined, openingClickEvent: MouseEvent | undefined): boolean;
    /** Close the editor - returns data that was in editor or undefined if cancel specified */
    close(field: SF, subgridRowIndex: number, cancel: boolean): void;

    /** Server data value has changed since being provided to editor or pulled by editor */
    invalidateValue?(): void;

    /** See if the editor wants the key down event.  If fromEditor is true, then this editor generated the event in the first place */
    processKeyDownEvent(event: KeyboardEvent, fromEditor: boolean, field: SF, subgridRowIndex: number): boolean;
    /** See if the editor wants the mouse down event.  If fromEditor is true, then this editor generated the event in the first place */
    processClickEvent?(event: MouseEvent, viewCell: DatalessViewCell<BCS, SF>): boolean;
    /** See if the editor wants the mouse down event.  If fromEditor is true, then this editor generated the event in the first place */
    processPointerMoveEvent?(event: PointerEvent, viewCell: DatalessViewCell<BCS, SF>): CellEditor.PointerLocationInfo | undefined;

    /** Get latest data from data server */
    pullValueEventer?: CellEditor.PullDataEventer;
    /** Save data to data server. Optional. If not supplied then editor is read only */
    pushValueEventer?: CellEditor.PushDataEventer;

    /** Editor can optionally use this eventer to notify Grid that it has completed */
    closedEventer?: CellEditor.ClosedEventer;

    // HTML Element methods and events

    /** Implement if editor paints itself (eg a HTML Input element). If bounds is undefined, then editor is hidden */
    setBounds?(bounds: Rectangle | undefined): void;
    /** Implement if editor can be focused. */
    focus?(): void;
    /** Emits key down events generated by editor */
    keyDownEventer?: CellEditor.KeyDownEventer;
}

/** @public */
export namespace CellEditor {
    export type PullDataEventer = (this: void) => DataServer.ViewValue;
    export type PushDataEventer = (this: void, value: DataServer.ViewValue) => void;
    export type ClosedEventer = (this: void, value: DataServer.ViewValue | undefined) => void;
    export type KeyDownEventer = (this: void, event: KeyboardEvent) => void;

    export interface PointerLocationInfo {
        locationCursorName: string | undefined;
        locationTitleText: string | undefined;
    }
}