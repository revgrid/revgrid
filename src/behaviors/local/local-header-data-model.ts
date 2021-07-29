
import { Hypergrid } from '../../grid/hypergrid';
import { DataModel } from '../../lib/data-model';

export class LocalHeaderDataModel implements DataModel {

    readonly dataRow: DataModel.DataRowObject;

    constructor(private readonly grid: Hypergrid) { }

    getRowCount() {
        return this.grid.properties.showHeaderRow ? 1 : 0;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getValue(x: number, y: number) {
        const column = this.grid.behavior.getColumn(x);
        return column.header || column.name; // use field name when header undefined
    }

    getSchema() {
        return this.grid.behavior.getSchema();
    }

    setValue(x: number, y: number, value: string) {
        if (y < this.getRowCount()) {
            this.grid.behavior.getColumn(x).header = value;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getRow(y: number) {
        return this.dataRow;
    }
}
