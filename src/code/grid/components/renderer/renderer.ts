import { Animation } from '../../components/canvas-ex/animation';
import { CanvasEx } from '../../components/canvas-ex/canvas-ex';
import { CanvasRenderingContext2DEx } from '../../components/canvas-ex/canvas-rendering-context-2d-ex';
import { Selection } from '../../components/selection/selection';
import { GridSettings } from '../../interfaces/grid-settings';
import { ModelUpdateId, invalidModelUpdateId, lowestValidModelUpdateId } from '../../interfaces/schema-model';
import { AssertError, UnreachableCaseError } from '../../lib/revgrid-error';
import { ViewCell } from '../cell/view-cell';
import { ColumnsManager } from '../column/columns-manager';
import { Focus } from '../focus/focus';
import { Mouse } from '../mouse/mouse';
import { SubgridsManager } from '../subgrid/subgrids-manager';
import { ViewLayout } from '../view/view-layout';
import { ByColumnsAndRowsGridPainter } from './grid-painter/by-columns-and-rows-grid-painter';
import { GridPainter } from './grid-painter/grid-painter';
import { GridPainterRepository } from './grid-painter/grid-painter-repository';
import { RenderAction } from './render-action';
import { RenderActionQueue } from './render-action-queue';

export class Renderer {

    private readonly _gridPainterRepository: GridPainterRepository;
    private readonly _animator: Animation.Animator;
    private readonly _renderActionQueue = new RenderActionQueue()

    private _documentHidden = false;

    private _lastModelUpdateId: ModelUpdateId = lowestValidModelUpdateId;
    private _lastRenderedModelUpdateId: ModelUpdateId = lowestValidModelUpdateId;
    private _waitModelRenderedResolves = new Array<Renderer.WaitModelRenderedResolve>();

    private _destroyed = false;

    private _gridPainter: GridPainter;
    private _allGridPainter: GridPainter | undefined;

    private _pageVisibilityChangeListener = () => this.handlePageVisibilityChange();

    constructor(
        private readonly _gridProperties: GridSettings,
        mouse: Mouse,
        private readonly _canvasEx: CanvasEx,
        private readonly _columnsManager: ColumnsManager,
        private readonly _subgridsManager: SubgridsManager,
        private readonly _viewLayout: ViewLayout,
        focus: Focus,
        selection: Selection,
        private readonly _renderedEventer: Renderer.RenderedEventer,
    ) {
        this._gridPainterRepository = new GridPainterRepository(
            this._gridProperties,
            mouse,
            this._canvasEx,
            this._subgridsManager,
            this._viewLayout,
            focus,
            selection,
            (gc) => this.repaintAll(gc),
        );

        this._animator = {
            isContinuous: this._gridProperties.enableContinuousRepaint, // TODO properties should update this dynamically
            framesPerSecond: this._gridProperties.repaintFramesPerSecond, // TODO properties should update this dynamically
            dirty: false,
            animating: false,
            animate: () => this.processRenderActionQueue(),
            onTick: undefined,
            // internal
            lastAnimateTime: 0,
            currentAnimateCount: 0,
            currentFPS: 0,
            lastFPSComputeTime: 0,
        }

        this._renderActionQueue.actionsQueuedEventer = () => this._animator.dirty = true;

        this._viewLayout.invalidatedEventer = (action) => this._renderActionQueue.processViewLayoutInvalidateAction(action);

        document.addEventListener('visibilitychange', this._pageVisibilityChangeListener);
        this.setGridPainter('by-columns-and-rows');
    }

    get painting() { return this._animator.animating; }
    get lastModelUpdateId() { return this._lastModelUpdateId; }

    destroy() {
        this.resolveWaitModelRendered(invalidModelUpdateId);

        document.removeEventListener('visibilitychange', this._pageVisibilityChangeListener);

        this._destroyed = true;
    }

    registerGridPainter(key: string, constructor: GridPainter.Constructor) {
        this._gridPainterRepository.register(key, constructor);
    }

    getGridPainter(key: string) {
        return this._gridPainterRepository.get(key);
    }

    setGridPainter(key: string) {
        const gridPainter = this._gridPainterRepository.get(key);

        if (gridPainter !== this._gridPainter) {
            this._gridPainter = gridPainter;
        }
    }

    repaintAll(gc: CanvasRenderingContext2DEx) {
        if (this._allGridPainter === undefined) {
            this._allGridPainter = this.getGridPainter(ByColumnsAndRowsGridPainter.key);

        }
        this._allGridPainter.paintCells(gc);
    }

