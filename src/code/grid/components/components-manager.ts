import { Subgrid } from '../interfaces/data/subgrid';
import { SchemaField } from '../interfaces/schema/schema-field';
import { SchemaServer } from '../interfaces/schema/schema-server';
import { BehavioredColumnSettings } from '../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../interfaces/settings/behaviored-grid-settings';
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
export class ComponentsManager<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> {
    readonly canvasManager: CanvasManager<BGS>;
    readonly focus: Focus<BGS, BCS, SF>;
    readonly selection: Selection<BGS, BCS, SF>;
    readonly columnsManager: ColumnsManager<BGS, BCS, SF>;
    readonly subgridsManager: SubgridsManager<BGS, BCS, SF>;
    readonly viewLayout: ViewLayout<BGS, BCS, SF>;
    readonly renderer: Renderer<BGS, BCS, SF>;
    readonly mouse: Mouse<BGS, BCS, SF>;

    readonly horizontalScroller: Scroller<BGS>;
    readonly verticalScroller: Scroller<BGS>;

    constructor(
        gridSettings: BGS,
        containerHtmlElement: HTMLElement,
        schemaServer: SchemaServer<BCS, SF>,
        subgridDefinitions: Subgrid.Definition<BCS, SF>[],
        canvasRenderingContext2DSettings: CanvasRenderingContext2DSettings | undefined,
    ) {
        // this.gridSettings = new AbstractMergableGridSettings();
        // this.gridSettings.loadDefaults();
        // if (optionedGridSettings !== undefined) {
        //     this.gridSettings.merge(optionedGridSettings);
        // }

        this.canvasManager = new CanvasManager(
            containerHtmlElement,
            canvasRenderingContext2DSettings,
            gridSettings,
        );

        this.columnsManager = new ColumnsManager<BGS, BCS, SF>(
            schemaServer,
            gridSettings,
        );

        if  (subgridDefinitions.length === 0) {
            throw new AssertError('CBM43330', 'Adapter set missing Subgrid specs');
        } else {
            this.subgridsManager = new SubgridsManager(
                gridSettings,
                this.columnsManager,
                subgridDefinitions,
            );

            this.viewLayout = new ViewLayout(
                gridSettings,
                this.canvasManager,
                this.columnsManager,
                this.subgridsManager,
            );

            this.focus = new Focus(
                gridSettings,
                this.canvasManager,
                this.subgridsManager.mainSubgrid,
                this.columnsManager,
                this.viewLayout,
            );

            this.selection = new Selection(
                gridSettings,
                this.columnsManager,
            );

            this.mouse = new Mouse(
                this.canvasManager,
                this.viewLayout,
            );

            this.renderer = new Renderer(
                gridSettings,
                this.canvasManager,
                this.columnsManager,
                this.subgridsManager,
                this.viewLayout,
                this.focus,
                this.selection,
                this.mouse,
            );

            this.verticalScroller = new Scroller(
                gridSettings,
                containerHtmlElement,
                this.viewLayout.verticalScrollDimension,
                this.canvasManager.instanceId,
                false,
                'vertical',
                true,
                1,
                gridSettings.wheelVFactor,
                gridSettings.verticalScrollbarClassPrefix,
                undefined,
            );

            this.horizontalScroller = new Scroller(
                gridSettings,
                containerHtmlElement,
                this.viewLayout.horizontalScrollDimension,
                this.canvasManager.instanceId,
                false,
                'horizontal',
                true,
                gridSettings.wheelHFactor,
                1,
                gridSettings.horizontalScrollbarClassPrefix,
                this.verticalScroller,
            );
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

    getViewValue(x: number, y: number, subgrid: Subgrid<BCS, SF>) {
        const column = this.columnsManager.getActiveColumn(x);
        const field = column.field;
        const dataServer = subgrid.dataServer;
        return dataServer.getViewValue(field, y);
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
    setValue(x: number, y: number, value: unknown, subgrid: Subgrid<BCS, SF>) {
        const dataServer = subgrid.dataServer;
        if (dataServer.setEditValue === undefined) {
            throw new AssertError('BSV32220');
        } else {
            const column = this.columnsManager.getActiveColumn(x);
            dataServer.setEditValue(column.field, y, value);
        }
    }
}
