import { TOOL_TYPES } from '../utils/constants.js';

export class EventHandler {
    constructor(diagramTool) {
        this.tool = diagramTool;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Toolbar buttons
        document.querySelectorAll('.tool-button').forEach(button => {
            button.addEventListener('click', () => {
                if (button.id === 'delete-button') {
                    this.tool.deleteSelectedElement();
                } else {
                    this.tool.currentTool = button.dataset.tool;
                    this.tool.deselectAll();
                }
            });
        });

        this.tool.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.tool.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.tool.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete') {
                this.tool.deleteSelectedElement();
            }
        });
    }

    handleMouseDown(e) {
        const target = e.target;
        
        if (target.classList.contains('text-content')) {
            return;
        }

        // Handle line drawing start
        if (this.tool.currentTool === 'line') {
            if (target.classList.contains('connection-point')) {
                this.startLineDrawing(e, target);
            }
            return;
        }

        if (target.classList.contains('resize-handle')) {
            this.startResizing(e, target);
            return;
        }

        if (this.tool.currentTool === 'select') {
            this.handleSelectionClick(e, target);
        } else if (['rectangle', 'text', 'image'].includes(this.tool.currentTool)) {
            this.handleShapeCreation(e, target);
        }
    }

    startLineDrawing(e, target) {
        const rect = target.getBoundingClientRect();
        const canvasRect = this.tool.canvas.getBoundingClientRect();
        
        this.tool.isDrawingLine = true;
        this.tool.lineStartElement = target.parentElement;
        this.tool.lineStartPoint = target;
        this.tool.lineStartX = rect.left + rect.width/2 - canvasRect.left;
        this.tool.lineStartY = rect.top + rect.height/2 - canvasRect.top;
    }

    startResizing(e, target) {
        this.tool.isResizing = true;
        this.tool.selectedElement = target.parentElement;
        this.tool.selectElement(this.tool.selectedElement);
        this.tool.initialWidth = this.tool.selectedElement.offsetWidth;
        this.tool.initialHeight = this.tool.selectedElement.offsetHeight;
        this.tool.initialMouseX = e.clientX;
        this.tool.initialMouseY = e.clientY;
    }

    handleSelectionClick(e, target) {
        if (target.classList.contains('shape') || target.parentElement.classList.contains('shape')) {
            this.tool.isDragging = true;
            this.tool.selectedElement = target.classList.contains('shape') ? target : target.parentElement;
            this.tool.selectElement(this.tool.selectedElement);
            const rect = this.tool.selectedElement.getBoundingClientRect();
            this.tool.dragOffset.x = e.clientX - rect.left;
            this.tool.dragOffset.y = e.clientY - rect.top;
        } else {
            this.tool.deselectAll();
        }
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
        if (this.tool.isDragging && this.tool.selectedElement) {
            this.handleDragging(e);
        }

        if (this.tool.isResizing && this.tool.selectedElement) {
            this.handleResizing(e);
        }

        if (this.tool.isDrawingLine) {
            this.handleLineDrawing(e);
        }
    }

    handleDragging(e) {
        const rect = this.tool.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - this.tool.dragOffset.x;
        const y = e.clientY - rect.top - this.tool.dragOffset.y;
        
        this.tool.selectedElement.style.left = `${x}px`;
        this.tool.selectedElement.style.top = `${y}px`;

        // Update connected lines
        this.tool.lineManager.updateConnectedLines(this.tool.selectedElement);
    }

    handleResizing(e) {
        const dx = e.clientX - this.tool.initialMouseX;
        const dy = e.clientY - this.tool.initialMouseY;
        
        const newWidth = Math.max(100, this.tool.initialWidth + dx);
        const newHeight = Math.max(60, this.tool.initialHeight + dy);
        
        this.tool.selectedElement.style.width = `${newWidth}px`;
        this.tool.selectedElement.style.height = `${newHeight}px`;

        // Update connected lines when resizing
        this.tool.lineManager.updateConnectedLines(this.tool.selectedElement);
    }

    handleLineDrawing(e) {
        const canvasRect = this.tool.canvas.getBoundingClientRect();
        const endX = e.clientX - canvasRect.left;
        const endY = e.clientY - canvasRect.top;

        if (this.tool.temporaryLine) {
            this.tool.lineManager.updateLine(
                this.tool.temporaryLine,
                this.tool.lineStartX,
                this.tool.lineStartY,
                endX,
                endY
            );
        } else {
            this.tool.temporaryLine = this.tool.lineManager.createLine(
                this.tool.lineStartX,
                this.tool.lineStartY,
                endX,
                endY
            );
        }
    }

    handleMouseUp(e) {
        const target = e.target;

        // Handle line completion
        if (this.tool.isDrawingLine) {
            if (target.classList.contains('connection-point') && target !== this.tool.lineStartPoint) {
                const rect = target.getBoundingClientRect();
                const canvasRect = this.tool.canvas.getBoundingClientRect();
                const endX = rect.left + rect.width/2 - canvasRect.left;
                const endY = rect.top + rect.height/2 - canvasRect.top;

                if (this.tool.temporaryLine) {
                    // Update the final position of the line
                    this.tool.lineManager.updateLine(
                        this.tool.temporaryLine,
                        this.tool.lineStartX,
                        this.tool.lineStartY,
                        endX,
                        endY
                    );

                    // Store connection information
                    this.tool.temporaryLine.startElement = this.tool.lineStartElement;
                    this.tool.temporaryLine.endElement = target.parentElement;
                    this.tool.temporaryLine.startPoint = this.tool.lineStartPoint;
                    this.tool.temporaryLine.endPoint = target;
                }
            } else if (this.tool.temporaryLine) {
                // If not connecting to a valid point, remove the temporary line
                this.tool.lineManager.removeLine(this.tool.temporaryLine);
            }
        }

        // Reset all states
        this.tool.isDrawingLine = false;
        this.tool.isDragging = false;
        this.tool.isResizing = false;
        this.tool.temporaryLine = null;
        this.tool.lineStartPoint = null;
    }
}