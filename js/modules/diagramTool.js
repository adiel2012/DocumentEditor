import { ShapeFactory } from './shapes.js';
import { LineManager } from './lines.js';
import { EventHandler } from './eventHandler.js';
import { GridHelper } from './gridHelper.js';
import { TOOL_TYPES, MIN_DIMENSIONS } from '../utils/constants.js';

class DiagramTool {
    constructor(canvas) {
        // Core properties
        this.canvas = canvas;
        this.currentTool = TOOL_TYPES.SELECT;
        this.elements = [];
        this.hasUnsavedChanges = false;

        // State flags
        this.isDragging = false;
        this.isDrawingLine = false;
        this.isResizing = false;
        
        // Selection and interaction
        this.selectedElement = null;
        this.dragOffset = { x: 0, y: 0 };
        this.temporaryLine = null;
        
        // Line drawing state
        this.lineStartX = 0;
        this.lineStartY = 0;
        
        // Initialize helpers
        this.gridHelper = new GridHelper(20, 100); // 20px small grid, 100px large grid
        this.lineManager = new LineManager(this.canvas);
        this.eventHandler = new EventHandler(this);
        
        // Initialize UI
        this.setupToolbar();
    }

    setupToolbar() {
        // Add grid toggle button
        const toolbar = document.getElementById('drawing-toolbar');
        const gridButton = document.createElement('button');
        gridButton.className = 'tool-button';
        gridButton.id = 'grid-toggle';
        gridButton.textContent = 'Grid';
        gridButton.title = 'Toggle Grid (G)';
        gridButton.addEventListener('click', () => this.toggleGrid());
        toolbar.appendChild(gridButton);

        // Set initial grid state
        this.updateGridButtonState();
    }

    toggleGrid() {
        const isEnabled = this.gridHelper.toggleGrid();
        this.canvas.classList.toggle('hide-grid', !isEnabled);
        this.updateGridButtonState();
    }

    updateGridButtonState() {
        const gridButton = document.getElementById('grid-toggle');
        if (gridButton) {
            gridButton.classList.toggle('active', this.gridHelper.enabled);
        }
    }

    setCurrentTool(tool) {
        this.currentTool = tool;
        if (tool === TOOL_TYPES.LINE) {
            this.canvas.classList.add('line-tool-active');
        } else {
            this.canvas.classList.remove('line-tool-active');
        }

        // Update toolbar UI
        document.querySelectorAll('.tool-button[data-tool]').forEach(button => {
            button.classList.toggle('active', button.dataset.tool === tool);
        });
    }

    createShape(x, y) {
        const snapped = this.gridHelper.snapPosition(x, y);
        const shape = ShapeFactory.createShape(this.currentTool, snapped.x, snapped.y);
        
        this.canvas.appendChild(shape);
        this.elements.push(shape);
        this.hasUnsavedChanges = true;
        
        return shape;
    }

    selectElement(element) {
        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
        }
        
        this.selectedElement = element;
        if (element) {
            element.classList.add('selected');
        }
    }

    deselectAll() {
        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
        }
        this.selectedElement = null;
    }

    deleteSelectedElement() {
        if (!this.selectedElement) return;

        if (this.selectedElement instanceof SVGPathElement) {
            // Delete line
            this.lineManager.removeLine(this.selectedElement);
        } else {
            // Delete shape and connected lines
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

    moveElement(element, x, y) {
        if (!element) return;
        
        const snapped = this.gridHelper.snapPosition(x, y);
        element.style.left = `${snapped.x}px`;
        element.style.top = `${snapped.y}px`;
        
        // Update connected lines
        this.lineManager.updateConnectedLines(element);
    }

    resizeElement(element, width, height) {
        if (!element) return;
        
        const snapped = this.gridHelper.snapDimensions(width, height);
        element.style.width = `${snapped.width}px`;
        element.style.height = `${snapped.height}px`;
        
        // Update connected lines
        this.lineManager.updateConnectedLines(element);
    }

    handleResize() {
        // Update SVG container and lines when canvas is resized
        this.lineManager.updateAllLines();
    }

    getSerializableData() {
        return {
            elements: this.elements.map(element => ({
                type: element.classList.contains('text') ? 'text' :
                      element.classList.contains('image') ? 'image' : 'rectangle',
                x: parseInt(element.style.left),
                y: parseInt(element.style.top),
                width: element.offsetWidth,
                height: element.offsetHeight,
                content: element.classList.contains('text') ?
                        element.querySelector('.text-content').innerText :
                        element.classList.contains('image') ?
                        element.querySelector('img').src : null
            })),
            lines: this.lineManager.getSerializableLines()
        };
    }

    loadFromData(data) {
        // Clear existing elements
        this.elements.forEach(element => element.remove());
        this.elements = [];
        this.lineManager.clearAllLines();

        // Load shapes
        data.elements.forEach(elementData => {
            const shape = this.createShape(elementData.x, elementData.y);
            shape.style.width = `${elementData.width}px`;
            shape.style.height = `${elementData.height}px`;

            if (elementData.content) {
                if (elementData.type === 'text') {
                    shape.querySelector('.text-content').innerText = elementData.content;
                } else if (elementData.type === 'image') {
                    shape.querySelector('img').src = elementData.content;
                }
            }
        });

        // Load lines
        data.lines.forEach(lineData => {
            this.lineManager.createLine(
                lineData.startX,
                lineData.startY,
                lineData.endX,
                lineData.endY
            );
        });

        this.hasUnsavedChanges = false;
    }

    cleanup() {
        // Remove event listeners and clean up resources
        if (this.eventHandler && typeof this.eventHandler.cleanup === 'function') {
            this.eventHandler.cleanup();
        }
        this.lineManager.clearAllLines();
        this.elements.forEach(element => element.remove());
        this.elements = [];
    }
}

export { DiagramTool };