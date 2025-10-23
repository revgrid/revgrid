import { RevAssertError, RevClientObject, RevDataServer, RevOptionsError, RevSchemaField, RevSchemaServer, RevUnreachableCaseError } from '../../common';
import { RevSubgrid } from '../interfaces/subgrid';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings } from '../settings';
import { RevCanvas } from './canvas/canvas';
import { RevColumnsManager } from './column/columns-manager';
import { RevFocus } from './focus/focus';
import { RevMouse } from './mouse/mouse';
import { RevRenderer } from './renderer/renderer';
import { RevScroller } from './scroller';
import { RevStandardScroller } from './scroller/standard-scroller';
import { RevSelection } from './selection/selection';
import { RevSubgridsManager } from './subgrid/subgrids-manager';
import { RevViewLayout } from './view/view-layout';

/** @internal */
export class RevComponentsManager<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> implements RevClientObject {
    readonly canvas: RevCanvas<BGS>;
    readonly focus: RevFocus<BGS, BCS, SF>;
    readonly selection: RevSelection<BGS, BCS, SF>;
    readonly columnsManager: RevColumnsManager<BCS, SF>;
    readonly subgridsManager: RevSubgridsManager<BCS, SF>;
    readonly viewLayout: RevViewLayout<BGS, BCS, SF>;
    readonly renderer: RevRenderer<BGS, BCS, SF>;
    readonly mouse: RevMouse<BGS, BCS, SF>;

    readonly horizontalScroller: RevScroller;
    readonly verticalScroller: RevScroller;

    constructor(
        readonly clientId: string,
        readonly internalParent: RevClientObject,
        gridSettings: BGS,
        canvasElement: HTMLCanvasElement,
        schemaServer: RevSchemaServer<SF>,
        subgridDefinitions: RevSubgrid.Definition<BCS, SF>[],
        canvasOverlayElement: HTMLElement | undefined,
        canvasRenderingContext2DSettings: CanvasRenderingContext2DSettings | undefined,
        scrollerCreateFns: RevScroller.CreateFn<BGS, BCS, SF>[] | undefined,
        getSettingsForNewColumnEventer: RevColumnsManager.GetSettingsForNewColumnEventer<BCS, SF>,
    ) {
        // this.gridSettings = new AbstractMergableGridSettings();
        // this.gridSettings.loadDefaults();
        // if (optionedGridSettings !== undefined) {
        //     this.gridSettings.merge(optionedGridSettings);
        // }

        this.canvas = new RevCanvas(
            this.clientId,
            this,
            canvasElement,
            canvasOverlayElement,
            canvasRenderingContext2DSettings,
            gridSettings,
        );

        this.columnsManager = new RevColumnsManager<BCS, SF>(
            this.clientId,
            this,
            schemaServer,
            gridSettings,
            getSettingsForNewColumnEventer,
        );

        if  (subgridDefinitions.length === 0) {
            throw new RevAssertError('CBM43330', 'Adapter set missing Subgrid specs');
        } else {
            this.subgridsManager = new RevSubgridsManager(
                this.clientId,
                this,
                gridSettings,
                this.columnsManager,
                subgridDefinitions,
            );

            this.viewLayout = new RevViewLayout(
                this.clientId,
                this,
                gridSettings,
                this.canvas,
                this.columnsManager,
                this.subgridsManager,
            );

            this.focus = new RevFocus(
                this.clientId,
                this,
                gridSettings,
                this.canvas,
                this.subgridsManager.mainSubgrid,
                this.columnsManager,
                this.viewLayout,
            );

            this.selection = new RevSelection(
                this.clientId,
                this,
                gridSettings,
                this.columnsManager,
                this.subgridsManager,
                this.focus,
            );

            this.mouse = new RevMouse(
                this.clientId,
                this,
                gridSettings,
                this.canvas,
                this.viewLayout,
            );

            this.renderer = new RevRenderer(
                this.clientId,
                this,
                gridSettings,
                this.canvas,
                this.columnsManager,
                this.subgridsManager,
                this.viewLayout,
                this.focus,
                this.selection,
                this.mouse,
            );

            if (scrollerCreateFns === undefined) {
                this.verticalScroller = new RevStandardScroller(
                    this.clientId,
                    this,
                    gridSettings,
                    this.canvas.overlayElement,
                    this.canvas,
                    this.viewLayout.verticalScrollDimension,
                    'vertical',
                    true,
                    undefined,
                );

                this.horizontalScroller = new RevStandardScroller(
                    this.clientId,
                    this,
                    gridSettings,
                    this.canvas.overlayElement,
                    this.canvas,
                    this.viewLayout.horizontalScrollDimension,
                    'horizontal',
                    true,
                    this.verticalScroller,
                );
            } else {
                if (scrollerCreateFns.length !== 2) {
                    throw new RevOptionsError('CMCSC43230', `Invalid number of scroller create functions: ${scrollerCreateFns.length}`);
                } else {
                    const spaceAccommodatedScroller = this.horizontalScroller = scrollerCreateFns[0](
                        this.clientId,
                        this,
                        gridSettings,
                        this.canvas,
                        this.viewLayout.horizontalScrollDimension,
                        this.viewLayout,
                        undefined,
                    );
                    const spaceRelinquishingScroller = this.horizontalScroller = scrollerCreateFns[1](
                        this.clientId,
                        this,
                        gridSettings,
                        this.canvas,
                        this.viewLayout.horizontalScrollDimension,
                        this.viewLayout,
                        spaceAccommodatedScroller,
                    );

                    switch (spaceAccommodatedScroller.axis) {
                        case 'horizontal':
                            this.horizontalScroller = spaceAccommodatedScroller;
                            if (spaceRelinquishingScroller.axis !== 'vertical') {
                                throw new RevOptionsError('CMCSC43231', `Mismatched scroller axes: ${spaceRelinquishingScroller.axis} cannot accompany horizontal scroller`);
                            } else {
                                this.verticalScroller = spaceRelinquishingScroller;
                            }
                            break;
                        case 'vertical':
                            this.verticalScroller = spaceAccommodatedScroller;
                            if (spaceRelinquishingScroller.axis !== 'horizontal') {
                                throw new RevOptionsError('CMCSC43232', `Mismatched scroller axes: ${spaceRelinquishingScroller.axis} cannot accompany vertical scroller`);
                            } else {
                                this.horizontalScroller = spaceRelinquishingScroller;
                            }
                            break;
                        default:
                            throw new RevUnreachableCaseError('CMCSC43233', spaceAccommodatedScroller.axis);
                    }
                }
            }
        }
    }

