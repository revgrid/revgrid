import { DataModel } from '../../interfaces/data-model';
import { GridSettings } from '../../interfaces/grid-settings';
import { MetaModel } from '../../interfaces/meta-model';
import { SubgridInterface } from '../../interfaces/subgrid-interface';
import { AssertError } from '../../lib/revgrid-error';
import { CellModel } from '../cell/cell-model';
import { ColumnsManager } from '../column/columns-manager';
import { MainSubgrid } from './main-subgrid';
import { Subgrid } from './subgrid';
import { SubgridDefinition } from './subgrid-definition';

/** @internal */
export class SubgridsManager {
    readonly subgrids = new Array<Subgrid>();
    readonly _handledSubgrids = new Array<Subgrid | undefined>();

    private _mainSubgrid: Subgrid;

    constructor(
        private readonly _gridSettings: GridSettings,
        private readonly _columnsManager: ColumnsManager,
    ) {
    }

    get mainSubgrid() { return this._mainSubgrid; }

    getSubgridByHandle(handle: Subgrid.Handle) { return this._handledSubgrids[handle]; }

    destroy() {
        this.destroySubgrids();
    }

    loadSubgrids(definitions: readonly SubgridDefinition[]) {
        this.destroySubgrids();

        let mainSubgrid: MainSubgrid | undefined;
        const subgrids = this.subgrids;
        definitions.forEach(
            (definition) => {
                if (definition !== undefined) {
                    const subgridHandle = this._handledSubgrids.length;
                    const subgrid = this.createSubgridFromDefinition(subgridHandle, definition);
                    subgrids.push(subgrid);
                    this._handledSubgrids.push(subgrid);
                    if (subgrid.role === SubgridInterface.RoleEnum.main) {
                        mainSubgrid = subgrid as MainSubgrid;
                    }
                }
            }
        );

        if (mainSubgrid === undefined) {
            throw new AssertError('SMSS98224', 'Subgrid Specs does not include main');
        } else {
            this._mainSubgrid = mainSubgrid;
        }
    }

    /**
     * @summary Resolves a `subgridSpec` to a Subgrid (and its DataModel).
     * @desc The spec may describe either an existing data model, or a constructor for a new data model.
     * @returns either Subgrid or MainSubgrid depending on role specified in Spec
     */
    private createSubgridFromDefinition(subgridHandle: Subgrid.Handle, definition: SubgridDefinition) {
        let subgrid: Subgrid;

        if (definition.role === SubgridInterface.RoleEnum.main && this._mainSubgrid !== undefined) {
            subgrid = this._mainSubgrid;
        } else {
            const role = definition.role ?? SubgridInterface.RoleEnum.main;
            const isMainRole = role === SubgridInterface.RoleEnum.main;

            let dataModel = definition.dataModel;
            if (typeof dataModel === 'function') {
                dataModel = new dataModel();
            }
            let cellModel = definition.cellModel;
            if (typeof cellModel === 'function') {
                cellModel = new cellModel();
            }
            let metaModel = definition.metaModel;
            if (typeof metaModel === 'function') {
                metaModel = new metaModel();
            }
            let selectable = definition.selectable;
            if (selectable === undefined) {
                selectable = isMainRole;
            }
            subgrid = this.createSubgrid(subgridHandle, role, dataModel, cellModel, metaModel, selectable);
        }

        return subgrid;
    }

    /** @returns either Subgrid or MainSubgrid depending on role */
    private createSubgrid(
        subgridHandle: Subgrid.Handle,
        role: SubgridInterface.Role, dataModel: DataModel, cellModel: CellModel, metaModel: MetaModel | undefined,
        selectable: boolean,
    ) {
        let subgrid: Subgrid;
        if (role === SubgridInterface.RoleEnum.main) {
            subgrid = new MainSubgrid(
                this._gridSettings,
                this._columnsManager,
                subgridHandle,
                role,
                this._columnsManager.schemaModel,
                dataModel,
                cellModel,
                metaModel,
                selectable,
            );
        } else {
            subgrid = new Subgrid(
                this._gridSettings,
                this._columnsManager,
                subgridHandle,
                role,
                this._columnsManager.schemaModel,
                dataModel,
                cellModel,
                metaModel,
                selectable,
            );
        }

        return subgrid;
    }

    calculateRowCount() {
        const subgrids = this.subgrids;
        const subgridCount = subgrids.length;
        let count = 0;
        for (let i = 0; i < subgridCount; i++) {
            const subgrid = subgrids[i];
            count += subgrid.getRowCount();
        }
        return count;
    }

    /**
     * @summary Gets the number of "header rows".
     * @desc Defined as the sum of all rows in all subgrids before the (first) data subgrid. Rework to return row count of header subgrid
     * @returns The total number of rows of all subgrids preceding the data subgrid.
     */
    calculateHeaderRowCount() {
        let result = 0;

        this.subgrids.find((subgrid) => {
            if (subgrid.isMain) {
                return true; // stop
            }
            result += subgrid.getRowCount();
            return undefined;
        });

        return result;
    }

    calculateHeaderPlusFixedRowCount() {
        return this.calculateHeaderRowCount() + this._gridSettings.fixedRowCount;
    }

    /**
     * @summary Gets the number of "footer rows".
     * @desc Defined as the sum of all rows in all subgrids after the main subgrid.  Rework to return row count of footer subgrid
     * @returns The total number of rows of all subgrids following the data subgrid.
     */
    calculateFooterRowCount() {
        let gotMain = false;
        return this.subgrids.reduce(
            (rows, subgrid) => {
                if (gotMain) {
                    rows += subgrid.getRowCount();
                } else {
                    gotMain = subgrid.isMain;
                }
                return rows;
            },
            0
        );
    }

    /**
     * @summary Gets the total number of rows across all subgrids.
     */
    getAllRowCount() {
        let count = 0;
        for (const subgrid of this.subgrids) {
            count += subgrid.getRowCount();
        }
        return count;
    }

    private destroySubgrids() {
        const subgridCount = this.subgrids.length;
        for (let i = subgridCount - 1; i > 0; i--) {
            const subgrid = this.subgrids[i];
            subgrid.destroy();
        }
        this.subgrids.length = 0;

        const handledSubgrids = this._handledSubgrids;
        const handledSubgridCount = handledSubgrids.length;
        for (let i = 0; i < handledSubgridCount; i++) {
            handledSubgrids[i] = undefined;
        }
    }
}

export namespace SubgridsManager {
    export type LoadedEventer = (this: void) => void;
}
