import { ViewCell } from '../../../interfaces/data/view-cell';
import { ViewLayoutRow } from '../../../interfaces/data/view-layout-row';
import { SchemaServer } from '../../../interfaces/schema/schema-server';
import { ViewLayoutColumn } from '../../../interfaces/schema/view-layout-column';
import { BehavioredColumnSettings } from '../../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../../interfaces/settings/behaviored-grid-settings';
import { CachedCanvasRenderingContext2D } from '../../../types-utils/cached-canvas-rendering-context-2d';
import { Rectangle } from '../../../types-utils/rectangle';
import { CanvasManager } from '../../canvas/canvas-manager';
import { Focus } from '../../focus/focus';
import { Mouse } from '../../mouse/mouse';
import { Selection } from '../../selection/selection';
import { SubgridsManager } from '../../subgrid/subgrids-manager';
import { ViewLayout } from '../../view/view-layout';

export abstract class GridPainter<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> {
    protected _renderingContext: CachedCanvasRenderingContext2D;

    private _columnBundles = new Array<GridPainter.ColumnBundle | undefined>();
    private _rowBundlesAndPrefixColors: GridPainter.RowBundlesAndPrefillColors | undefined;

    reset = false;
    rebundle: boolean | undefined;

    private _columnRebundlingRequired = false;
    private _rowRebundlingRequired = false;

    private _columnBundlesComputationId = -1;
    private _rowBundlesComputationId = -1;

    constructor(
        protected readonly gridSettings: BGS,
        protected readonly canvasManager: CanvasManager<BGS>,
        protected readonly subgridsManager: SubgridsManager<BGS, BCS, SF>,
        protected readonly viewLayout: ViewLayout<BGS, BCS, SF>,
        protected readonly focus: Focus<BGS, BCS, SF>,
        protected readonly selection: Selection<BGS, BCS, SF>,
        protected readonly mouse: Mouse<BGS, BCS, SF>,
        protected readonly repaintAllRequiredEventer: GridPainter.RepaintAllRequiredEventer,
        public readonly key: string,
        public readonly partial: boolean,
        initialRebundle: boolean | undefined,
    ) {
        this._renderingContext = this.canvasManager.gc;
        if (initialRebundle !== undefined) {
            this.rebundle = initialRebundle;
        }
    }

    flagColumnRebundlingRequired() {
        this._columnRebundlingRequired = true;
    }

    getColumnBundles(viewLayoutColumns: ViewLayoutColumn<BCS, SF>[]) {
        if (this._columnBundlesComputationId !== this.viewLayout.rowsColumnsComputationId || this._columnRebundlingRequired) {
            this._columnBundles = this.calculateColumnBundles(viewLayoutColumns);

            this._columnBundlesComputationId = this.viewLayout.rowsColumnsComputationId;
            this._columnRebundlingRequired = false;
        }
        return this._columnBundles;
    }

    getRowBundlesAndPrefillColors(viewLayoutRows: ViewLayoutRow<BCS, SF>[]) {
        if (this._rowBundlesComputationId !== this.viewLayout.rowsColumnsComputationId || this._rowRebundlingRequired) {
            this._rowBundlesAndPrefixColors = this.calculateRowBundlesAndPrefillColors(viewLayoutRows);

            this._rowBundlesComputationId = this.viewLayout.rowsColumnsComputationId;
            this._rowRebundlingRequired = false;
        }
        return this._rowBundlesAndPrefixColors;
    }

    abstract paintCells(): void;

    protected paintCell(
        viewCell: ViewCell<BCS, SF>,
        prefillColor: string | undefined,
    ): number | undefined {
        const focus = this.focus;
        const focusCell = focus.cell;
        if (focusCell === viewCell) { // does cell have focus
            const editor = focus.editor;
            if (editor !== undefined) { // is editor active
                if (editor.paint !== undefined) { // should editor be painted
                    return editor.paint(viewCell, prefillColor);
                } else {
                    return undefined; // Cell does not need painting while editor is active
                }
            }
        }
        const cellPainter = viewCell.subgrid.getCellPainter(viewCell);
        return cellPainter.paint(viewCell, prefillColor);
    }

