import { Subgrid } from '../interfaces/data/subgrid';
import { SchemaServer } from '../interfaces/schema/schema-server';
import { GridSettings } from '../interfaces/settings/grid-settings';
import { MergableGridSettingsImplementation } from '../settings/mergable-grid-settings-implementation';
import { AssertError } from '../types-utils/revgrid-error';
import { CanvasManager } from './canvas/canvas-manager';
import { ColumnsManager } from './column/columns-manager';
import { Focus } from './focus/focus';
import { Mouse } from './mouse/mouse';
import { Renderer } from './renderer/renderer';
import { Scroller } from './scroller/scroller';
import { Selection } from './selection/selection';
import { SubgridsManager } from './subgrid/subgrids-manager';
import { ViewLayout } from './view/view-layout';

/** @internal */
export class ComponentsManager {
    readonly gridSettings: MergableGridSettingsImplementation;
    readonly canvasManager: CanvasManager;
    readonly focus: Focus;
    readonly selection: Selection;
    readonly columnsManager: ColumnsManager;
    readonly subgridsManager: SubgridsManager;
    readonly viewLayout: ViewLayout;
    readonly renderer: Renderer;
    readonly mouse: Mouse;

    readonly horizontalScroller: Scroller;
    readonly verticalScroller: Scroller;

    constructor(
        containerHtmlElement: HTMLElement,
        schemaServer: SchemaServer,
        subgridDefinitions: Subgrid.Definition[],
        canvasContextAttributes: CanvasRenderingContext2DSettings | undefined,
        optionedGridSettings: Partial<GridSettings> | undefined,
        loadBuiltinFinbarStylesheet: boolean,
    ) {
        this.gridSettings = new MergableGridSettingsImplementation();
        this.gridSettings.loadDefaults();
        if (optionedGridSettings !== undefined) {
            this.gridSettings.merge(optionedGridSettings);
        }

        this.canvasManager = new CanvasManager(
            containerHtmlElement,
            canvasContextAttributes,
            this.gridSettings,
        );

        this.columnsManager = new ColumnsManager(
            schemaServer,
            this.gridSettings,
        );

        if  (subgridDefinitions.length === 0) {
            throw new AssertError('CBM43330', 'Adapter set missing Subgrid specs');
        } else {
            this.subgridsManager = new SubgridsManager(
                this.gridSettings,
                this.columnsManager,
                subgridDefinitions,
            );

            this.viewLayout = new ViewLayout(
                this.gridSettings,
                this.canvasManager,
                this.columnsManager,
                this.subgridsManager,
            );

            this.focus = new Focus(
                this.gridSettings,
                this.subgridsManager.mainSubgrid,
                this.columnsManager,
                this.viewLayout,
            );

            this.selection = new Selection(
                this.gridSettings,
                this.columnsManager,
            );

            this.mouse = new Mouse(
                this.canvasManager,
                this.viewLayout,
            );

            this.renderer = new Renderer(
                this.gridSettings,
                this.canvasManager,
                this.columnsManager,
                this.subgridsManager,
                this.viewLayout,
                this.focus,
                this.selection,
                this.mouse,
            );

            this.verticalScroller = new Scroller(
                this.viewLayout.verticalScrollDimension,
                this.canvasManager.instanceId,
                false,
                'vertical',
                true,
                1,
                this.gridSettings.wheelVFactor,
                this.gridSettings.vScrollbarClassPrefix,
                loadBuiltinFinbarStylesheet,
                containerHtmlElement,
                undefined,
            );
            containerHtmlElement.appendChild(this.verticalScroller.bar);

            this.horizontalScroller = new Scroller(
                this.viewLayout.horizontalScrollDimension,
                this.canvasManager.instanceId,
                false,
                'horizontal',
                true,
                this.gridSettings.wheelHFactor,
                1,
                this.gridSettings.hScrollbarClassPrefix,
                loadBuiltinFinbarStylesheet,
                containerHtmlElement,
                this.verticalScroller,
            );
            containerHtmlElement.appendChild(this.horizontalScroller.bar);
        }
    }

    reset() {
        this.viewLayout.reset();
        this.focus.reset();
        this.mouse.reset();
        this.columnsManager.clearColumns();
    }

    /**
     * @description Set the header labels.
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
        this.canvasManager.stop();
        this.horizontalScroller.destroy();
        this.verticalScroller.destroy();
        this.renderer.destroy();
        this.selection.destroy();
        this.subgridsManager.destroy();
    }

    getValue(x: number, y: number, subgrid: Subgrid) {
        const column = this.columnsManager.getActiveColumn(x);
        const schemaColumn = column.schemaColumn;
        const dataServer = subgrid.dataServer;
        return dataServer.getValue(schemaColumn, y);
    }

    /**
     * @summary Update the value at cell (x,y) with the given value.
     * @desc When the last parameter (see `dataModel` below) is omitted, this method:
     * * Is backwards compatible to the v2 version.
     * * Does _not_ default to the data subgrid — although you can provide it explicitly (`this.behavior.dataModel`).
     * @param x - The horizontal coordinate.
     * @param y - The vertical coordinate.
     * @param value - New cell data.
     * @param subgrid - `x` and `y` are _data cell coordinates_ in the given subgrid data model. If If omitted, `x` and `y` are _grid cell coordinates._
     */
    setValue(x: number, y: number, value: unknown, subgrid: Subgrid) {
        const dataServer = subgrid.dataServer;
        if (dataServer.setValue === undefined) {
            throw new AssertError('BSV32220');
        } else {
            const column = this.columnsManager.getActiveColumn(x);
            dataServer.setValue(column.schemaColumn, y, value);
        }
    }
}
