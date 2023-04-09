import { ColumnInterface } from '../common/column-interface';
import { EventDetail } from '../event/event-detail';
import { EventName } from '../event/event-name';
import { newEvent } from '../event/event-util';
import { ListChangedTypeId } from '../lib/types';
import { Selection } from '../selection/selection';
import { SelectionDetailAccessor } from '../selection/selection-detail';

export class EventBehavior {
    private _dispatchEnabled = false;
    private _destroyed = false;

    constructor(
        private readonly _selection: Selection,
        private readonly _descendantEventer: EventBehavior.DescendantEventer,
        private readonly _dispatchEventEventer: EventBehavior.DispatchEventEventer,
    ) {

    }

    destroy() {
        this._destroyed = true;
    }

    processAllColumnListChangedEvent(typeId: ListChangedTypeId, index: number, count: number, targetIndex: number | undefined) {
        this._descendantEventer.allColumnListChanged(typeId, index, count, targetIndex);
        if (this._dispatchEnabled) {
            this.dispatchGridEvent('rev-columns-created', false, undefined);
        }
    }

    processActiveColumnListChangedEvent(typeId: ListChangedTypeId, index: number, count: number, targetIndex: number | undefined, ui: boolean) {
        this._descendantEventer.activeColumnListChanged(typeId, index, count, targetIndex, ui);
    }

    processColumnsWidthChangedEvent(columns: ColumnInterface[], ui: boolean) {
        this._descendantEventer.columnsWidthChanged(columns, ui);
    }

    /**
     * @desc Synthesize and fire a `fin-column-selection-changed` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    processSelectionChangedEvent() {
        this._descendantEventer.selectionChanged();

        if (this._dispatchEnabled) {
            const selectionDetail = new SelectionDetailAccessor(this._selection);
            this.dispatchGridEvent('rev-selection-changed', false, selectionDetail);
        }
    }

    processScrollEvent(isX: boolean, newValue: number, index: number, offset: number) {
        this._descendantEventer.scroll(isX, newValue, index, offset);

        if (this._dispatchEnabled) {
            const eventName = isX ? 'rev-scroll-x' : 'rev-scroll-y';
            const eventDetail: EventDetail.Scroll = {
                time: Date.now(),
                value: newValue,
                index,
                offset,
            };
            this.dispatchGridEvent(eventName, false, eventDetail);
        }
    }

    private dispatchGridEvent<T extends EventName>(
        eventName: T,
        cancelable: boolean,
        eventDetail: EventName.DetailMap[T] | undefined,
    ): boolean {
        if (this._destroyed) {
            return false;
        } else {

            // let eventInitDictOrDetail: DispatchGridEvent.EventInitDictOrDetail;
            // if (eventDetail === undefined) {
            //     eventInitDictOrDetail = {};
            // } else {
            //     if (eventDetail instanceof CustomEvent) {
            //         eventInitDictOrDetail = Object({});
            //         throw new Error('dispatchGridEvent should not be passed CustomEvents anymore [1]');
            //     } else {
            //         eventInitDictOrDetail = eventDetail;
            //     }
            // }

            // if (!("type" in eventInitDictOrDetail)) {
            //     (eventInitDictOrDetail as DispatchGridEvent.ExtraDetail).type = eventName;
            // }

            // let eventInitDict: CustomEventInit<DispatchGridEvent.ExtraDetail>;

            // if (!("detail" in eventInitDictOrDetail)) {
            //     eventInitDict = {
            //         detail: eventInitDictOrDetail as DispatchGridEvent.ExtraDetail,
            //     };
            // } else {
            //     eventInitDict = eventInitDictOrDetail as CustomEventInit<DispatchGridEvent.ExtraDetail>;
            //     throw new Error('dispatchGridEvent should not be passed CustomEvents anymore [2]');
            // }

            // const detail = eventInitDict.detail;

            // if (!detail.grid) {
            //     // CellEvent objects already have a (read-only) `grid` prop
            //     detail.grid = grid;
            // }

            // detail.time = Date.now();

            // if (primitiveEvent !== undefined) {
            //     if (!detail.primitiveEvent) {
            //         detail.primitiveEvent = primitiveEvent;
            //     }
            //     wantedDetailFields.forEach((key) => {
            //         if (key in primitiveEvent && !(key in detail)) {
            //             detail[key] = primitiveEvent[key] as unknown;
            //         }
            //     });
            //     if ("dataRow" in primitiveEvent) {
            //         // reference (without invoking) cellEvent's `dataRow` getter when available
            //         Object.defineProperty(detail, "row", {
            //             get: function () {
            //                 return primitiveEvent.dataRow;
            //             },
            //         });
            //     }
            // }

            // eventInitDict.cancelable = cancelable;

            const event = newEvent(eventName, eventDetail, cancelable);
            return this._dispatchEventEventer(event);
        }
    }
}

export namespace EventBehavior {
    export type DispatchEventEventer = (this: void, event: Event) => boolean;

    export interface DescendantEventer {
        readonly allColumnListChanged: (this: void, typeId: ListChangedTypeId, index: number, count: number, targetIndex: number | undefined) => void;
        readonly activeColumnListChanged: (this: void, typeId: ListChangedTypeId, index: number, count: number, targetIndex: number | undefined, ui: boolean) => void;
        readonly columnsWidthChanged: (this: void, columns: ColumnInterface[], ui: boolean) => void;
        readonly selectionChanged: (this: void) => void;
        readonly scroll: (this:void, isX: boolean, newValue: number, index: number, offset: number) => void;
    }

    // Extra properties added to Event Detail
    // export interface ExtraDetail {
    //     type: string;
    //     grid: Hypegrid;
    //     time: number;
    //     primitiveEvent: CellEvent | MouseEvent | KeyboardEvent | Point;

    //     gridCell: WritablePoint,
    //     dataCell: WritablePoint,
    //     mousePoint: Point,
    //     gridPoint: Point,
    //     clientPoint: Point,
    //     pagePoint: Point,
    //     keys: string[],
    //     row: unknown,
    // }

    // export type UntypedEventInitDictOrDetail =
    //     | CustomEventInit
    //     | EventDetail.Resize
    //     | EventDetail.Keyboard
    //     | EventDetail.Touch
    //     | CellEditor.EventDetail
    //     | EventDetail.ColumnSortDetail
    //     | SelectionDetail
    //     | EventDetail.GridDetail
    //     | EventDetail.ScrollDetail
    //     | EventDetail.RowDataInvalidatedDetail
    //     | EventDetail.CellDataInvalidatedDetail
    //     | CellEvent;

    // export type EventInitDictOrDetail = UntypedEventInitDictOrDetail | ExtraDetail;
}