    paintErrorCell(err: Error, vc: ViewLayoutColumn<BCS, SF>, vr: ViewLayoutRow<BCS, SF>) {
        const gc = this._renderingContext;
        const message = (err && (err.message ?? `${err}`)) ?? 'Unknown error.';

        const bounds: Rectangle = { x: vc.left, y: vr.top, width: vc.width, height: vr.height };

        console.error(message);

        gc.cache.save(); // define clipping region
        gc.beginPath();
        gc.rect(bounds.x, bounds.y, bounds.width, bounds.height);
        gc.clip();

        this.paintErrorMessage(gc, bounds, message);

        gc.cache.restore(); // discard clipping region
    }

    /**
     * @desc We opted to not paint borders for each cell as that was extremely expensive. Instead we draw grid lines here.
     */
    paintGridlines() {
        const viewLayoutColumns = this.viewLayout.columns;
        const columnCount = viewLayoutColumns.length;
        const viewLayoutRows = this.viewLayout.rows;
        const rowCount = viewLayoutRows.length;

        if (columnCount > 0 && rowCount > 0) {
            const gc = this._renderingContext;
            const gridSettings = this.gridSettings;
            const lastColumnIndex = columnCount - 1;
            const lastRowIndex = rowCount - 1;
            const firstVisibleColumnLeft = viewLayoutColumns[0].left;
            const lastVisibleColumnRight = viewLayoutColumns[lastColumnIndex].rightPlus1;
            const viewWidth = lastVisibleColumnRight - firstVisibleColumnLeft;
            const viewHeight = viewLayoutRows[lastRowIndex].bottomPlus1;
            const gridLinesVColor = gridSettings.verticalGridLinesColor;
            const gridLinesHColor = gridSettings.horizontalGridLinesColor;
            // const borderBox = gridProps.boxSizing === 'border-box';

            if (gridSettings.verticalGridLinesEnabled && gridSettings.verticalGridLinesVisible) {
                const gridLinesVWidth = gridSettings.verticalGridLinesWidth;
                const preMainRowCount = this.subgridsManager.calculatePreMainRowCount();
                const lastPreMainRow = viewLayoutRows[preMainRowCount - 1]; // any header rows?
                const firstDataRow = viewLayoutRows[preMainRowCount]; // any data rows?
                const userDataAreaTop = firstDataRow && firstDataRow.top;
                const top = gridSettings.verticalGridLinesVisible ? 0 : userDataAreaTop;
                const bottom = gridSettings.horizontalGridLinesVisible ? viewHeight : lastPreMainRow && lastPreMainRow.bottomPlus1;

                if (top !== undefined && bottom !== undefined) { // either undefined means nothing to draw
                    gc.cache.fillStyle = gridLinesVColor;

                    viewLayoutColumns.forEach((vc, c) => {
                        if (
                            c < lastColumnIndex // don't draw rule after last column
                        ) {
                            const x = vc.rightPlus1;
                            const height = bottom  - top;

                            // draw a single vertical grid line between both header and data cells OR a line segment in header only
                            gc.fillRect(x, top, gridLinesVWidth, height);

                            // when above drew a line segment in header, draw a second vertical grid line between data cells
                            if (gridSettings.horizontalGridLinesVisible) {
                                gc.fillRect(x, userDataAreaTop, gridLinesVWidth, bottom - userDataAreaTop);
                            }
                        }
                    });
                }
            }

            if (gridSettings.horizontalGridLinesEnabled && gridSettings.horizontalGridLinesVisible) {
                const gridLinesHWidth = gridSettings.horizontalGridLinesWidth;
                const width = lastVisibleColumnRight - firstVisibleColumnLeft;

                gc.cache.fillStyle = gridLinesHColor;

                viewLayoutRows.forEach(function(vr, r) {
                    if (r < lastRowIndex) { // don't draw rule below last row
                        const y = vr.bottomPlus1;
                        gc.fillRect(firstVisibleColumnLeft, y, width, gridLinesHWidth);
                    }
                });
            }

            // draw fixed rule lines over grid rule lines

            if (gridSettings.horizontalFixedLineWidth !== undefined) {
                const rowGap = viewLayoutRows.gap;
                if (rowGap !== undefined) {
                    gc.cache.fillStyle = gridSettings.horizontalFixedLineColor || gridLinesHColor;
                    const edgeWidth = gridSettings.horizontalFixedLineEdgeWidth;
                    if (edgeWidth !== undefined) {
                        gc.fillRect(firstVisibleColumnLeft, rowGap.top, viewWidth, edgeWidth);
                        gc.fillRect(firstVisibleColumnLeft, rowGap.bottom - edgeWidth, viewWidth, edgeWidth);
                    } else {
                        gc.fillRect(firstVisibleColumnLeft, rowGap.top, viewWidth, rowGap.bottom - rowGap.top);
                    }
                }
            }

            if (gridSettings.verticalFixedLineWidth !== undefined) {
                const columnGap = viewLayoutColumns.gap;
                if (columnGap !== undefined) {
                    gc.cache.fillStyle = gridSettings.verticalFixedLineColor || gridLinesVColor;
                    const edgeWidth = gridSettings.verticalFixedLineEdgeWidth;
                    if (edgeWidth !== undefined) {
                        gc.fillRect(columnGap.left, 0, edgeWidth, viewHeight);
                        gc.fillRect(columnGap.rightPlus1 - edgeWidth, 0, edgeWidth, viewHeight);
                    } else {
                        gc.fillRect(columnGap.left, 0, columnGap.rightPlus1 - columnGap.left, viewHeight);
                    }
                }
            }
        }
    }

