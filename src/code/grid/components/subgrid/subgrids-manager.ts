import { DataModel } from '../../interfaces/data-model';
import { GridSettings } from '../../interfaces/grid-settings';
import { MetaModel } from '../../interfaces/meta-model';
import { SubgridInterface } from '../../interfaces/subgrid-interface';
import { AssertError } from '../../lib/revgrid-error';
import { ColumnsManager } from '../column/columns-manager';
import { MainSubgrid } from './main-subgrid';
import { Subgrid } from './subgrid';
import { SubgridDefinition } from './subgrid-definition';

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
        definitions.sort((left, right) => SubgridInterface.Role.gridOrderCompare(left.role, right.role));
        for (const definition of definitions) {
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
        const role = definition.role ?? SubgridInterface.Role.defaultRole;
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

    calculatePreMainRowCount() {
        let count = 0;
        for (const subgrid of this.subgrids) {
            if (subgrid.isMain) {
                break;
            }
            count += subgrid.getRowCount();
        }
        return count;
    }

    calculatePreMainHeight() {
        let height = 0;
        let subgridCount = 0;
        for (const subgrid of this.subgrids) {
            if (subgrid.isMain) {
                break;
            }
            height += subgrid.calculateHeight();
            subgridCount++;
        }
        if (subgridCount > 1) {
            height += (subgridCount - 1) * this._gridSettings.gridLinesHWidth
        }
        return height;
    }

    calculatePostMainRowCount() {
        let count = 0;
        let hadMain = false;
        for (const subgrid of this.subgrids) {
            if (hadMain) {
                count += subgrid.getRowCount();
            }
            if (subgrid.isMain) {
                hadMain = true;
            }
        }
        return count;
    }

    calculatePostMainHeight(): SubgridsManager.PostMainHeights {
        let hadMain = false;
        let othersHeight = 0;
        let footersHeight = 0;
        let footerSubgridCount = 0
        let otherSubgridCount = 0;
        for (const subgrid of this.subgrids) {
            if (hadMain) {
                const subgridHeight = subgrid.calculateHeight();
                if (subgrid.isFooter) {
                    footersHeight += subgridHeight;
                    footerSubgridCount++;
                } else {
                    othersHeight += subgridHeight;
                    otherSubgridCount++;
                }
            }
            if (subgrid.isMain) {
                hadMain = true;
            }
        }

        if (footerSubgridCount > 1) {
            footersHeight += (footerSubgridCount - 1) * this._gridSettings.gridLinesHWidth;
        }

        let allPostMainSubgridsHeight = footersHeight + othersHeight;
        const allPostMainSubgridCount = footerSubgridCount + otherSubgridCount;
        if (allPostMainSubgridCount > 1) {
            allPostMainSubgridsHeight += (allPostMainSubgridCount - 1) * this._gridSettings.gridLinesHWidth
        }

        return {
            allPostMainSubgridsHeight,
            footersHeight,
        }
    }

    calculateSummariesFootersHeights(): SubgridsManager.SummariesFootersHeights {
        let summariesHeight = 0;
        let footersHeight = 0;
        let footerSubgridCount = 0;
        let summarySubgridCount = 0;
        for (const subgrid of this.subgrids) {
            if (subgrid.isFooter) {
                footersHeight += subgrid.calculateHeight();
                footerSubgridCount++;
            } else {
                if (subgrid.isSummary) {
                    summariesHeight += subgrid.calculateHeight();
                    summarySubgridCount++;
                }
            }
        }
        if (footerSubgridCount > 1) {
            summariesHeight += (footerSubgridCount - 1) * this._gridSettings.gridLinesHWidth
        }
        if (summarySubgridCount > 1) {
            footersHeight += (summarySubgridCount - 1) * this._gridSettings.gridLinesHWidth
        }
        let summariesPlusFootersHeight = summariesHeight + footersHeight;
        if (summariesHeight > 0 && footersHeight > 0) {
            summariesPlusFootersHeight += this._gridSettings.gridLinesHWidth;
        }
        return {
            summariesHeight,
            footersHeight,
            summariesPlusFootersHeight,
        }
    }

    calculatePrePostMainRowcount() {
        let count = 0;
        for (const subgrid of this.subgrids) {
            if (!subgrid.isMain) {
                count += subgrid.getRowCount();
            }
        }
        return count;
    }

    calculatePrePostMainHeight() {
        let height = 0;
        for (const subgrid of this.subgrids) {
            if (!subgrid.isMain) {
                height += subgrid.calculateHeight();
            }
        }
        return height;
    }

    calculateFootersHeight() {
        let height = 0;
        for (const subgrid of this.subgrids) {
            if (subgrid.isFooter) {
                height += subgrid.calculateHeight();
            }
        }
        return height;
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

    export interface SummariesFootersHeights {
        summariesHeight: number;
        footersHeight: number;
        summariesPlusFootersHeight: number;
    }

    export interface PostMainHeights {
        allPostMainSubgridsHeight: number;
        footersHeight: number;
    }
}
