import { ShapeFactory } from './shapes.js';
import { LineManager } from './lines.js';
import { EventHandler } from './eventHandler.js';
import { TOOL_TYPES, MIN_DIMENSIONS } from '../utils/constants.js';

export class DiagramTool {
    constructor() {
        this.currentTool = TOOL_TYPES.SELECT;
        this.isDragging = false;
        this.isDrawingLine = false;
        this.isResizing = false;
        this.selectedElement = null;
        this.dragOffset = { x: 0, y: 0 };
        this.elements = [];
        this.temporaryLine = null;
        
        this.canvas = document.getElementById('canvas');
        this.lineManager = new LineManager(this.canvas);
        this.eventHandler = new EventHandler(this);
    }

    createShape(x, y) {
        const shape = ShapeFactory.createShape(this.currentTool, x, y);
        this.canvas.appendChild(shape);
        this.elements.push(shape);
        return shape;
    }

    selectElement(element) {
        this.deselectAll();
        this.selectedElement = element;
        element.classList.add('selected');
    }

    deselectAll() {
        this.selectedElement = null;
        this.elements.forEach(element => {
            element.classList.remove('selected');
        });
    }

    deleteSelectedElement() {
        if (this.selectedElement) {
            // Remove any connected lines
            this.lineManager.removeConnectedLines(this.selectedElement);
            
            // Remove the element
            this.selectedElement.remove();
            
            // Remove from elements array
            const index = this.elements.indexOf(this.selectedElement);
            if (index > -1) {
                this.elements.splice(index, 1);
            }
            
            this.selectedElement = null;
        }
    }
}