import { TOOL_TYPES } from '../utils/constants.js';

export class EventHandler {
    constructor(diagramTool) {
        this.tool = diagramTool;
        
        // Bind methods to preserve context
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Tool selection buttons
        document.querySelectorAll('.tool-button').forEach(button => {
            button.addEventListener('click', () => {
                if (button.id === 'delete-button') {
                    this.tool.deleteSelectedElement();
                } else if (button.dataset.tool) {
                    this.tool.setCurrentTool(button.dataset.tool);
                    this.tool.deselectAll();
                }
            });
        });

        // Canvas events
        this.tool.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.tool.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.tool.canvas.addEventListener('mouseup', this.handleMouseUp);
        
        // Global keyboard events
        document.addEventListener('keydown', this.handleKeyDown);

        // Prevent text selection while dragging
        this.tool.canvas.addEventListener('dragstart', (e) => e.preventDefault());
    }

    handleKeyDown(e) {
        // Delete key - remove selected element
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (!e.target.classList.contains('text-content')) {
                this.tool.deleteSelectedElement();
            }
        }

        // Escape key - deselect and reset tool to select
        if (e.key === 'Escape') {
            this.tool.deselectAll();
            this.tool.setCurrentTool(TOOL_TYPES.SELECT);
        }

        // Grid toggle with 'G' key
        if (e.key.toLowerCase() === 'g' && !e.target.classList.contains('text-content')) {
            this.tool.toggleGrid();
        }

