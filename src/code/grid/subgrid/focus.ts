import { Point } from '../lib/point';

export class Focus {
    point: Point | undefined;

    isRowFocused(rowIndex: number) {
        const point = this.point;
        return (point !== undefined) && (point.y === rowIndex);
    }
}
