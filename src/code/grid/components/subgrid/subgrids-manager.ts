import { DataServer } from '../../interfaces/data/data-server';
import { MetaModel } from '../../interfaces/data/meta-model';
import { Subgrid } from '../../interfaces/data/subgrid';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { AssertError } from '../../types-utils/revgrid-error';
import { ColumnsManager } from '../column/columns-manager';
import { MainSubgridImplementation } from './main-subgrid-implementation';
import { SubgridImplementation } from './subgrid-implementation';

export class SubgridsManager<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings> {
    readonly mainSubgrid: MainSubgridImplementation<BGS, BCS>;
    readonly subgrids = new Array<SubgridImplementation<BGS, BCS>>();
    readonly _handledSubgrids = new Array<SubgridImplementation<BGS, BCS> | undefined>();

    constructor(
        private readonly _gridSettings: BGS,
        private readonly _columnsManager: ColumnsManager<BGS, BCS>,
        definitions: Subgrid.Definition<BCS>[],
    ) {
        let mainSubgrid: MainSubgridImplementation<BGS, BCS> | undefined;
        const subgrids = this.subgrids;
        definitions.sort((left, right) => Subgrid.Role.gridOrderCompare(left.role, right.role));
        for (const definition of definitions) {
            if (definition !== undefined) {
                const subgridHandle = this._handledSubgrids.length;
                const subgrid = this.createSubgridFromDefinition(subgridHandle, definition);
                subgrids.push(subgrid);
                this._handledSubgrids.push(subgrid);
                if (subgrid.role === Subgrid.RoleEnum.main) {
                    mainSubgrid = subgrid as MainSubgridImplementation<BGS, BCS>;
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

    getSubgridByHandle(handle: SubgridImplementation.Handle) { return this._handledSubgrids[handle]; }

    /**
     * @summary Resolves a `subgridSpec` to a Subgrid (and its DataModel).
     * @desc The spec may describe either an existing data model, or a constructor for a new data model.
     * @returns either Subgrid or MainSubgrid depending on role specified in Spec
     */
    private createSubgridFromDefinition(
        subgridHandle: SubgridImplementation.Handle,
        definition: Subgrid.Definition<BCS>,
    ) {
        const role = definition.role ?? Subgrid.Role.defaultRole;
        const isMainRole = role === Subgrid.RoleEnum.main;

        let dataServer = definition.dataServer;
        if (typeof dataServer === 'function') {
            dataServer = new dataServer();
        }
        let metaModel = definition.metaModel;
        if (typeof metaModel === 'function') {
            metaModel = new metaModel();
        }

        const rowHeightsCanDiffer = definition.rowPropertiesCanSpecifyRowHeight === true;
        let selectable = definition.selectable;
        if (selectable === undefined) {
            selectable = isMainRole;
        }
        return this.createSubgrid(
            subgridHandle,
            role,
            dataServer,
            metaModel,
            selectable,
            definition.defaultRowHeight,
            rowHeightsCanDiffer,
            definition.rowPropertiesPrototype,
            definition.getCellPainterEventer,
        );
    }

    /** @returns either Subgrid or MainSubgrid depending on role */
    private createSubgrid(
        subgridHandle: SubgridImplementation.Handle,
        role: Subgrid.Role, dataServer: DataServer<BCS>, metaModel: MetaModel | undefined,
        selectable: boolean,
        defaultRowHeight: number | undefined, rowHeightsCanDiffer: boolean,
        rowPropertiesPrototype: MetaModel.RowPropertiesPrototype | undefined,
        getCellPainterEventer: Subgrid.GetCellPainterEventer<BCS>,
    ) {
        let subgrid: SubgridImplementation<BGS, BCS>;
        if (role === Subgrid.RoleEnum.main) {
            subgrid = new MainSubgridImplementation<BGS, BCS>(
                this._gridSettings,
                this._columnsManager,
                subgridHandle,
                role,
                this._columnsManager.schemaServer,
                dataServer,
                metaModel,
                selectable,
                defaultRowHeight,
                rowHeightsCanDiffer,
                rowPropertiesPrototype,
                getCellPainterEventer,
            );
        } else {
            subgrid = new SubgridImplementation(
                this._gridSettings,
                this._columnsManager,
                subgridHandle,
                role,
                this._columnsManager.schemaServer,
                dataServer,
                metaModel,
                selectable,
                defaultRowHeight,
                rowHeightsCanDiffer,
                rowPropertiesPrototype,
                getCellPainterEventer,
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

    calculatePreMainPlusFixedRowCount() {
        return this.calculatePreMainRowCount() + this._gridSettings.fixedRowCount;
    }

    calculatePreMainPlusFixedRowsHeight(): number {
        const subgrids = this.subgrids;
        const subgridCount = subgrids.length;

        let preSubgridCountPlusFixedRowCount = 0;
        let height = 0;

        for (let subgridIndex = 0; subgridIndex < subgridCount; subgridIndex++) {
            const subgrid = subgrids[subgridIndex];
            if (!subgrid.isMain) {
                height += subgrid.calculateHeight();
                preSubgridCountPlusFixedRowCount++;
            } else {
                const fixedRowCount = this._gridSettings.fixedRowCount;
                if (fixedRowCount > 0) {
                    preSubgridCountPlusFixedRowCount += fixedRowCount;
                    for (let fixedRowIndex = 0; fixedRowIndex < fixedRowCount; fixedRowIndex++) {
                        height += subgrid.getRowHeight(fixedRowIndex);
                    }
                }

                break;
            }
        }

        if (preSubgridCountPlusFixedRowCount > 0) {
            // Add grid lines between pre subgrids and fixed rows and add grid line after last of these
            const gridSettings = this._gridSettings;
            const gridLinesHWidth = gridSettings.gridLinesHWidth;
            height += (preSubgridCountPlusFixedRowCount - 1) * gridLinesHWidth;
            const fixedLinesHWidth = gridSettings.fixedLinesHWidth;
            height += fixedLinesHWidth === undefined ? gridLinesHWidth : fixedLinesHWidth;
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

    calculatePostMainHeight(): number {
        let hadMain = false;
        let height = 0;
        let subgridCount = 0;
        for (const subgrid of this.subgrids) {
            if (hadMain) {
                const subgridHeight = subgrid.calculateHeight();
                height += subgridHeight;
                subgridCount++;
            }
            if (subgrid.isMain) {
                hadMain = true;
            }
        }

        if (subgridCount > 1) {
            height += subgridCount * this._gridSettings.gridLinesHWidth; // includes gridline before these subgrids
        }

        return height;
    }

    calculatePostMainAndFooterHeights(): SubgridsManager.PostMainAndFooterHeights {
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

    export interface PostMainAndFooterHeights {
        allPostMainSubgridsHeight: number;
        footersHeight: number;
    }
}
