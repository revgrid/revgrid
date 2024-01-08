import { Selection } from '../../components/selection/selection';
import { Subgrid } from '../../interfaces/data/subgrid';
import { ViewCell } from '../../interfaces/data/view-cell';
import { SchemaField } from '../../interfaces/schema/schema-field';
import { ServerNotificationId, invalidServerNotificationId, lowestValidServerNotificationId } from '../../interfaces/schema/schema-server';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { AssertError, UnreachableCaseError } from '../../types-utils/revgrid-error';
import { RevgridObject } from '../../types-utils/revgrid-object';
import { Canvas } from '../canvas/canvas';
import { ColumnsManager } from '../column/columns-manager';
import { Focus } from '../focus/focus';
import { Mouse } from '../mouse/mouse';
import { SubgridsManager } from '../subgrid/subgrids-manager';
import { ViewLayout } from '../view/view-layout';
import { Animation } from './animation';
import { Animator } from './animator';
import { ByColumnsAndRowsGridPainter } from './grid-painter/by-columns-and-rows-grid-painter';
import { GridPainter } from './grid-painter/grid-painter';
import { GridPainterRepository } from './grid-painter/grid-painter-repository';
import { RenderAction } from './render-action';
import { RenderActionQueue } from './render-action-queue';

/** @public */
export class Renderer<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> implements RevgridObject {
    /** @internal */
    renderedEventer: Renderer.RenderedEventer;

    /** @internal */
    private readonly _gridPainterRepository: GridPainterRepository<BGS, BCS, SF>;
    /** @internal */
    private readonly _renderActionQueue: RenderActionQueue;
    /** @internal */
    private readonly _gridSettingsChangedListener = () => { this.handleGridSettingsChanged(); };

    /** @internal */
    private _documentHidden = false;

    /** @internal */
    private _lastServerNotificationId: ServerNotificationId = lowestValidServerNotificationId;
    /** @internal */
    private _lastRenderedServerNotificationId: ServerNotificationId = lowestValidServerNotificationId;
    /** @internal */
    private _waitLastServerNotificationRenderedResolves = new Array<Renderer.WaitModelRenderedResolve>();

    /** @internal */
    private _animator: Animator | undefined;
    /** @internal */
    private _gridPainter: GridPainter<BGS, BCS, SF>;
    /** @internal */
    private _allGridPainter: GridPainter<BGS, BCS, SF> | undefined;

    /** @internal */
    private _pageVisibilityChangeListener = () => { this.handlePageVisibilityChange(); };

    /** @internal */
    constructor(
        readonly revgridId: string,
        readonly internalParent: RevgridObject,
        /** @internal */
        private readonly _gridSettings: BGS,
        /** @internal */
        private readonly _canvas: Canvas<BGS>,
        /** @internal */
        private readonly _columnsManager: ColumnsManager<BCS, SF>,
        /** @internal */
        private readonly _subgridsManager: SubgridsManager<BCS, SF>,
        /** @internal */
        private readonly _viewLayout: ViewLayout<BGS, BCS, SF>,
        /** @internal */
        private readonly _focus: Focus<BGS, BCS, SF>,
        /** @internal */
        private readonly _selection: Selection<BGS, BCS, SF>,
        /** @internal */
        private readonly _mouse: Mouse<BGS, BCS, SF>,
    ) {
        this._gridPainterRepository = new GridPainterRepository(
            this._gridSettings,
            this._canvas,
            this._subgridsManager,
            this._viewLayout,
            this._focus,
            this._selection,
            this._mouse,
            () => { this.repaintAll(); },
        );

        this._renderActionQueue = new RenderActionQueue(() => { this.flagAnimateRequired(); });

        this._gridSettings.subscribeChangedEvent(this._gridSettingsChangedListener);
        this._gridSettings.viewRenderInvalidatedEventer = () => {
            this._viewLayout.resetAllCellPaintFingerprints();
            this.invalidateView();
        }
        this._viewLayout.layoutInvalidatedEventer = (action) => { this._renderActionQueue.processViewLayoutInvalidateAction(action); };
        this._focus.viewCellRenderInvalidatedEventer = (cell) => { this.invalidateViewCell(cell); }
        this._selection.changedEventerForRenderer = () => { this.invalidateView(); };
        this._mouse.viewCellRenderInvalidatedEventer = (cell) => { this.invalidateViewCell(cell); };

        document.addEventListener('visibilitychange', this._pageVisibilityChangeListener);
        this.setGridPainter('by-columns-and-rows');
    }

