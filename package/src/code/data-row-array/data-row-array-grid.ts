import { Integer } from '@pbkware/js-utils';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevClientGrid, RevGridDefinition, RevGridOptions } from '../client/internal-api';
import { RevColumnLayoutGrid } from '../column-layout/internal-api';
import { RevColumnLayout } from '../column-layout/server/internal-api';
import { RevDataServer } from '../common/internal-api';
import {
    RevDataRowArrayDataServer,
    RevDataRowArrayField,
    RevDataRowArraySchemaServer,
} from './server/internal-api';

/** @public */
export class RevDataRowArrayGrid<
    BGS extends RevBehavioredGridSettings,
    BCS extends RevBehavioredColumnSettings,
    SF extends RevDataRowArrayField
> extends RevColumnLayoutGrid<BGS, BCS, SF> {
    declare schemaServer: RevDataRowArraySchemaServer<SF>;
    declare mainDataServer: RevDataRowArrayDataServer<SF>;
    readonly headerDataServer: RevDataServer<SF> | undefined;

    private _allowedFields: readonly SF[] | undefined;

    private _beenUsable = false;
    private _usableRendered = false;
    private _firstUsableRenderViewAnchor: RevDataRowArrayGrid.ViewAnchor | undefined;

    constructor(
        gridHostElement: HTMLElement,
        definition: RevGridDefinition<BCS, SF>,
        settings: BGS,
        getSettingsForNewColumnEventer: RevClientGrid.GetSettingsForNewColumnEventer<BCS, SF>,
        options?: RevGridOptions<BGS, BCS, SF>,
    ) {
        super(gridHostElement, definition, settings, getSettingsForNewColumnEventer, options);

        const subgridsManager = this.subgridsManager;
        const headerSubgrid = subgridsManager.headerSubgrid;
        if (headerSubgrid !== undefined) {
            this.headerDataServer = headerSubgrid.dataServer;
        }
    }

    get data() { return this.mainDataServer.data; }

    get fieldCount() { return this.schemaServer.fieldCount; }
    get fieldNames() { return this.schemaServer.getFields(); }
    get allowedFields() { return this._allowedFields; }

    get beenUsable() { return this._beenUsable; }

    get recordFocused() { return this.focus.current !== undefined; }

    get focusedRecordIndex(): Integer | undefined {
        return this.focus.currentY;
    }

    get mainRowCount(): number { return this.mainDataServer.getRowCount(); }
    get headerRowCount(): number { return this.headerDataServer === undefined ? 0 : this.headerDataServer.getRowCount(); }
    get gridRightAligned(): boolean { return this.settings.gridRightAligned; }
    get rowHeight(): number { return this.settings.defaultRowHeight; }

    resetUsable() {
        this._usableRendered = false;
        this._beenUsable = false;
    }

    initialiseAllowedFields(fields: readonly SF[]) {
        this.resetUsable();
        this._allowedFields = fields;
    }

    applyFirstUsable(viewAnchor: RevDataRowArrayGrid.ViewAnchor | undefined, columnLayout: RevColumnLayout | undefined) {
        this._beenUsable = true;

        this._firstUsableRenderViewAnchor = viewAnchor;

        if (columnLayout !== undefined) {
            this.updateColumnLayout(columnLayout);
        }
    }

    updateAllowedFields(fields: readonly SF[]) {
        this._allowedFields = fields;
        if (this.columnLayout !== undefined) {
            this.setActiveColumnsAndWidths();
        }
    }

    getViewAnchor(): RevDataRowArrayGrid.ViewAnchor | undefined {
        if (this._usableRendered) {
            const viewLayout = this.viewLayout;
            return {
                rowScrollAnchorIndex: viewLayout.rowScrollAnchorIndex,
                columnScrollAnchorIndex: viewLayout.columnScrollAnchorIndex,
                columnScrollAnchorOffset: viewLayout.columnScrollAnchorOffset,
            };
        } else {
            return undefined;
        }
    }

    getFieldByName(fieldName: string): SF {
        return this.schemaServer.getFieldByName(fieldName);
    }

    getField(fieldIndex: Integer): SF {
        return this.schemaServer.getField(fieldIndex);
    }

    isHeaderRow(rowIndex: number): boolean {
        return rowIndex > this.headerRowCount;
    }

    override reset(): void {
        this.resetUsable();
        super.reset();
    }

    invalidateAll() {
        this.mainDataServer.invalidateAll();
    }

    protected override areFieldsAllowed() {
        return this._allowedFields !== undefined;
    }

    protected override isFieldNameAllowed(fieldName: string): boolean {
        const allowedFields = this._allowedFields;
        if (allowedFields === undefined) {
            return false;
        } else {
            const allowedFieldCount = allowedFields.length;
            for (let i = 0; i < allowedFieldCount; i++) {
                const field = allowedFields[i];
                if (field.name === fieldName) {
                    return true;
                }
            }
            return false;
        }
    }

    protected override descendantProcessRendered() {
        if (this._beenUsable && !this._usableRendered) {
            this._usableRendered = true;

            if (this._firstUsableRenderViewAnchor !== undefined) {
                this.viewLayout.setColumnScrollAnchor(
                    this._firstUsableRenderViewAnchor.columnScrollAnchorIndex,
                    this._firstUsableRenderViewAnchor.columnScrollAnchorOffset
                );
                this.viewLayout.setRowScrollAnchor(this._firstUsableRenderViewAnchor.rowScrollAnchorIndex, 0);
                this._firstUsableRenderViewAnchor = undefined;
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    protected convertDataValueToString(value: RevDataServer.ViewValue | string): string {
        switch (typeof value) {
            case 'string': return value;
            case 'number': return value.toString();
            case 'bigint': return value.toString();
            case 'boolean': return value.toString();
            case 'symbol': return value.toString();
            case 'undefined': return '?Undefined';
            case 'object': return '?Object';
            case 'function': return value.toString();
            default: return '?Unknown Type';
        }
    }
}

/** @public */
export namespace RevDataRowArrayGrid {
    export interface ViewAnchor {
        readonly columnScrollAnchorIndex: Integer;
        readonly columnScrollAnchorOffset: Integer;
        readonly rowScrollAnchorIndex: Integer;
    }

    // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
    export interface DataRow extends RevDataServer.ObjectViewRow {
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
        [fieldName: string]: RevDataServer.ViewValue | string; // can also have header
    }
}
