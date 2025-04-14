import { SHAPE_TYPES } from '../../utils/constants.js';
import { RectangleShape } from './shapes/RectangleShape.js';
import { TextShape } from './shapes/TextShape.js';
import { ImageShape } from './shapes/ImageShape.js';

export class ShapeFactory {
    static shapeRegistry = new Map([
        [SHAPE_TYPES.RECTANGLE, RectangleShape],
        [SHAPE_TYPES.TEXT, TextShape],
        [SHAPE_TYPES.IMAGE, ImageShape]
    ]);
    
    static registerShapeType(type, shapeClass) {
        this.shapeRegistry.set(type, shapeClass);
    }
    
    static createShape(type, x, y, width, height, data = null) {
        const ShapeClass = this.shapeRegistry.get(type);
        
        if (!ShapeClass) {
            console.error(`Shape type '${type}' not registered`);
            return null;
        }
        
        // Generate a unique ID for the shape
        const shapeId = `shape-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Create and return the shape instance
        const shape = new ShapeClass(shapeId, x, y, width, height, data);
        return shape.render();
    }
    
    static getAvailableShapeTypes() {
        return Array.from(this.shapeRegistry.keys());
    }
}