    reset() {
        this.viewLayout.reset();
        this.focus.reset();
        this.mouse.reset();
        this.columnsManager.clearColumns();
    }

    /**
     * Set the header labels.
     * @param headers - The header labels. One of:
     * * _If an array:_ Must contain all headers in column order.
     * * _If a hash:_ May contain any headers, keyed by field name, in any order.
     */
    // setHeaders(headers: string[] | Record<string, string>) {
    //     if (headers instanceof Array) {
    //         // Reset all headers
    //         const allColumns = this._allColumns;
    //         headers.forEach((header, index) => {
    //             allColumns[index].header = header; // setter updates header in both column and data source objects
    //         });
    //     } else if (typeof headers === 'object') {
    //         // Adjust just the headers in the hash
    //         this._allColumns.forEach((column) => {
    //             if (headers[column.name]) {
    //                 column.header = headers[column.name];
    //             }
    //         });
    //     }
    // }

    destroy() {
        this.renderer.stop();
        this.canvas.stop();
        this.horizontalScroller.destroy();
        this.verticalScroller.destroy();
        this.renderer.destroy();
        this.selection.destroy();
        this.subgridsManager.destroy();
    }

    getViewValue(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>) {
        const column = this.columnsManager.getActiveColumn(activeColumnIndex);
        const field = column.field;
        const dataServer = subgrid.dataServer;
        return dataServer.getViewValue(field, subgridRowIndex);
    }

    /**
     * Update the value at cell (x,y) with the given value.
     * @remarks When the last parameter (see `dataModel` below) is omitted, this method:
     * * Is backwards compatible to the v2 version.
     * * Does _not_ default to the data subgrid — although you can provide it explicitly (`this.behavior.dataModel`).
     * @param activeColumnIndex - The horizontal coordinate.
     * @param subgridRowIndex - The vertical coordinate.
     * @param value - New cell data.
     * @param subgrid - `x` and `y` are _data cell coordinates_ in the given subgrid data model. If If omitted, `x` and `y` are _grid cell coordinates._
     */
    setValue(activeColumnIndex: number, subgridRowIndex: number, value: RevDataServer.EditValue, subgrid: RevSubgrid<BCS, SF>) {
        const dataServer = subgrid.dataServer;
        if (dataServer.setEditValue === undefined) {
            throw new RevAssertError('BSV32220');
        } else {
            const column = this.columnsManager.getActiveColumn(activeColumnIndex);
            dataServer.setEditValue(column.field, subgridRowIndex, value);
        }
    }
}
