import { CanvasManager } from '../../components/canvas/canvas-manager';
import { Selection } from '../../components/selection/selection';
import { ViewCell } from '../../interfaces/data/view-cell';
import { SchemaField } from '../../interfaces/schema/schema-field';
import { ModelUpdateId, invalidModelUpdateId, lowestValidModelUpdateId } from '../../interfaces/schema/schema-server';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { AssertError, UnreachableCaseError } from '../../types-utils/revgrid-error';
import { RevgridObject } from '../../types-utils/revgrid-object';
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
    private readonly _renderActionQueue = new RenderActionQueue()
    /** @internal */
    private readonly _gridSettingsChangedListener = () => this.handleGridSettingsChanged();

    /** @internal */
    private _documentHidden = false;

    /** @internal */
    private _lastModelUpdateId: ModelUpdateId = lowestValidModelUpdateId;
    /** @internal */
    private _lastRenderedModelUpdateId: ModelUpdateId = lowestValidModelUpdateId;
    /** @internal */
    private _waitModelRenderedResolves = new Array<Renderer.WaitModelRenderedResolve>();

    /** @internal */
    private _destroyed = false;

    /** @internal */
    private _animator: Animator | undefined;
    /** @internal */
    private _gridPainter: GridPainter<BGS, BCS, SF>;
    /** @internal */
    private _allGridPainter: GridPainter<BGS, BCS, SF> | undefined;

    /** @internal */
    private _pageVisibilityChangeListener = () => this.handlePageVisibilityChange();

    /** @internal */
    constructor(
        readonly revgridId: string,
        readonly internalParent: RevgridObject,
        /** @internal */
        private readonly _gridSettings: BGS,
        /** @internal */
        private readonly _canvasManager: CanvasManager<BGS>,
        /** @internal */
        private readonly _columnsManager: ColumnsManager<BCS, SF>,
        /** @internal */
        private readonly _subgridsManager: SubgridsManager<BCS, SF>,
        /** @internal */
        private readonly _viewLayout: ViewLayout<BGS, BCS, SF>,
        /** @internal */
        private readonly _focus: Focus<BGS, BCS, SF>,
        /** @internal */
        private readonly _selection: Selection<BCS, SF>,
        /** @internal */
        private readonly _mouse: Mouse<BGS, BCS, SF>,
    ) {
        this._gridPainterRepository = new GridPainterRepository(
            this._gridSettings,
            this._canvasManager,
            this._subgridsManager,
            this._viewLayout,
            this._focus,
            this._selection,
            this._mouse,
            () => this.repaintAll(),
        );

        this._renderActionQueue.actionsQueuedEventer = () => this.flagAnimateRequired();

        this._gridSettings.subscribeChangedEvent(this._gridSettingsChangedListener);
        this._gridSettings.viewRenderInvalidatedEventer = () => {
            this._viewLayout.resetAllCellPaintFingerprints();
            this.invalidateViewRender();
        }
        this._viewLayout.layoutInvalidatedEventer = (action) => this._renderActionQueue.processViewLayoutInvalidateAction(action);
        this._focus.viewCellRenderInvalidatedEventer = (cell) => this.invalidateViewCellRender(cell)
        this._selection.changedEventerForRenderer = () => this.invalidateViewRender();
        this._mouse.viewCellRenderInvalidatedEventer = (cell) => this.invalidateViewCellRender(cell);

        document.addEventListener('visibilitychange', this._pageVisibilityChangeListener);
        this.setGridPainter('by-columns-and-rows');
    }

    get painting() {
        const animator = this._animator;
        return animator !== undefined && animator.animating;
    }
    get lastModelUpdateId() { return this._lastModelUpdateId; }

    /** @internal */
    destroy() {
        this.stop(); // in case revgrid was not deactivated by application

        this.resolveWaitModelRendered(invalidModelUpdateId);

        document.removeEventListener('visibilitychange', this._pageVisibilityChangeListener);
        this._gridSettings.unsubscribeChangedEvent(this._gridSettingsChangedListener);

        this._destroyed = true;
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
                () => this.processRenderActionQueue(),
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
    modelUpdated() {
        ++this._lastModelUpdateId;
    }

    /** Promise resolves when last model update is rendered. Columns and rows will then reflect last model update
     * @internal
    */
    waitModelRendered(): Promise<ModelUpdateId> {
        const lastRenderedModelUpdateId = this._lastRenderedModelUpdateId;
        if (lastRenderedModelUpdateId === this._lastModelUpdateId) {
            return Promise.resolve(lastRenderedModelUpdateId); // latest model already rendered
        } else {
            return new Promise<ModelUpdateId>((resolve) => { this._waitModelRenderedResolves.push(resolve); });
        }
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
    invalidateViewRender() {
        if (this._canvasManager.hasBounds) {
            this._renderActionQueue.invalidateViewRender();
        }
    }

    /** @internal */
    invalidateViewCellRender(cell: ViewCell<BCS, SF>) {
        if (this._canvasManager.hasBounds) {
            this._renderActionQueue.invalidateViewCellRender(cell);
        }
    }

    /** @internal */
    invalidateAllData() {
        if (this._canvasManager.hasBounds) {
            this._renderActionQueue.invalidateAllData();
        }
    }

    /** @internal */
    invalidateDataRows(rowIndex: number, count: number) {
        if (this._canvasManager.hasBounds) {
            const firstScrollableSubgridRowIndex = this._viewLayout.firstScrollableSubgridRowIndex;
            if (firstScrollableSubgridRowIndex === undefined) {
                throw new AssertError('RIDRSF33321');
            } else {
                if ((rowIndex + count) > firstScrollableSubgridRowIndex) {
                    const lastScrollableSubgridRowIndex = this._viewLayout.lastScrollableSubgridRowIndex;
                    if (lastScrollableSubgridRowIndex === undefined) {
                        throw new AssertError('RIDRSL33321');
                    } else {
                        if (rowIndex <= lastScrollableSubgridRowIndex) {
                            this._renderActionQueue.invalidateDataRows(rowIndex, count);
                        }
                    }
                }
            }
        }
    }

    /** @internal */
    invalidateDataRow(rowIndex: number) {
        if (this._canvasManager.hasBounds) {
            const firstScrollableSubgridRowIndex = this._viewLayout.firstScrollableSubgridRowIndex;
            if (firstScrollableSubgridRowIndex === undefined) {
                throw new AssertError('RIDRF33321');
            } else {
                if (rowIndex >= firstScrollableSubgridRowIndex) {
                    const lastScrollableSubgridRowIndex = this._viewLayout.lastScrollableSubgridRowIndex;
                    if (lastScrollableSubgridRowIndex === undefined) {
                        throw new AssertError('RIDRL33321');
                    } else {
                        if (rowIndex <= lastScrollableSubgridRowIndex) {
                            this._renderActionQueue.invalidateDataRow(rowIndex);
                        }
                    }
                }
            }
        }
    }

    /** @internal */
    invalidateDataRowCells(rowIndex: number, allColumnIndexes: number[]) {
        if (this._canvasManager.hasBounds) {
            const firstScrollableSubgridRowIndex = this._viewLayout.firstScrollableSubgridRowIndex;
            if (firstScrollableSubgridRowIndex === undefined) {
                throw new AssertError('RIDRCSF33321');
            } else {
                if (rowIndex >= firstScrollableSubgridRowIndex) {
                    const lastScrollableSubgridRowIndex = this._viewLayout.lastScrollableSubgridRowIndex;
                    if (lastScrollableSubgridRowIndex === undefined) {
                        throw new AssertError('RIDRCSL33321');
                    } else {
                        if (rowIndex <= lastScrollableSubgridRowIndex) {
                            this._renderActionQueue.invalidateDataRowCells(rowIndex, allColumnIndexes);
                        }
                    }
                }
            }
        }
    }

    /** @internal */
    invalidateDataCell(allColumnIndex: number, rowIndex: number) {
        if (this._canvasManager.hasBounds) {
            const firstScrollableSubgridRowIndex = this._viewLayout.firstScrollableSubgridRowIndex;
            if (firstScrollableSubgridRowIndex === undefined) {
                throw new AssertError('RIDRCFR33321');
            } else {
                if (rowIndex >= firstScrollableSubgridRowIndex) {
                    const lastScrollableSubgridRowIndex = this._viewLayout.lastScrollableSubgridRowIndex;
                    if (lastScrollableSubgridRowIndex === undefined) {
                        throw new AssertError('RIDRCLR33321');
                    } else {
                        if (rowIndex <= lastScrollableSubgridRowIndex) {
                            // add support for (active) columns
                            this._renderActionQueue.invalidateDataCell(allColumnIndex, rowIndex);
                        }
                    }
                }
            }
        }
    }

    /** @internal */
    private handlePageVisibilityChange() {
        const documentHidden = document.hidden;
        this._documentHidden = documentHidden;
        if (!documentHidden && this._renderActionQueue.actionsQueued && this._canvasManager.hasBounds) {
            this.flagAnimateRequired();
        }
    }

    private handleGridSettingsChanged() {
        if (this._animator !== undefined) {
            this._animator.setAnimateTimeIntervals(this._gridSettings.minimumAnimateTimeInterval, this._gridSettings.backgroundAnimateTimeInterval);
        }
    }

    /** @internal */
    private resolveWaitModelRendered(lastModelUpdateId: number) {
        if (this._waitModelRenderedResolves.length > 0) {
            for (const resolve of this._waitModelRenderedResolves) {
                resolve(lastModelUpdateId);
            }
            this._waitModelRenderedResolves.length = 0;
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
        if (this._documentHidden) {
            return false;
        } else {
            if (!this._canvasManager.hasBounds) {
                return false;
            } else {
                const renderActions = this._renderActionQueue.takeActions();
                const actionsCount = renderActions.length;
                if (renderActions.length > 0) {
                    const gc = this._canvasManager.gc;
                    try {
                        gc.cache.save();

                        this._viewLayout.ensureValidInsideAnimationFrame();

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

                        setTimeout(() => this.renderedEventer(), 0); // process outside frame animation

                        const lastModelUpdateId = this._lastModelUpdateId;
                        if (this._lastRenderedModelUpdateId !== lastModelUpdateId) {
                            this._lastRenderedModelUpdateId = lastModelUpdateId;
                            // do not resolve in animation frame call back
                            setTimeout(() => this.resolveWaitModelRendered(lastModelUpdateId), 0); // process outside frame animation
                        }

                    } catch (e) {
                        console.error(e);
                    } finally {
                        gc.cache.restore();
                    }
                }

                return true;
            }
        }
    }

    /** @internal */
    private paintAll() {
        this._gridPainter.paintCells();


        // if (this.grid.cellEditor) {
        //     this.grid.cellEditor.gridRenderedNotification();
        // }

        // Grid render also calculates mix width for each column.
        // Check here to see if there was a change and if so immediately re-render
        // before end-of-thread so user sees only the results of the 2nd render.
        // Mostly important on first render after setData. Note that stack overflow
        // will not happen because this will only be called once per data change.
        if (this._columnsManager.checkAllColumnsAutoWidthSizing(true, true)) {
            this._viewLayout.ensureValidInsideAnimationFrame();
            this._gridPainter.paintCells();
        }

        this._gridPainter.paintGridlines();

        this._gridPainter.checkPaintLastSelection();
    }
}

/** @public */
export namespace Renderer {
    /** @internal */
    export type WaitModelRenderedResolve = (this: void, id: ModelUpdateId) => void;
    /** @internal */
    export type RenderedEventer = (this: void) => void;
}
