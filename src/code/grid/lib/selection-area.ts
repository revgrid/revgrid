import { Point } from './point';

export interface SelectionArea {
    readonly areaType: SelectionArea.Type;

    readonly origin: Point;
    readonly corner: Point;
    readonly first: Point;
}

export namespace SelectionArea {
    export const enum Type {
        Rectangle,
        Column,
        Row,
    }

    export const enum TypeSpecifier {
        Primary,
        Secondary,
        Rectangle,
        Row,
        Column,
        LastOrPrimary,
    }

}
