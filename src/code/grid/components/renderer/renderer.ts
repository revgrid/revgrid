import { Animation } from '../../components/canvas-ex/animation';
import { CanvasEx } from '../../components/canvas-ex/canvas-ex';
import { CanvasRenderingContext2DEx } from '../../components/canvas-ex/canvas-rendering-context-2d-ex';
import { Selection } from '../../components/selection/selection';
import { GridSettings } from '../../interfaces/grid-settings';
import { ModelUpdateId, invalidModelUpdateId, lowestValidModelUpdateId } from '../../interfaces/schema-model';
import { AssertError, UnreachableCaseError } from '../../lib/revgrid-error';
import { ColumnsManager } from '../column/columns-manager';
import { Focus } from '../focus/focus';
import { Mouse } from '../mouse/mouse';
import { SubgridsManager } from '../subgrid/subgrids-manager';
import { ViewLayout } from '../view/view-layout';
import { ByColumnsAndRowsGridPainter } from './grid-painter/by-columns-and-rows-grid-painter';
import { GridPainter } from './grid-painter/grid-painter';
import { GridPainterRepository } from './grid-painter/grid-painter-repository';
import { RenderAction } from './render-action';
import { RenderActioner } from './render-actioner';

export class Renderer {

    private readonly gridPainterRepository: GridPainterRepository;
    private readonly _animator: Animation.Animator;
    private readonly _renderActioner = new RenderActioner()

    private _documentHidden = false;

    private _lastModelUpdateId: ModelUpdateId = lowestValidModelUpdateId;
    private _lastRenderedModelUpdateId: ModelUpdateId = lowestValidModelUpdateId;
    private _waitModelRenderedResolves = new Array<Renderer.WaitModelRenderedResolve>();

    private _destroyed = false;