    checkPaintLastSelection() {
        const lastSelectionBounds = this.calculateLastSelectionBounds();

        if (lastSelectionBounds !== undefined) {
            // Render the selection model around the last selection bounds
            const gc = this._renderingContext;
            const gridProps = this.gridSettings;
            const selectionRegionOverlayColor = this.partial ? 'transparent' : gridProps.selectionRegionOverlayColor;
            const selectionRegionOutlineColor = gridProps.selectionRegionOutlineColor;

            const visOverlay = gc.alpha(selectionRegionOverlayColor) > 0;
            const visOutline = gc.alpha(selectionRegionOutlineColor) > 0;

            if (visOverlay || visOutline) {
                const bounds = lastSelectionBounds;
                const x = bounds.x;
                const y = bounds.y;
                const width = bounds.width;
                const height = bounds.height;

                gc.beginPath();

                gc.rect(x, y, width, height);

                if (visOverlay) {
                    gc.cache.fillStyle = selectionRegionOverlayColor;
                    gc.fill();
                }

                if (visOutline) {
                    gc.cache.lineWidth = 1;
                    gc.cache.strokeStyle = selectionRegionOutlineColor;
                    gc.stroke();
                }

                gc.closePath();

                // if (this._gridPainter.key === 'by-cells') {
                //     this._gridPainter.reset = true; // fixes GRID-490
                // }
            }
        }
    }

