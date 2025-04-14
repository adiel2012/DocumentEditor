import { Shape } from '../Shape.js';
import { SHAPE_TYPES } from '../../../utils/constants.js';

export class RectangleShape extends Shape {
    getShapeType() {
        return SHAPE_TYPES.RECTANGLE;
    }
    
    renderContent() {
        // Rectangle doesn't need special content
    }
}