    get painting() {
        const animator = this._animator;
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        return animator !== undefined && animator.animating;
    }
    get lastServerNotificationId() { return this._lastServerNotificationId; }

    /** Promise resolves after paint renders the last server notification (change) for the first time. Columns and rows will then reflect server data and schema */
    waitLastServerNotificationRendered(): Promise<ServerNotificationId> {
        const lastRenderedServerNotificationId = this._lastRenderedServerNotificationId;
        if (lastRenderedServerNotificationId === this._lastServerNotificationId) {
            return Promise.resolve(lastRenderedServerNotificationId); // latest model already rendered
        } else {
            return new Promise<ServerNotificationId>((resolve) => { this._waitLastServerNotificationRenderedResolves.push(resolve); });
        }
    }

    animateImmediatelyIfRequired() {
        if (this._animator !== undefined) {
            this._animator.makeRequiredAnimateImmediate(); // this will process any queued actions immediately
        }
    }

    /** @internal */
    destroy() {
        this.stop(); // in case revgrid was not deactivated by application

        this.resolveWaitLastServerNotificationRendered(invalidServerNotificationId);

        document.removeEventListener('visibilitychange', this._pageVisibilityChangeListener);
        this._gridSettings.unsubscribeChangedEvent(this._gridSettingsChangedListener);
    }

    /** @internal */
    registerGridPainter(key: string, constructor: GridPainter.Constructor<BGS, BCS, SF>) {
        this._gridPainterRepository.register(key, constructor);
    }

    /** @internal */
    getGridPainter(key: string) {
        return this._gridPainterRepository.get(key);
    }

    /** @internal */
    setGridPainter(key: string) {
        const gridPainter = this._gridPainterRepository.get(key);

        if (gridPainter !== this._gridPainter) {
            this._gridPainter = gridPainter;
        }
    }

    /** @internal */
    repaintAll() {
        if (this._allGridPainter === undefined) {
            this._allGridPainter = this.getGridPainter(ByColumnsAndRowsGridPainter.key);

        }
        this._allGridPainter.paintCells();
    }

    /**
     * Certain renderers that pre-bundle column rects based on columns' background colors need to re-bundle when columns' background colors change. This method sets the `rebundle` property to `true` for those renderers that have that property.
     * @internal
    */
    flagColumnRebundlingRequired() {
        const all = this._gridPainterRepository.allCreated();
        for (const value of all) {
            value.flagColumnRebundlingRequired();
        }
    }

    /** @internal */
    start() {
        if (this._animator !== undefined) {
            throw new AssertError('RSA69107');
        } else {
            this._animator = Animation.animation.createAnimator(
                this._gridSettings.minimumAnimateTimeInterval,
                this._gridSettings.backgroundAnimateTimeInterval,
                () => { this.processRenderActionQueue(); },
            );

            if (this._renderActionQueue.actionsQueued) {
                this._animator.flagAnimateRequired();
            }
        }
    }

    /** @internal */
    stop() {
        if (this._animator !== undefined) {
            Animation.animation.destroyAnimator(this._animator);
            this._animator = undefined;
        }
    }

    /** @internal */
    serverNotified() {
        ++this._lastServerNotificationId;
    }

    /** @internal */
    beginChange() {
        this._renderActionQueue.beginChange();
    }

    /** @internal */
    endChange() {
        this._renderActionQueue.endChange();
    }

    /** @internal */
    invalidateView() {
        if (this._canvas.hasBounds) {
            this._renderActionQueue.invalidateView();
        }
    }