    calculateLastSelectionBounds(): Rectangle | undefined {
        const columns = this.viewLayout.columns;
        const rows = this.viewLayout.rows;
        const columnCount = columns.length;
        const rowCount = rows.length;

        if (columnCount === 0 || rowCount === 0) {
            // nothing visible
            return undefined;
        }

        const gridProps = this.gridSettings;
        const selection = this.selection;

        const selectionArea = selection.lastArea;

        if (selectionArea === undefined) {
            return undefined; // no selection
        } else {
            // todo not sure what this is for; might be defunct logic
            if (selectionArea.topLeft.x === -1) {
                // no selected area, lets exit
                return undefined;
            } else {
                const firstScrollableColumnIndex = this.viewLayout.firstScrollableColumnIndex;
                const firstScrollableRowIndex = this.viewLayout.firstScrollableRowIndex;
                if (firstScrollableColumnIndex === undefined || firstScrollableRowIndex === undefined) {
                    // selection needs scrollable data
                    return undefined;
                } else {
                    let vc: ViewLayoutColumn<BCS, SF>;
                    let vr: ViewLayoutRow<BCS, SF>;
                    const lastScrollableColumn = columns[columnCount - 1]; // last column in scrollable section
                    const lastScrollableRow = rows[rowCount - 1]; // last row in scrollable data section
                    const firstScrollableColumn = columns[firstScrollableColumnIndex];
                    const firstScrollableActiveColumnIndex = firstScrollableColumn.activeColumnIndex;
                    const firstScrollableRow = rows[firstScrollableRowIndex];
                    const firstScrollableSubgridRowIndex = firstScrollableRow.subgridRowIndex;
                    const fixedColumnCount = gridProps.fixedColumnCount;
                    const fixedRowCount = gridProps.fixedRowCount;
                    const preMainRowCount = this.subgridsManager.calculatePreMainRowCount();

                    if (
                        // entire selection scrolled out of view to left of visible columns; or
                        (vc = columns[0]) &&
                        selectionArea.exclusiveBottomRight.x < vc.activeColumnIndex ||

                        // entire selection scrolled out of view between fixed columns and scrollable columns; or
                        fixedColumnCount &&
                        (vc = columns[fixedColumnCount - 1]) &&
                        selectionArea.topLeft.x > vc.activeColumnIndex &&
                        selectionArea.exclusiveBottomRight.x < firstScrollableColumn.activeColumnIndex ||

                        // entire selection scrolled out of view to right of visible columns; or
                        lastScrollableColumn &&
                        selectionArea.topLeft.x > lastScrollableColumn.activeColumnIndex ||

                        // entire selection scrolled out of view above visible rows; or
                        (vr = rows[preMainRowCount]) &&
                        selectionArea.exclusiveBottomRight.y < vr.subgridRowIndex ||

                        // entire selection scrolled out of view between fixed rows and scrollable rows; or
                        fixedRowCount &&
                        firstScrollableRow !== undefined &&
                        (vr = rows[preMainRowCount + fixedRowCount - 1]) &&
                        selectionArea.topLeft.y > vr.subgridRowIndex &&
                        selectionArea.exclusiveBottomRight.y < firstScrollableRow.subgridRowIndex ||

                        // entire selection scrolled out of view below visible rows
                        lastScrollableRow &&
                        selectionArea.topLeft.y > lastScrollableRow.subgridRowIndex
                    ) {
                        return undefined;
                    } else {
                        const vcOrigin = columns[selectionArea.topLeft.x - firstScrollableActiveColumnIndex] || firstScrollableColumn;
                        const vrOrigin = rows[selectionArea.topLeft.y - firstScrollableSubgridRowIndex] || firstScrollableRow;
                        const vcCorner = columns[selectionArea.exclusiveBottomRight.x - firstScrollableActiveColumnIndex] ||
                            (selectionArea.exclusiveBottomRight.x > lastScrollableColumn.activeColumnIndex ? lastScrollableColumn : firstScrollableColumn);
                        const vrCorner = rows[selectionArea.exclusiveBottomRight.y - firstScrollableSubgridRowIndex] ||
                            (selectionArea.exclusiveBottomRight.y > lastScrollableRow.subgridRowIndex ? lastScrollableRow : firstScrollableRow);

                        if (!(vcOrigin && vrOrigin && vcCorner && vrCorner)) {
                            return undefined;
                        } else {
                            const bounds: Rectangle = {
                                x: vcOrigin.left,
                                y: vrOrigin.top,
                                width: vcCorner.rightPlus1 - vcOrigin.left,
                                height: vrCorner.bottomPlus1 - vrOrigin.top
                            };

                            return bounds;
                        }
                    }
                }
            }
        }
    }

    private calculateColumnBundles(viewLayoutColumns: ViewLayoutColumn<BCS, SF>[]): GridPainter.ColumnBundle[] {
        const gridProps = this.gridSettings;
        const columnCount = viewLayoutColumns.length;

        const bundles = new Array<GridPainter.ColumnBundle>(columnCount); // max size
        const gridPrefillColor = gridProps.backgroundColor;

        let bundleCount = 0;

        for (let i = 0; i < columnCount; i++) {
            const vc = viewLayoutColumns[i];
            let bundle: GridPainter.ColumnBundle | undefined;
            const backgroundColor = vc.column.settings.backgroundColor;
            if (bundle !== undefined && bundle.backgroundColor === backgroundColor) {
                bundle.right = vc.rightPlus1;
            } else {
                if (backgroundColor === gridPrefillColor) {
                    bundle = undefined;
                } else {
                    bundle = {
                        backgroundColor: backgroundColor,
                        left: vc.left,
                        right: vc.rightPlus1
                    };
                    bundles[bundleCount++] = bundle;
                }
            }
        }

        bundles.length = bundleCount;

        return bundles;
    }