    private _gridPainter: GridPainter;
    private _allRepainter: GridPainter;

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
        private readonly _behaviorShapeChangedEventer: Renderer.BehaviorShapeChangedEventer, // remove this when viewport handles scrolling
        private readonly _renderedEventer: Renderer.RenderedEventer,
    ) {
        this.gridPainterRepository = new GridPainterRepository(
            this._gridProperties,
            mouse,
            this._canvasEx,
            this._subgridsManager,
            this._viewLayout,
            focus,
            selection,
            (blacklist) => this.resetAllGridPainters(blacklist),
            (gc) => this.repaintAll(gc),
        );
        this._renderActioner.actionsEvent = (actions) => this.processRenderActions(actions);
        this._animator = {
            isContinuous: this._gridProperties.enableContinuousRepaint, // TODO properties should update this dynamically
            framesPerSecond: this._gridProperties.repaintFramesPerSecond, // TODO properties should update this dynamically
            dirty: false,
            animating: false,
            animate: () => this.paint(),
            onTick: undefined,
            // internal
            lastAnimateTime: 0,
            currentAnimateCount: 0,
            currentFPS: 0,
            lastFPSComputeTime: 0,
        }

        document.addEventListener('visibilitychange', this._pageVisibilityChangeListener);
        this.setGridPainter('by-columns-and-rows');

        this._viewLayout.computedEventer = () => {
            this.resetAllGridPainters([]);
            this.repaint();
        }
    }

    get painting() { return this._animator.animating; }
    get lastModelUpdateId() { return this._lastModelUpdateId; }

    destroy() {
        this.resolveWaitModelRendered(invalidModelUpdateId);

        document.removeEventListener('visibilitychange', this._pageVisibilityChangeListener);

        this._destroyed = true;
    }

    registerGridPainter(key: string, constructor: GridPainter.Constructor) {
        this.gridPainterRepository.register(key, constructor);
    }

    getGridPainter(key: string) {
        return this.gridPainterRepository.get(key);
    }

    setGridPainter(key: string) {
        const gridPainter = this.gridPainterRepository.get(key);

        if (!gridPainter) {
            throw new AssertError('RSGP68240', 'Unregistered grid renderer "' + key + '"');
        }

        if (gridPainter !== this._gridPainter) {
            this._gridPainter = gridPainter;
            this._gridPainter.reset = true;
        }
    }

    resetAllGridPainters(blackList: string[]) {
        // Notify renderers that grid shape has changed
        const all = this.gridPainterRepository.allCreatedEntries();
        for (const [key, value] of all) {
            value.reset = !blackList || blackList.indexOf(key) < 0;
        }
    }

    repaintAll(gc: CanvasRenderingContext2DEx) {
        if (this._allRepainter === undefined) {
            this._allRepainter = this.getGridPainter(ByColumnsAndRowsGridPainter.key);

        }
        this._allRepainter.paintCells(gc);
    }

    /**
     * Certain renderers that pre-bundle column rects based on columns' background colors need to re-bundle when columns' background colors change. This method sets the `rebundle` property to `true` for those renderers that have that property.
     */
    rebundleGridRenderers() {
        const all = this.gridPainterRepository.allCreated();
        for (const value of all) {
            if (value.rebundle !== undefined) {
                value.rebundle = true;
            }
        }
    }

    start() {
        Animation.registerAnimator(this._animator);
    }

    stop() {
        Animation.deregisterAnimator(this._animator);
    }

    requestPaint() {
        this._animator.dirty = true;
    }

    repaint() {
        if (this._gridProperties.repaintImmediately) {
            if (this._columnsManager.columnsCreated) {
                Animation.animate(this._animator, performance.now());
            }
        } else {
            this.requestPaint();
        }
    }

    /**
     * @desc This is the main forking of the renderering task.
     *
     * `dataModel.fetchData` callback renders the grid. Note however that this is not critical when the clock is
     * running as it will be rendered on the next tick. We let it call it anyway in case (1) fetch returns quickly
     * enough to be rendered on this tick rather than next or (2) clock isn't running (for debugging purposes).
     * @param gc
     * @this {RendererType}
     */
    paintGrid(gc: CanvasRenderingContext2DEx) {
        this._viewLayout.ensureValid();
        const lastSelectionBounds = this._viewLayout.calculateLastSelectionBounds();

        this._gridPainter.paintCells(gc);
        this._gridPainter.paintGridlines(gc);
        if (lastSelectionBounds !== undefined) {
            this._gridPainter.paintLastSelection(gc, lastSelectionBounds);

            if (this._gridPainter.key === 'by-cells') {
                this._gridPainter.reset = true; // fixes GRID-490
            }
        }
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
        this._renderActioner.beginChange();
    }

    endChange() {
        this._renderActioner.endChange();
    }

    renderColumnsInserted(index: number, count: number) {
        this._renderActioner.renderColumnsInserted(index, count);
    }

    renderColumnsDeleted(index: number, count: number) {
        this._renderActioner.renderColumnsDeleted(index, count);
    }

    renderAllColumnsDeleted() {
        this._renderActioner.renderAllColumnsDeleted();
    }

    renderColumnsChanged() {
        this._renderActioner.renderColumnsChanged();
    }

    renderRowsInserted(index: number, count: number) {
        this._renderActioner.renderRowsInserted(index, count);
    }

    renderRowsDeleted(index: number, count: number) {
        this._renderActioner.renderRowsDeleted(index, count);
    }

    renderAllRowsDeleted() {
        this._renderActioner.renderAllRowsDeleted();
    }

    renderRowsLoaded() {
        this._renderActioner.renderRowsLoaded();
    }

    renderRowsMoved(oldRowIndex: number, newRowIndex: number, rowCount: number) {
        this._renderActioner.renderRowsMoved(oldRowIndex, newRowIndex, rowCount);
    }

    invalidateAll() {
        this._renderActioner.invalidateAll();
    }

    invalidateRows(rowIndex: number, count: number) {
        this._renderActioner.invalidateRows(rowIndex, count);
    }

    invalidateRow(rowIndex: number) {
        this._renderActioner.invalidateRow(rowIndex);
    }

    invalidateRowColumns(rowIndex: number, columnIndex: number, columnCount: number) {
        this._renderActioner.invalidateRowColumns(rowIndex, columnIndex, columnCount);
    }

    invalidateRowCells(rowIndex: number, columnIndexes: number[]) {
        this._renderActioner.invalidateRowCells(rowIndex, columnIndexes);
    }

    invalidateCell(columnIndex: number, rowIndex: number) {
        this._renderActioner.invalidateCell(columnIndex, rowIndex);
    }

    processRenderActions(actions: RenderAction[]) {
        const count = actions.length;
        for (let i = 0; i < count; i++) {
            const action = actions[i];
            switch (action.type) {
                case RenderAction.Type.RepaintView: {
                    this.repaint();
                    break;
                }
                case RenderAction.Type.InvalidateView: {
                    this._behaviorShapeChangedEventer(); // needs cleanup
                    break;
                }
                default:
                    throw new UnreachableCaseError('RPRA30816', action.type);
            }
        }
    }

    getCurrentFPS() {
        return this._animator.currentFPS;
    }

    /**
     * @desc This is the entry point from fin-canvas.
     */
    paint() {
        if (this._documentHidden) {
            return false;
        } else {
            if (!this._destroyed) {
                const gc = this._canvasEx.gc;
                try {
                    gc.cache.save();

                    this.paintGrid(gc);


                    // if (this.grid.cellEditor) {
                    //     this.grid.cellEditor.gridRenderedNotification();
                    // }

                    // Grid render also calculates mix width for each column.
                    // Check here to see if there was a change and if so immediately re-render
                    // before end-of-thread so user sees only the results of the 2nd render.
                    // Mostly important on first render after setData. Note that stack overflow
                    // will not happen because this will only be called once per data change.
                    if (this._columnsManager.checkColumnAutosizing(false)) {
                        this.paintGrid(gc);
                    }

                    this._renderedEventer();

                    const lastModelUpdateId = this._lastModelUpdateId;
                    if (this._lastRenderedModelUpdateId !== lastModelUpdateId) {
                        this._lastRenderedModelUpdateId = lastModelUpdateId;
                        // do not resolve in animation frame call back
                        setTimeout(() => this.resolveWaitModelRendered(lastModelUpdateId), 0);
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
}

export namespace Renderer {
    export type WaitModelRenderedResolve = (this: void, id: ModelUpdateId) => void;
    export type BehaviorShapeChangedEventer = (this: void) => void;
    export type RenderedEventer = (this: void) => void;
}
