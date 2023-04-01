import { Rectangle } from '..//lib/rectangle';
// var Rectangle = require('rectangular').Rectangle;

/*
 * The Hypergrid selection model defines a rectangle's bottom and right as inclusive rather than exclusive.
 * This definition works fine so long as it is used consistently. It does however throw off `Rectangle`'s
 * `width`, `height`, and `area` properties, all of which are getters which assume an exclusive model.
 * The following `SelectionModel` object extends (subclasses) `Rectangle` to correct this problem so that
 * those properties return accurate results.
 */
/** @public */
export class InclusiveRectangle extends Rectangle {
    constructor(x: number, y: number, width: number, height: number) {
        super(x, y, width - 1, height - 1);
    }

    override get width() {
        return this.extent.x + 1;
    }

    override get height() {
        return this.extent.y + 1;
    }

    override containsXY(x: number, y: number) { //TODO: explore why this works and rectanglular.contains does not
        let minX = this.origin.x;
        let minY = this.origin.y;
        let maxX = minX + this.extent.x;
        let maxY = minY + this.extent.y;

        if (this.extent.x < 0) {
            minX = maxX;
            maxX = this.origin.x;
        }

        if (this.extent.y < 0) {
            minY = maxY;
            maxY = this.origin.y;
        }

        const result =
            x >= minX &&
            y >= minY &&
            x <= maxX && // since inclusive, can equal maxX
            y <= maxY; // since inclusive, can equal maxY

        return result;
    }

}