    /** @internal */
    invalidateViewCell(cell: ViewCell<BCS, SF>) {
        if (this._canvas.hasBounds) {
            this._renderActionQueue.invalidateViewCell(cell.viewLayoutColumn.index, cell.viewLayoutRow.index);
        }
    }

    /** @internal */
    invalidateSubgrid(subgrid: Subgrid<BCS, SF>) {
        if (this._canvas.hasBounds) {
            const viewRowCount = subgrid.viewRowCount;
            if (viewRowCount > 0) {
                this._renderActionQueue.invalidateViewRows(subgrid.firstViewRowIndex, subgrid.viewRowCount);
            }
        }
    }

    /** @internal */
    invalidateSubgridRows(subgrid: Subgrid<BCS, SF>, subgridRowIndex: number, count: number) {
        if (this._canvas.hasBounds) {
            const subgridViewRowCount = subgrid.viewRowCount;
            if (subgridViewRowCount > 0) {
                const subgridViewRowIndex = subgridRowIndex - subgrid.firstViewableSubgridRowIndex;
                if ((subgridViewRowIndex + count) >= 0 && subgridViewRowIndex < subgridViewRowCount) {
                    const subgridFirstViewRowIndex = subgrid.firstViewRowIndex;
                    const invalidateViewRowIndex = subgridViewRowIndex < 0 ? subgridFirstViewRowIndex : subgridFirstViewRowIndex + subgridViewRowIndex;
                    const subgridAfterViewRowIndex = subgridFirstViewRowIndex + subgridViewRowCount;
                    let invalidateCount: number;
                    if (invalidateViewRowIndex + count > subgridAfterViewRowIndex) {
                        invalidateCount = subgridAfterViewRowIndex - invalidateViewRowIndex;
                    } else {
                        invalidateCount = count;
                    }
                    this._renderActionQueue.invalidateViewRows(invalidateViewRowIndex, invalidateCount);
                }
            }
        }
    }

    /** @internal */
    invalidateSubgridRow(subgrid: Subgrid<BCS, SF>, subgridRowIndex: number) {
        if (this._canvas.hasBounds) {
            const subgridViewRowCount = subgrid.viewRowCount;
            if (subgridViewRowCount > 0) {
                const subgridViewRowIndex = subgridRowIndex - subgrid.firstViewableSubgridRowIndex;
                if (subgridViewRowIndex >= 0 && subgridViewRowIndex < subgridViewRowCount) {
                    this._renderActionQueue.invalidateViewRow(subgrid.firstViewRowIndex + subgridViewRowIndex);
                }
            }
        }
    }

    /** @internal */
    invalidateSubgridRowCells(subgrid: Subgrid<BCS, SF>, subgridRowIndex: number, activeColumnIndices: number[]) {
        if (this._canvas.hasBounds) {
            const subgridViewRowCount = subgrid.viewRowCount;
            if (subgridViewRowCount > 0) {
                const subgridViewRowIndex = subgridRowIndex - subgrid.firstViewableSubgridRowIndex;
                if (subgridViewRowIndex >= 0 && subgridViewRowIndex < subgridViewRowCount) {
                    const maxColumnCount = activeColumnIndices.length;
                    const columnIndices = new Array<number>(maxColumnCount);
                    let count = 0;
                    for (let i = 0; i < maxColumnCount; i++) {
                        const activeColumnIndex = activeColumnIndices[i];
                        const viewColumn = this._viewLayout.findColumnWithActiveIndex(activeColumnIndex);
                        if (viewColumn !== undefined) {
                            columnIndices[count++] = viewColumn.index;
                        }
                    }
                    if (count > 0) {
                        columnIndices.length = count;
                        this._renderActionQueue.invalidateViewRowCells(subgrid.firstViewRowIndex + subgridViewRowIndex, columnIndices);
                    }
                }
            }
        }
    }

