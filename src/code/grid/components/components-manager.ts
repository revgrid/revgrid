import { Subgrid } from '../interfaces/data/subgrid';
import { SchemaField } from '../interfaces/schema/schema-field';
import { SchemaServer } from '../interfaces/schema/schema-server';
import { BehavioredColumnSettings } from '../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../interfaces/settings/behaviored-grid-settings';
import { CssTypes } from '../types-utils/css-types';
import { AssertError } from '../types-utils/revgrid-error';
import { RevgridObject } from '../types-utils/revgrid-object';
import { Canvas } from './canvas/canvas';
import { ColumnsManager } from './column/columns-manager';
import { Focus } from './focus/focus';
import { Mouse } from './mouse/mouse';
import { Renderer } from './renderer/renderer';
import { Scroller } from './scroller/scroller';
import { Selection } from './selection/selection';
import { SubgridsManager } from './subgrid/subgrids-manager';
import { ViewLayout } from './view/view-layout';

/** @internal */
export class ComponentsManager<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> implements RevgridObject {
    readonly canvas: Canvas<BGS>;
    readonly focus: Focus<BGS, BCS, SF>;
    readonly selection: Selection<BGS, BCS, SF>;
    readonly columnsManager: ColumnsManager<BCS, SF>;
    readonly subgridsManager: SubgridsManager<BCS, SF>;
    readonly viewLayout: ViewLayout<BGS, BCS, SF>;
    readonly renderer: Renderer<BGS, BCS, SF>;
    readonly mouse: Mouse<BGS, BCS, SF>;

    readonly horizontalScroller: Scroller<BGS, BCS, SF>;
    readonly verticalScroller: Scroller<BGS, BCS, SF>;

    constructor(
        readonly revgridId: string,
        readonly internalParent: RevgridObject,
        gridSettings: BGS,
        hostElement: HTMLElement,
        schemaServer: SchemaServer<SF>,
        subgridDefinitions: Subgrid.Definition<BCS, SF>[],
        canvasOverflowOverride: CssTypes.Overflow | undefined,
        canvasRenderingContext2DSettings: CanvasRenderingContext2DSettings | undefined,
        getSettingsForNewColumnEventer: ColumnsManager.GetSettingsForNewColumnEventer<BCS, SF>,
    ) {
        // this.gridSettings = new AbstractMergableGridSettings();
        // this.gridSettings.loadDefaults();
        // if (optionedGridSettings !== undefined) {
        //     this.gridSettings.merge(optionedGridSettings);
        // }

        this.canvas = new Canvas(
            this.revgridId,
            this,
            hostElement,
            canvasOverflowOverride,
            canvasRenderingContext2DSettings,
            gridSettings,
        );

        this.columnsManager = new ColumnsManager<BCS, SF>(
            this.revgridId,
            this,
            schemaServer,
            gridSettings,
            getSettingsForNewColumnEventer,
        );

        if  (subgridDefinitions.length === 0) {
            throw new AssertError('CBM43330', 'Adapter set missing Subgrid specs');
        } else {
            this.subgridsManager = new SubgridsManager(
                this.revgridId,
                this,
                gridSettings,
                this.columnsManager,
                subgridDefinitions,
            );

            this.viewLayout = new ViewLayout(
                this.revgridId,
                this,
                gridSettings,
                this.canvas,
                this.columnsManager,
                this.subgridsManager,
            );

            this.focus = new Focus(
                this.revgridId,
                this,
                gridSettings,
                this.canvas,
                this.subgridsManager.mainSubgrid,
                this.columnsManager,
                this.viewLayout,
            );

            this.selection = new Selection(
                this.revgridId,
                this,
                gridSettings,
                this.columnsManager,
                this.focus,
            );

            this.mouse = new Mouse(
                this.revgridId,
                this,
                this.canvas,
                this.viewLayout,
            );

            this.renderer = new Renderer(
                this.revgridId,
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

            this.verticalScroller = new Scroller(
                this.revgridId,
                this,
                gridSettings,
                hostElement,
                this.canvas,
                this.viewLayout.verticalScrollDimension,
                this.viewLayout,
                'vertical',
                true,
                undefined,
            );

            this.horizontalScroller = new Scroller(
                this.revgridId,
                this,
                gridSettings,
                hostElement,
                this.canvas,
                this.viewLayout.horizontalScrollDimension,
                this.viewLayout,
                'horizontal',
                true,
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
        this.canvas.stop();
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
