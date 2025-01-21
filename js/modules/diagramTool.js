import { ShapeFactory } from './shapes.js';
import { LineManager } from './lines.js';
import { EventHandler } from './eventHandler.js';
import { TOOL_TYPES, MIN_DIMENSIONS } from '../utils/constants.js';

class DiagramTool {
    constructor(canvas) {
        this.currentTool = TOOL_TYPES.SELECT;
        this.isDragging = false;
        this.isDrawingLine = false;
        this.isResizing = false;
        this.selectedElement = null;
        this.dragOffset = { x: 0, y: 0 };
        this.elements = [];
        this.temporaryLine = null;
        this.hasUnsavedChanges = false;
        
        this.canvas = canvas;
        this.lineManager = new LineManager(this.canvas);
        this.eventHandler = new EventHandler(this);
    }

    setCurrentTool(tool) {
        this.currentTool = tool;
        if (tool === 'line') {
            this.canvas.classList.add('line-tool-active');
        } else {
            this.canvas.classList.remove('line-tool-active');
        }
    }

    createShape(x, y) {
        const shape = ShapeFactory.createShape(this.currentTool, x, y);
        this.canvas.appendChild(shape);
        this.elements.push(shape);
        this.hasUnsavedChanges = true;
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
        if (!this.selectedElement) return;

        if (this.selectedElement instanceof SVGPathElement) {
            // Delete line
            this.lineManager.removeLine(this.selectedElement);
        } else {
            // Delete shape and any connected lines
            this.lineManager.removeConnectedLines(this.selectedElement);
            const index = this.elements.indexOf(this.selectedElement);
            if (index > -1) {
                this.elements.splice(index, 1);
                this.selectedElement.remove();
            }
        }

        this.selectedElement = null;
        this.hasUnsavedChanges = true;
    }

    handleResize() {
        // Update canvas size or handle resize if needed
        this.lineManager.updateAllLines();
    }
}

export { DiagramTool };