        // Tool shortcuts (when not editing text)
        if (!e.target.classList.contains('text-content')) {
            switch (e.key.toLowerCase()) {
                case 'v': this.tool.setCurrentTool(TOOL_TYPES.SELECT); break;
                case 'r': this.tool.setCurrentTool(TOOL_TYPES.RECTANGLE); break;
                case 't': this.tool.setCurrentTool(TOOL_TYPES.TEXT); break;
                case 'i': this.tool.setCurrentTool(TOOL_TYPES.IMAGE); break;
                case 'l': this.tool.setCurrentTool(TOOL_TYPES.LINE); break;
            }
        }
    }

    handleMouseDown(e) {
        const target = e.target;

        // Ignore if clicking within text content
        if (target.classList.contains('text-content')) {
            return;
        }

        // Handle resize handle interaction
        if (target.classList.contains('resize-handle')) {
            this.startResizing(e, target.parentElement);
            return;
        }

        // Handle connection point interaction
        if (target.classList.contains('connection-point')) {
            this.startLineDrawing(e, target);
            return;
        }

        // Handle different tools
        switch (this.tool.currentTool) {
            case TOOL_TYPES.SELECT:
                this.handleSelectionMouseDown(e, target);
                break;
            case TOOL_TYPES.LINE:
                if (target === this.tool.canvas) {
                    this.startFreeLineDrawing(e);
                }
                break;
            case TOOL_TYPES.RECTANGLE:
            case TOOL_TYPES.TEXT:
            case TOOL_TYPES.IMAGE:
                this.handleShapeCreation(e, target);
                break;
        }
    }

    handleSelectionMouseDown(e, target) {
        if (target.classList.contains('shape') || target.parentElement.classList.contains('shape')) {
            const shape = target.classList.contains('shape') ? target : target.parentElement;
            this.startDragging(e, shape);
        } else {
            this.tool.deselectAll();
        }
    }

    startDragging(e, element) {
        this.tool.isDragging = true;
        this.tool.selectElement(element);
        
        const rect = element.getBoundingClientRect();
        this.tool.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    startResizing(e, element) {
        this.tool.isResizing = true;
        this.tool.selectElement(element);
        
        this.tool.initialWidth = element.offsetWidth;
        this.tool.initialHeight = element.offsetHeight;
        this.tool.initialMouseX = e.clientX;
        this.tool.initialMouseY = e.clientY;
    }

    startLineDrawing(e, connectionPoint) {
        this.tool.isDrawingLine = true;
        const rect = this.tool.canvas.getBoundingClientRect();
        const shape = connectionPoint.parentElement;
        const position = connectionPoint.dataset.position;
        
        // Calculate start point based on connection point position
        const shapeRect = shape.getBoundingClientRect();
        switch (position) {
            case 'top':
                this.tool.lineStartX = shapeRect.left + shapeRect.width / 2 - rect.left;
                this.tool.lineStartY = shapeRect.top - rect.top;
                break;
            case 'right':
                this.tool.lineStartX = shapeRect.right - rect.left;
                this.tool.lineStartY = shapeRect.top + shapeRect.height / 2 - rect.top;
                break;
            case 'bottom':
                this.tool.lineStartX = shapeRect.left + shapeRect.width / 2 - rect.left;
                this.tool.lineStartY = shapeRect.bottom - rect.top;
                break;
            case 'left':
                this.tool.lineStartX = shapeRect.left - rect.left;
                this.tool.lineStartY = shapeRect.top + shapeRect.height / 2 - rect.top;
                break;
        }
    }

    startFreeLineDrawing(e) {
        this.tool.isDrawingLine = true;
        const rect = this.tool.canvas.getBoundingClientRect();
        this.tool.lineStartX = e.clientX - rect.left;
        this.tool.lineStartY = e.clientY - rect.top;
    }

    handleShapeCreation(e, target) {
        if (target === this.tool.canvas) {
            const rect = this.tool.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const newShape = this.tool.createShape(x, y);
            this.tool.selectElement(newShape);
        }
    }

    handleMouseMove(e) {
        const rect = this.tool.canvas.getBoundingClientRect();

        // Handle dragging
        if (this.tool.isDragging && this.tool.selectedElement) {
            const x = e.clientX - rect.left - this.tool.dragOffset.x;
            const y = e.clientY - rect.top - this.tool.dragOffset.y;
            this.tool.moveElement(this.tool.selectedElement, x, y);
        }

        // Handle resizing
        if (this.tool.isResizing && this.tool.selectedElement) {
            const dx = e.clientX - this.tool.initialMouseX;
            const dy = e.clientY - this.tool.initialMouseY;
            const newWidth = this.tool.initialWidth + dx;
            const newHeight = this.tool.initialHeight + dy;
            this.tool.resizeElement(this.tool.selectedElement, newWidth, newHeight);
        }

        // Handle line drawing
        if (this.tool.isDrawingLine) {
            const endX = e.clientX - rect.left;
            const endY = e.clientY - rect.top;
            const snapped = this.tool.gridHelper.snapPosition(endX, endY);

            if (this.tool.temporaryLine) {
                this.tool.lineManager.updateLine(
                    this.tool.temporaryLine,
                    this.tool.lineStartX,
                    this.tool.lineStartY,
                    snapped.x,
                    snapped.y
                );
            } else {
                this.tool.temporaryLine = this.tool.lineManager.createLine(
                    this.tool.lineStartX,
                    this.tool.lineStartY,
                    snapped.x,
                    snapped.y
                );
            }
        }
    }

    handleMouseUp(e) {
        if (this.tool.isDrawingLine) {
            const rect = this.tool.canvas.getBoundingClientRect();
            const endX = e.clientX - rect.left;
            const endY = e.clientY - rect.top;
            const snapped = this.tool.gridHelper.snapPosition(endX, endY);

            if (this.tool.temporaryLine) {
                this.tool.lineManager.updateLine(
                    this.tool.temporaryLine,
                    this.tool.lineStartX,
                    this.tool.lineStartY,
                    snapped.x,
                    snapped.y
                );
                this.tool.temporaryLine = null;
            }
        }

        // Reset all interaction states
        this.tool.isDrawingLine = false;
        this.tool.isDragging = false;
        this.tool.isResizing = false;
    }

    cleanup() {
        // Remove event listeners
        this.tool.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.tool.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.tool.canvas.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('keydown', this.handleKeyDown);
        
        // Remove tool button listeners
        document.querySelectorAll('.tool-button').forEach(button => {
            button.replaceWith(button.cloneNode(true));
        });
    }
}