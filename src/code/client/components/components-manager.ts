import { RevAssertError, RevClientObject, RevCssTypes, RevDataServer, RevSchemaField, RevSchemaServer } from '../../common';
import { RevSubgrid } from '../interfaces/subgrid';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings } from '../settings';
import { RevCanvas } from './canvas/canvas';
import { RevColumnsManager } from './column/columns-manager';
import { RevFocus } from './focus/focus';
import { RevMouse } from './mouse/mouse';
import { RevRenderer } from './renderer/renderer';
import { RevScroller } from './scroller/scroller';
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

    readonly horizontalScroller: RevScroller<BGS, BCS, SF>;
    readonly verticalScroller: RevScroller<BGS, BCS, SF>;

    constructor(
        readonly clientId: string,
        readonly internalParent: RevClientObject,
        gridSettings: BGS,
        hostElement: HTMLElement,
        schemaServer: RevSchemaServer<SF>,
        subgridDefinitions: RevSubgrid.Definition<BCS, SF>[],
        canvasOverflowOverride: RevCssTypes.Overflow | undefined,
        canvasRenderingContext2DSettings: CanvasRenderingContext2DSettings | undefined,
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
            hostElement,
            canvasOverflowOverride,
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
                this.focus,
            );

            this.mouse = new RevMouse(
                this.clientId,
                this,
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

            this.verticalScroller = new RevScroller(
                this.clientId,
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

            this.horizontalScroller = new RevScroller(
                this.clientId,
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

    getViewValue(x: number, y: number, subgrid: RevSubgrid<BCS, SF>) {
        const column = this.columnsManager.getActiveColumn(x);
        const field = column.field;
        const dataServer = subgrid.dataServer;
        return dataServer.getViewValue(field, y);
    }

    /**
     * Update the value at cell (x,y) with the given value.
     * @remarks When the last parameter (see `dataModel` below) is omitted, this method:
     * * Is backwards compatible to the v2 version.
     * * Does _not_ default to the data subgrid — although you can provide it explicitly (`this.behavior.dataModel`).
     * @param x - The horizontal coordinate.
     * @param y - The vertical coordinate.
     * @param value - New cell data.
     * @param subgrid - `x` and `y` are _data cell coordinates_ in the given subgrid data model. If If omitted, `x` and `y` are _grid cell coordinates._
     */
    setValue(x: number, y: number, value: RevDataServer.EditValue, subgrid: RevSubgrid<BCS, SF>) {
        const dataServer = subgrid.dataServer;
        if (dataServer.setEditValue === undefined) {
            throw new RevAssertError('BSV32220');
        } else {
            const column = this.columnsManager.getActiveColumn(x);
            dataServer.setEditValue(column.field, y, value);
        }
    }
}
