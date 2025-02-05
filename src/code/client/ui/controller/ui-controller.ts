
import { RevClientObject, RevSchemaField } from '../../../common/internal-api';
import { RevCellPropertiesBehavior } from '../../behavior/cell-properties-behavior';
import { RevDataExtractBehavior } from '../../behavior/data-extract-behavior';
import { RevEventBehavior } from '../../behavior/event-behavior';
import { RevFocusScrollBehavior } from '../../behavior/focus-scroll-behavior';
import { RevFocusSelectBehavior } from '../../behavior/focus-select-behavior';
import { RevReindexBehavior } from '../../behavior/reindex-behavior';
import { RevRowPropertiesBehavior } from '../../behavior/row-properties-behavior';
import { RevCanvas } from '../../components/canvas/canvas';
import { RevColumnsManager } from '../../components/column/columns-manager';
import { RevFocus } from '../../components/focus/focus';
import { RevMouse } from '../../components/mouse/mouse';
import { RevRenderer } from '../../components/renderer/renderer';
import { RevScroller } from '../../components/scroller/scroller';
import { RevSelection } from '../../components/selection/selection';
import { RevSubgridsManager } from '../../components/subgrid/subgrids-manager';
import { RevViewLayout } from '../../components/view/view-layout';
import { RevLinedHoverCell } from '../../interfaces/lined-hover-cell';
import { RevMainSubgrid } from '../../interfaces/main-subgrid';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevGridSettings } from '../../settings/internal-api';
import { RevUiControllerServices, RevUiControllerSharedState } from './common/internal-api';

/**
 * Instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 * @public
 */
export abstract class RevUiController<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> implements RevClientObject {
    readonly clientId: string;
    readonly internalParent: RevClientObject;

    abstract readonly typeName: string;

    protected readonly _sharedState: RevUiControllerSharedState;
    protected readonly _hostElement: HTMLElement;

    protected readonly _gridSettings: RevGridSettings;
    protected readonly _canvas: RevCanvas<BGS>;
    protected readonly _selection: RevSelection<BGS, BCS, SF>;
    protected readonly _focus: RevFocus<BGS, BCS, SF>;
    protected readonly _columnsManager: RevColumnsManager<BCS, SF>;
    protected readonly _subgridsManager: RevSubgridsManager<BCS, SF>;
    protected readonly _viewLayout: RevViewLayout<BGS, BCS, SF>;
    protected readonly _renderer: RevRenderer<BGS, BCS, SF>;
    protected readonly _reindexBehavior: RevReindexBehavior<BGS, BCS, SF>;

    protected readonly _mouse: RevMouse<BGS, BCS, SF>;
    protected readonly _horizontalScroller: RevScroller<BGS, BCS, SF>;
    protected readonly _verticalScroller: RevScroller<BGS, BCS, SF>;

    protected readonly _focusScrollBehavior: RevFocusScrollBehavior<BGS, BCS, SF>;
    protected readonly _focusSelectBehavior: RevFocusSelectBehavior<BGS, BCS, SF>;
    protected readonly _rowPropertiesBehavior: RevRowPropertiesBehavior<BGS, BCS, SF>;
    protected readonly _cellPropertiesBehavior: RevCellPropertiesBehavior<BGS, BCS, SF>;
    protected readonly _dataExtractBehavior: RevDataExtractBehavior<BGS, BCS, SF>;
    protected readonly _eventBehavior: RevEventBehavior<BGS, BCS, SF>;

    protected readonly _mainSubgrid: RevMainSubgrid<BCS, SF>;

    constructor(services: RevUiControllerServices<BGS, BCS, SF>) {
        this.clientId = services.clientId;
        this.internalParent = services.internalParent;

        this._sharedState = services.sharedState;
        this._hostElement = services.hostElement;

        this._gridSettings = services.gridSettings;
        this._canvas = services.canvas;
        this._selection = services.selection;
        this._focus = services.focus;
        this._columnsManager = services.columnsManager;
        this._subgridsManager = services.subgridsManager;
        this._viewLayout = services.viewLayout;
        this._renderer = services.renderer;
        this._reindexBehavior = services.reindexBehavior;

        this._mouse = services.mouse;
        this._horizontalScroller = services.horizontalScroller;
        this._verticalScroller = services.verticalScroller;

        this._focusScrollBehavior = services.focusScrollBehavior;
        this._focusSelectBehavior = services.focusSelectBehavior;
        this._rowPropertiesBehavior = services.rowPropertiesBehavior;
        this._cellPropertiesBehavior = services.cellPropertiesBehavior;
        this._dataExtractBehavior = services.dataExtractBehavior;
        this._eventBehavior = services.eventBehavior;

        this._mainSubgrid = this._subgridsManager.mainSubgrid;
    }

    /**
     * the next feature to be given a chance to handle incoming events
     */
    next: RevUiController<BGS, BCS, SF> | undefined;

    /**
     * a temporary holding field for my next feature when I'm in a disconnected state
     */
    detached: RevUiController<BGS, BCS, SF> | undefined;