    /**
     * Certain renderers that pre-bundle column rects based on columns' background colors need to re-bundle when columns' background colors change. This method sets the `rebundle` property to `true` for those renderers that have that property.
     */
    flagColumnRebundlingRequired() {
        const all = this._gridPainterRepository.allCreated();
        for (const value of all) {
            value.flagColumnRebundlingRequired();
        }
    }

    start() {
        Animation.registerAnimator(this._animator);
    }

    stop() {
        Animation.deregisterAnimator(this._animator);
    }

    modelUpdated() {
        ++this._lastModelUpdateId;
    }

    /** Promise resolves when last model update is rendered. Columns and rows will then reflect last model update */
    waitModelRendered(): Promise<ModelUpdateId> {
        const lastRenderedModelUpdateId = this._lastRenderedModelUpdateId;
        if (lastRenderedModelUpdateId === this._lastModelUpdateId) {
            return Promise.resolve(lastRenderedModelUpdateId); // latest model already rendered
        } else {
            return new Promise<ModelUpdateId>((resolve) => { this._waitModelRenderedResolves.push(resolve); });
        }
    }

    beginChange() {
        this._renderActionQueue.beginChange();
    }

    endChange() {
        this._renderActionQueue.endChange();
    }

    invalidateAllData() {
        this._renderActionQueue.invalidateAllData();
    }

    invalidateDataRows(rowIndex: number, count: number) {
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

    invalidateDataRow(rowIndex: number) {
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

    invalidateDataRowCells(rowIndex: number, columnIndexes: number[]) {
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
                        this._renderActionQueue.invalidateDataRowCells(rowIndex, columnIndexes);
                    }
                }
            }
        }
    }

    invalidateDataCell(columnIndex: number, rowIndex: number) {
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
                        this._renderActionQueue.invalidateDataCell(columnIndex, rowIndex);
                    }
                }
            }
        }
    }

    invalidateView() {
        this._renderActionQueue.invalidateView();
    }

    invalidateViewCell(cell: ViewCell) {
        this._renderActionQueue.invalidateViewCell(cell);
    }

    getCurrentFPS() {
        return this._animator.currentFPS;
    }

    private handlePageVisibilityChange() {
        this._documentHidden = document.hidden;
    }

    private resolveWaitModelRendered(lastModelUpdateId: number) {
        if (this._waitModelRenderedResolves.length > 0) {
            for (const resolve of this._waitModelRenderedResolves) {
                resolve(lastModelUpdateId);
            }
            this._waitModelRenderedResolves.length = 0;
        }
    }

    private processRenderActionQueue() {
        if (this._documentHidden) {
            return false;
        } else {
            if (!this._destroyed) {

                const renderActions = this._renderActionQueue.takeActions();
                const actionsCount = renderActions.length;
                if (renderActions.length > 0) {
                    const gc = this._canvasEx.gc;
                    try {
                        gc.cache.save();

                        this._viewLayout.ensureValidWhileWithinAnimationFrame();

                        for (let i = 0; i < actionsCount; i++) {
                            const action = renderActions[i];
                            switch (action.type) {
                                case RenderAction.Type.PaintAll: {
                                    this.paintAll(gc);
                                    break;
                                }
                                default:
                                    throw new UnreachableCaseError('RCPRA30816', action.type);
                            }
                        }

                        setTimeout(() => this._renderedEventer(), 0); // process outside frame animation

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
            }
            return true;
        }
    }

    private paintAll(gc: CanvasRenderingContext2DEx) {
        this._gridPainter.paintCells(gc);


        // if (this.grid.cellEditor) {
        //     this.grid.cellEditor.gridRenderedNotification();
        // }

        // Grid render also calculates mix width for each column.
        // Check here to see if there was a change and if so immediately re-render
        // before end-of-thread so user sees only the results of the 2nd render.
        // Mostly important on first render after setData. Note that stack overflow
        // will not happen because this will only be called once per data change.
        if (this._columnsManager.checkColumnAutosizing(false, true)) {
            this._viewLayout.ensureValidWhileWithinAnimationFrame();
            this._gridPainter.paintCells(gc);
        }

        this._gridPainter.paintGridlines(gc);

        const lastSelectionBounds = this._viewLayout.calculateLastSelectionBounds();
        if (lastSelectionBounds !== undefined) {
            this._gridPainter.paintLastSelection(gc, lastSelectionBounds);

            // if (this._gridPainter.key === 'by-cells') {
            //     this._gridPainter.reset = true; // fixes GRID-490
            // }
        }
    }
}

export namespace Renderer {
    export type WaitModelRenderedResolve = (this: void, id: ModelUpdateId) => void;
    export type RenderedEventer = (this: void) => void;
}