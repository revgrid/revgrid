import { ViewCell } from '../components/cell/view-cell';
import { Subgrid } from '../components/subgrid/subgrid';
import { GridSettings } from '../interfaces/grid-settings';
import { SchemaModel } from '../interfaces/schema-model';
import { AdapterSetConfig } from './component/adapter-set-config';
import { ComponentBehaviorManager } from './component/component-behavior-manager';
import { EventBehavior } from './component/event-behavior';
import { UiBehaviorManager } from './ui/ui-behavior-manager';

/** @internal */
export class BehaviorManager {
    private readonly _componentBehaviorManager: ComponentBehaviorManager;
    private readonly _uiBehaviorManager: UiBehaviorManager;
    // Start RowProperties Mixin
    /** @internal */
    // private _height: number;
    // defaultRowHeight: number;
    // End RowProperties Mixin

    // Start DataModel Mixin
    // allColumns: Behavior.ColumnArray;
    // End DataModel Mixin

    // Start RowProperties Mixin
    // get height() {
    //     return this._height || this.defaultRowHeight;
    // }
    // set height(height: number) {
    //     height = Math.max(5, Math.ceil(height));
    //     if (isNaN(height)) {
    //         height = undefined;
    //     }
    //     if (height !== this._height) {
    //         this._height = height; // previously set as not enumerable
    //         this.grid.behaviorStateChanged();
    //     }
    // }
    // End RowProperties Mixin

    constructor(
        containerHtmlElement: HTMLElement,
        canvasContextAttributes: CanvasRenderingContext2DSettings | undefined,
        optionedGridProperties: Partial<GridSettings> | undefined,
        adapterSetConfig: AdapterSetConfig,
        loadBuiltinFinbarStylesheet: boolean,
        descendantEventer: EventBehavior.DescendantEventer,
    ) {
        this._componentBehaviorManager = new ComponentBehaviorManager(
            containerHtmlElement,
            canvasContextAttributes,
            optionedGridProperties,
            adapterSetConfig,
            loadBuiltinFinbarStylesheet,
            descendantEventer,
        );

        this._uiBehaviorManager = new UiBehaviorManager(
            containerHtmlElement,
            this._componentBehaviorManager.gridSettings,
            this._componentBehaviorManager.canvasManager,
            this._componentBehaviorManager.focus,
            this._componentBehaviorManager.selection,
            this._componentBehaviorManager.columnsManager,
            this._componentBehaviorManager.subgridsManager,
            this._componentBehaviorManager.viewLayout,
            this._componentBehaviorManager.renderer,
            this._componentBehaviorManager.reindexStashManager,
            this._componentBehaviorManager.mouse,
            this._componentBehaviorManager.focusScrollBehavior,
            this._componentBehaviorManager.focusSelectBehavior,
            this._componentBehaviorManager.rowPropertiesBehavior,
            this._componentBehaviorManager.cellPropertiesBehavior,
            this._componentBehaviorManager.dataExtractBehavior,
            this._componentBehaviorManager.eventBehavior,
        );
    }

    get gridProperties() { return this._componentBehaviorManager.gridSettings; }
    get focus() { return this._componentBehaviorManager.focus; }
    get selection() { return this._componentBehaviorManager.selection; }
    get canvasManager() { return this._componentBehaviorManager.canvasManager; }
    get mouse() { return this._componentBehaviorManager.mouse; }
    get mainSubgrid() { return this._componentBehaviorManager.mainSubgrid; }
    get mainDataModel() { return this._componentBehaviorManager.mainDataModel; }
    get columnsManager() { return this._componentBehaviorManager.columnsManager; }
    get subgridsManager() { return this._componentBehaviorManager.subgridsManager; }
    get viewLayout() { return this._componentBehaviorManager.viewLayout; }
    get renderer() { return this._componentBehaviorManager.renderer; }

    get focusScrollBehavior() { return this._componentBehaviorManager.focusScrollBehavior; }
    get focusSelectBehavior() { return this._componentBehaviorManager.focusSelectBehavior; }
    get rowPropertiesBehavior() { return this._componentBehaviorManager.rowPropertiesBehavior; }
    get cellPropertiesBehavior() { return this._componentBehaviorManager.cellPropertiesBehavior; }
    get userInterfaceInputBehavior() { return this._componentBehaviorManager.mouse; }

    reset() {
        this._componentBehaviorManager.reset();
    }

    destroy() {
        this._componentBehaviorManager.destroy();
    }

    allowEvents(allow: boolean) {
        if (allow){
            this._uiBehaviorManager.enable();
        } else {
            this._uiBehaviorManager.disable();
        }
        this._componentBehaviorManager.allowEvents(allow);
    }

    addSettings(settings: Partial<GridSettings>) {
        return this._componentBehaviorManager.addSettings(settings);
    }


    clearObjectProperties(obj: Record<string, unknown>, exportProps?: boolean) {
        this._componentBehaviorManager.clearObjectProperties(obj, exportProps);
    }

    getState() {
        return this._componentBehaviorManager.getState();
    }

    setState(properties: Record<string, unknown>) {
        this._componentBehaviorManager.setState(properties);
    }

    addState(settings: Record<string, unknown>, fromDefault: boolean) {
        this._componentBehaviorManager.addState(settings, fromDefault);
    }

    endDragColumnNotification() {
        this._componentBehaviorManager.endDragColumnNotification();
    }

    getCellEditorAt(cell: ViewCell) {
        return this._componentBehaviorManager.getCellEditorAt(cell);
    }

    highlightCellOnHover(isColumnHovered: boolean, isRowHovered: boolean): boolean {
        return this._componentBehaviorManager.highlightCellOnHover(isColumnHovered, isRowHovered);
    }

    getValue(x: number, y: number, subgrid: Subgrid | undefined) {
        return this._componentBehaviorManager.getValue(x, y, subgrid);
    }

    setValue(schemaColumn: SchemaModel.Column, x: number, y: number, value: unknown, subgrid?: Subgrid) {
        this._componentBehaviorManager.setValue(schemaColumn, x, y, value, subgrid);
    }

    lookupFeature(key: string) {
        return this._uiBehaviorManager.lookupFeature(key);
    }

}