    /**
     * set my next field, or if it's populated delegate to the feature in my next field
     * @param nextFeature - this is how we build the chain of responsibility
     */
    setNext(nextFeature: RevUiController<BGS, BCS, SF>) {
        if (this.next !== undefined) {
            this.next.setNext(nextFeature);
        } else {
            this.next = nextFeature;
            this.detached = nextFeature;
        }
    }

    /**
     * disconnect my child
     */
    detachChain() {
        this.next = undefined;
    }

    /**
     * reattach my child from the detached reference
     */
    attachChain() {
        this.next = this.detached;
    }

    /** @internal */
    handleKeyDown(event: KeyboardEvent, fromEditor: boolean) {
        if (this.next) {
            this.next.handleKeyDown(event, fromEditor);
        // } else {
        //     return true;
        }
    }

    /** @internal */
    handleKeyUp(event: KeyboardEvent) {
        if (this.next) {
            this.next.handleKeyUp(event);
        }
    }

    /** @internal */
    handlePointerMove(event: PointerEvent, hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined): RevLinedHoverCell<BCS, SF> | null | undefined {
        if (this.next) {
            return this.next.handlePointerMove(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handlePointerLeaveOut(event: PointerEvent, hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined): RevLinedHoverCell<BCS, SF> | null | undefined {
        if (this.next) {
            return this.next.handlePointerLeaveOut(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handlePointerEnter(event: PointerEvent, hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined): RevLinedHoverCell<BCS, SF> | null | undefined {
        if (this.next) {
            return this.next.handlePointerEnter(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handlePointerDown(event: PointerEvent, hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined): RevLinedHoverCell<BCS, SF> | null | undefined {
        if (this.next) {
            return this.next.handlePointerDown(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handlePointerUpCancel(event: PointerEvent, hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined): RevLinedHoverCell<BCS, SF> | null | undefined {
        if (this.next) {
            return this.next.handlePointerUpCancel(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handleWheelMove(event: WheelEvent, hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined): RevLinedHoverCell<BCS, SF> | null | undefined {
        if (this.next) {
            return this.next.handleWheelMove(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handleDblClick(event: MouseEvent, hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined): RevLinedHoverCell<BCS, SF> | null | undefined {
        if (this.next) {
            return this.next.handleDblClick(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handleClick(event: MouseEvent, hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined): RevLinedHoverCell<BCS, SF> | null | undefined {
        if (this.next) {
            return this.next.handleClick(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handlePointerDragStart(event: DragEvent, hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined): RevEventBehavior.UiPointerDragStartResult<BCS, SF> {
        if (this.next) {
            return this.next.handlePointerDragStart(event, hoverCell);
        } else {
            return {
                started: false,
                hoverCell,
            };
        }
    }

    /** @internal */
    handlePointerDrag(event: PointerEvent, hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined): RevLinedHoverCell<BCS, SF> | null | undefined {
        if (this.next) {
            return this.next.handlePointerDrag(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handlePointerDragEnd(event: PointerEvent, hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined): RevLinedHoverCell<BCS, SF> | null | undefined {
        if (this.next) {
            return this.next.handlePointerDragEnd(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handleContextMenu(event: MouseEvent, hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined): RevLinedHoverCell<BCS, SF> | null | undefined {
        if (this.next) {
            return this.next.handleContextMenu(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handleTouchStart(eventDetail: TouchEvent) {
        if (this.next) {
            this.next.handleTouchStart(eventDetail);
        }
    }

    /** @internal */
    handleTouchMove(eventDetail: TouchEvent) {
        if (this.next) {
            this.next.handleTouchMove(eventDetail);
        }
    }

    /** @internal */
    handleTouchEnd(eventDetail: TouchEvent) {
        if (this.next) {
            this.next.handleTouchEnd(eventDetail);
        }
    }

    /** @internal */
    handleCopy(eventDetail: ClipboardEvent) {
        if (this.next) {
            this.next.handleCopy(eventDetail);
        }
    }

    /** @internal */
    handleHorizontalScrollerAction(action: RevScroller.Action) {
        if (this.next) {
            this.next.handleHorizontalScrollerAction(action);
        }
    }

    /** @internal */
    handleVerticalScrollerAction(action: RevScroller.Action) {
        if (this.next) {
            this.next.handleVerticalScrollerAction(action);
        }
    }

    /** @internal */
    initialise() {
        if (this.next) {
            this.next.initialise();
        }
    }

    /** @internal */
    protected tryGetHoverCellFromMouseEvent(event: MouseEvent): RevLinedHoverCell<BCS, SF> | undefined {
        return this._viewLayout.findLinedHoverCellAtCanvasOffset(event.offsetX, event.offsetY);
    }
}

/** @public */
export namespace RevUiController {
    export type Constructor<
        BGS extends RevBehavioredGridSettings,
        BCS extends RevBehavioredColumnSettings,
        SF extends RevSchemaField
    > = new (services: RevUiControllerServices<BGS, BCS, SF>) => RevUiController<BGS, BCS, SF>;

    export interface Definition<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
        typeName: string;
        constructor: Constructor<BGS, BCS, SF>;
    }
}
