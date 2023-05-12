import { AssertError } from '../../lib/revgrid-error';
import { ViewCell } from '../cell/view-cell';
import { ViewLayout } from '../view/view-layout';
import { RenderAction, RepaintViewAction } from './render-action';

export class RenderActionQueue {
    actionsQueuedEventer: RenderActioner.ActionsQueuedEventer;

    private _queuedActions: RenderAction[] = [];
    private _firstActionQueued = false;
    private _beginChangeCount = 0;

    beginChange() {
        this._beginChangeCount++;
    }

    endChange() {
        this._beginChangeCount--;
        if (this._beginChangeCount === 0) {
            if (this._firstActionQueued) {
                this.actionsQueuedEventer();
            } else {
                if (this._beginChangeCount < 0) {
                    throw new AssertError('RAEC91004', 'Mismatched RenderActioner begin/endChange callback');
                }
            }
        }
    }

    takeActions() {
        const actions = this._queuedActions;
        this._queuedActions = [];
        this._firstActionQueued = false;
        return actions;
    }

    processViewLayoutInvalidateAction(_invalidateAction: ViewLayout.InvalidateAction) {
        this.beginChange();
        try {
        // currently only support PaintAll
            this.queuePaintAllAction();
        } finally {
            this.endChange();
        }
    }

    invalidateAllData() {
        this.beginChange();
        try {
            this.queuePaintAllAction();
        } finally {
            this.endChange();
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    invalidateDataRows(_rowIndex: number, _count: number) {
        this.beginChange();
        try {
            this.queuePaintAllAction();
        } finally {
            this.endChange();
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    invalidateDataRow(_rowIndex: number) {
        this.beginChange();
        try {
            this.queuePaintAllAction();
        } finally {
            this.endChange();
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    invalidateDataRowCells(_rowIndex: number, _columnIndexes: number[]) {
        this.beginChange();
        try {
            this.queuePaintAllAction();
        } finally {
            this.endChange();
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    invalidateDataCell(_columnIndex: number, _rowIndex: number) {
        this.beginChange();
        try {
            this.queuePaintAllAction();
        } finally {
            this.endChange();
        }
    }

    invalidateView() {
        this.beginChange();
        try {
            this.queuePaintAllAction();
        } finally {
            this.endChange();
        }
    }

    invalidateViewCell(_cell: ViewCell) {
        this.beginChange();
        try {
            this.queuePaintAllAction();
        } finally {
            this.endChange();
        }
    }

    private queuePaintAllAction() {
        if (this._queuedActions.length === 0) {
            // currently only support paint all
            const action: RepaintViewAction = {
                type: RenderAction.Type.PaintAll,
            };
            this._queuedActions.push(action);
            this._firstActionQueued = true;
        }
    }
}

export namespace RenderActioner {
    export type ActionsQueuedEventer = (this: void) => void;
}
