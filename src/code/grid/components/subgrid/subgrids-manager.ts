import { DataModel } from '../../interfaces/data-model';
import { GridSettings } from '../../interfaces/grid-settings';
import { MetaModel } from '../../interfaces/meta-model';
import { SubgridInterface } from '../../interfaces/subgrid-interface';
import { AssertError } from '../../lib/revgrid-error';
import { ColumnsManager } from '../column/columns-manager';
import { MainSubgrid } from './main-subgrid';
import { Subgrid } from './subgrid';
import { SubgridDefinition } from './subgrid-definition';

/** @internal */
export class SubgridsManager {
    readonly mainSubgrid: MainSubgrid;
    readonly subgrids = new Array<Subgrid>();
    readonly _handledSubgrids = new Array<Subgrid | undefined>();


    constructor(
        private readonly _gridSettings: GridSettings,
        private readonly _columnsManager: ColumnsManager,
        definitions: SubgridDefinition[],
        defaultRowPropertiesPrototype: MetaModel.RowPropertiesPrototype,
    ) {
        let mainSubgrid: MainSubgrid | undefined;
        const subgrids = this.subgrids;
        definitions.forEach(
            (definition) => {
                if (definition !== undefined) {
                    const subgridHandle = this._handledSubgrids.length;
                    const subgrid = this.createSubgridFromDefinition(subgridHandle, definition, defaultRowPropertiesPrototype);
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
            this.mainSubgrid = mainSubgrid;
        }
    }

    destroy() {
        this.destroySubgrids();
    }

    getSubgridByHandle(handle: Subgrid.Handle) { return this._handledSubgrids[handle]; }

    /**
     * @summary Resolves a `subgridSpec` to a Subgrid (and its DataModel).
     * @desc The spec may describe either an existing data model, or a constructor for a new data model.
     * @returns either Subgrid or MainSubgrid depending on role specified in Spec
     */
    private createSubgridFromDefinition(
        subgridHandle: Subgrid.Handle,
        definition: SubgridDefinition,
        defaultRowPropertiesPrototype: MetaModel.RowPropertiesPrototype,
    ) {
        const role = definition.role ?? SubgridInterface.RoleEnum.main;
        const isMainRole = role === SubgridInterface.RoleEnum.main;

        let dataModel = definition.dataModel;
        if (typeof dataModel === 'function') {
            dataModel = new dataModel();
        }
        let metaModel = definition.metaModel;
        if (typeof metaModel === 'function') {
            metaModel = new metaModel();
        }

        const rowHeightsCanDiffer = definition.rowPropertiesCanSpecifyRowHeight === true;
        let rowPropertiesBehavior = definition.rowPropertiesPrototype;
        if (metaModel !== undefined && rowPropertiesBehavior === undefined) {
            rowPropertiesBehavior = defaultRowPropertiesPrototype;
        }
        let selectable = definition.selectable;
        if (selectable === undefined) {
            selectable = isMainRole;
        }
        return this.createSubgrid(
            subgridHandle,
            role,
            dataModel,
            metaModel,
            definition.getCellPainterEventer,
            selectable,
            definition.defaultRowHeight,
            rowHeightsCanDiffer,
            rowPropertiesBehavior,
        );
    }

    /** @returns either Subgrid or MainSubgrid depending on role */
    private createSubgrid(
        subgridHandle: Subgrid.Handle,
        role: SubgridInterface.Role, dataModel: DataModel, metaModel: MetaModel | undefined,
        getCellPainterEventer: SubgridDefinition.GetCellPainterEventer,
        selectable: boolean,
        defaultRowHeight: number | undefined, rowHeightsCanDiffer: boolean,
        rowPropertiesPrototype: MetaModel.RowPropertiesPrototype | undefined,
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
                metaModel,
                getCellPainterEventer,
                selectable,
                defaultRowHeight,
                rowHeightsCanDiffer,
                rowPropertiesPrototype,
            );
        } else {
            subgrid = new Subgrid(
                this._gridSettings,
                this._columnsManager,
                subgridHandle,
                role,
                this._columnsManager.schemaModel,
                dataModel,
                metaModel,
                getCellPainterEventer,
                selectable,
                defaultRowHeight,
                rowHeightsCanDiffer,
                rowPropertiesPrototype,
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

    calculateFooterHeight() {
        return this.calculateFooterRowCount() * this._gridSettings.defaultRowHeight;
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