    private calculateRowBundlesAndPrefillColors(viewLayoutRows: ViewLayoutRow<BCS, SF>[]): GridPainter.RowBundlesAndPrefillColors | undefined {
        const gridProps = this.gridSettings;
        const stripes = gridProps.rowStripes;
        if (stripes === undefined) {
            return undefined;
        } else {
            const rowCount = viewLayoutRows.length

            const bundles = new Array<GridPainter.RowBundle>(rowCount); // set to max possible length
            const gridPrefillColor = gridProps.backgroundColor;
            const prefillColors = new Array<string>(rowCount);

            let bundle: GridPainter.RowBundle | undefined;
            let bundleCount = 0;
            for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
                const vr = viewLayoutRows[rowIndex];
                let backgroundColor: string;
                if (!vr.subgrid.isMain) {
                    backgroundColor = gridPrefillColor;
                } else {
                    if (stripes.length === 0) {
                        backgroundColor = gridPrefillColor;
                    } else {
                        const stripe = stripes[vr.subgridRowIndex % stripes.length];
                        if (stripe === undefined) {
                            backgroundColor = gridPrefillColor;
                        } else {
                            backgroundColor = stripe.backgroundColor ?? gridPrefillColor;
                        }
                    }
                }
                prefillColors[rowIndex] = backgroundColor;
                if (bundle !== undefined && bundle.backgroundColor === backgroundColor) {
                    bundle.bottom = vr.bottomPlus1;
                } else {
                    if (backgroundColor === gridPrefillColor) {
                        bundle = undefined; // this looks wrong
                    } else {
                        bundle = {
                            backgroundColor: backgroundColor,
                            top: vr.top,
                            bottom: vr.bottomPlus1
                        };
                        bundles[bundleCount++] = bundle;
                    }
                }
            }
            // what about final bundle

            bundles.length = bundleCount;

            return {
                bundles: bundles,
                prefillColors: prefillColors,
            }
        }
    }

    private paintErrorMessage(gc: CachedCanvasRenderingContext2D, bounds: Rectangle, message: string) {
        const x = bounds.x;
        const y = bounds.y;
        // const width = config.bounds.width;
        const height = bounds.height;

        // clear the cell
        // (this makes use of the rect path defined by the caller)
        gc.cache.fillStyle = '#FFD500';
        gc.fill();

        // render message text
        gc.cache.fillStyle = '#A00';
        gc.cache.textAlign = 'start';
        gc.cache.textBaseline = 'middle';
        gc.cache.font = 'bold 6pt "arial narrow", verdana, geneva';
        gc.fillText(message, x + 4, y + height / 2 + 0.5);
    }
}

export namespace GridPainter {
    export type ResetAllGridPaintersRequiredEventer = (this: void, blackList: string[]) => void;
    export type RepaintAllRequiredEventer = (this: void) => void;
    export type Constructor<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> = new(
        gridProperties: BGS,
        canvasManager: CanvasManager<BGS>,
        subgridsManager: SubgridsManager<BGS, BCS, SF>,
        viewLayout: ViewLayout<BGS, BCS, SF>,
        focus: Focus<BGS, BCS, SF>,
        selection: Selection<BGS, BCS, SF>,
        mouse: Mouse<BGS, BCS, SF>,
        repaintAllRequired: RepaintAllRequiredEventer,
    ) => GridPainter<BGS, BCS, SF>;

    export interface ColumnBundle {
        backgroundColor: string;
        left: number;
        right: number;
    }

    export interface RowBundle {
        backgroundColor: string;
        top: number;
        bottom: number;
    }

    export interface RowBundlesAndPrefillColors {
        bundles: RowBundle[];
        prefillColors: string[];
    }
}