    /** @internal */
    invalidateSubgridCell(subgrid: Subgrid<BCS, SF>, activeColumnIndex: number, subgridRowIndex: number) {
        if (this._canvas.hasBounds) {
            const subgridViewRowCount = subgrid.viewRowCount;
            if (subgridViewRowCount > 0) {
                const subgridViewRowIndex = subgridRowIndex - subgrid.firstViewableSubgridRowIndex;
                if (subgridViewRowIndex >= 0 && subgridViewRowIndex < subgridViewRowCount) {
                    const viewColumn = this._viewLayout.findColumnWithActiveIndex(activeColumnIndex);
                    if (viewColumn !== undefined) {
                        this._renderActionQueue.invalidateViewCell(viewColumn.index, subgrid.firstViewRowIndex + subgridViewRowIndex);
                    }
                }
            }
        }
    }

    /** @internal */
    private handlePageVisibilityChange() {
        const documentHidden = document.hidden;
        this._documentHidden = documentHidden;
        if (!documentHidden && this._renderActionQueue.actionsQueued && this._canvas.hasBounds) {
            this.flagAnimateRequired();
        }
    }

    private handleGridSettingsChanged() {
        if (this._animator !== undefined) {
            this._animator.setAnimateTimeIntervals(this._gridSettings.minimumAnimateTimeInterval, this._gridSettings.backgroundAnimateTimeInterval);
        }
    }

    /** @internal */
    private resolveWaitLastServerNotificationRendered(lastServerNotificationId: ServerNotificationId) {
        if (this._waitLastServerNotificationRenderedResolves.length > 0) {
            for (const resolve of this._waitLastServerNotificationRenderedResolves) {
                resolve(lastServerNotificationId);
            }
            this._waitLastServerNotificationRenderedResolves.length = 0;
        }
    }

    /** @internal */
    private flagAnimateRequired() {
        const animator = this._animator;
        if (animator !== undefined) {
            animator.flagAnimateRequired();
        }
    }

    /** @internal */
    private processRenderActionQueue() {
        const renderActions = this._renderActionQueue.takeActions();
        const actionsCount = renderActions.length;
        if (actionsCount > 0 && !this._documentHidden && this._canvas.hasBounds) {
            const gc = this._canvas.gc;
            try {
                gc.cache.save();

                this._viewLayout.ensureComputedInsideAnimationFrame();

                for (let i = 0; i < actionsCount; i++) {
                    const action = renderActions[i];
                    switch (action.type) {
                        case RenderAction.Type.PaintAll: {
                            this.paintAll();
                            break;
                        }
                        default:
                            throw new UnreachableCaseError('RCPRA30816', action.type);
                    }
                }

                setTimeout(() => { this.renderedEventer(); }, 0); // process outside frame animation

                const lastServerNotificationId = this._lastServerNotificationId;
                if (this._lastRenderedServerNotificationId !== lastServerNotificationId) {
                    this._lastRenderedServerNotificationId = lastServerNotificationId;
                    // do not resolve in animation frame call back
                    setTimeout(() => { this.resolveWaitLastServerNotificationRendered(lastServerNotificationId); }, 0); // process outside frame animation
                }

            } catch (e) {
                console.error(e);
            } finally {
                gc.cache.restore();
            }
        }
    }

    /** @internal */
    private paintAll() {
        this._gridPainter.paintCells();

        // Grid render also calculates mix width for each column.
        // Check here to see if there was a change and if so immediately re-render
        // before end-of-thread so user sees only the results of the 2nd render.
        // Mostly important on first render after setData. Note that stack overflow
        // will not happen because this will only be called once per data change.
        if (this._columnsManager.checkAutoWidenAllColumnsWithoutInvalidation()) {
            this._viewLayout.invalidateHorizontalAllAndScrollDimensionWithoutAction();
            this._viewLayout.ensureComputedInsideAnimationFrame();
            this._gridPainter.paintCells();
        }

        this._gridPainter.paintGridlines();

        this._gridPainter.checkPaintLastSelection();
    }
}

/** @public */
export namespace Renderer {
    /** @internal */
    export type WaitModelRenderedResolve = (this: void, id: ServerNotificationId) => void;
    /** @internal */
    export type RenderedEventer = (this: void) => void;
}
