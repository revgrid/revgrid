
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
import { RevLinedHoverCell } from '../../interfaces/data/lined-hover-cell';
import { RevMainSubgrid } from '../../interfaces/data/main-subgrid';
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

    protected readonly sharedState: RevUiControllerSharedState;
    protected readonly hostElement: HTMLElement;

    protected readonly gridSettings: RevGridSettings;
    protected readonly canvas: RevCanvas<BGS>;
    protected readonly selection: RevSelection<BGS, BCS, SF>;
    protected readonly focus: RevFocus<BGS, BCS, SF>;
    protected readonly columnsManager: RevColumnsManager<BCS, SF>;
    protected readonly subgridsManager: RevSubgridsManager<BCS, SF>;
    protected readonly viewLayout: RevViewLayout<BGS, BCS, SF>;
    protected readonly renderer: RevRenderer<BGS, BCS, SF>;
    protected readonly reindexBehavior: RevReindexBehavior<BGS, BCS, SF>;

    protected readonly mouse: RevMouse<BGS, BCS, SF>;
    protected readonly horizontalScroller: RevScroller<BGS, BCS, SF>;
    protected readonly verticalScroller: RevScroller<BGS, BCS, SF>;

    protected readonly focusScrollBehavior: RevFocusScrollBehavior<BGS, BCS, SF>;
    protected readonly focusSelectBehavior: RevFocusSelectBehavior<BGS, BCS, SF>;
    protected readonly rowPropertiesBehavior: RevRowPropertiesBehavior<BGS, BCS, SF>;
    protected readonly cellPropertiesBehavior: RevCellPropertiesBehavior<BGS, BCS, SF>;
    protected readonly dataExtractBehavior: RevDataExtractBehavior<BGS, BCS, SF>;
    protected readonly eventBehavior: RevEventBehavior<BGS, BCS, SF>;

    protected readonly mainSubgrid: RevMainSubgrid<BCS, SF>;

    constructor(services: RevUiControllerServices<BGS, BCS, SF>) {
        this.clientId = services.clientId;
        this.internalParent = services.internalParent;

        this.sharedState = services.sharedState;
        this.hostElement = services.hostElement;

        this.gridSettings = services.gridSettings;
        this.canvas = services.canvas;
        this.selection = services.selection;
        this.focus = services.focus;
        this.columnsManager = services.columnsManager;
        this.subgridsManager = services.subgridsManager;
        this.viewLayout = services.viewLayout;
        this.renderer = services.renderer;
        this.reindexBehavior = services.reindexBehavior;

        this.mouse = services.mouse;
        this.horizontalScroller = services.horizontalScroller;
        this.verticalScroller = services.verticalScroller;

        this.focusScrollBehavior = services.focusScrollBehavior;
        this.focusSelectBehavior = services.focusSelectBehavior;
        this.rowPropertiesBehavior = services.rowPropertiesBehavior;
        this.cellPropertiesBehavior = services.cellPropertiesBehavior;
        this.dataExtractBehavior = services.dataExtractBehavior;
        this.eventBehavior = services.eventBehavior;

        this.mainSubgrid = this.subgridsManager.mainSubgrid;
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
        return this.viewLayout.findLinedHoverCellAtCanvasOffset(event.offsetX, event.offsetY);
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
