import { TOOL_TYPES } from '../utils/constants.js';

export class EventHandler {
    constructor(diagramTool) {
        this.tool = diagramTool;
        this.lastX = 0;
        this.lastY = 0;
        
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
                    this.tool.selectionManager.deleteSelectedElements();
                } else if (button.dataset.tool) {
                    this.tool.setCurrentTool(button.dataset.tool);
                    this.tool.selectionManager.clearSelection();
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

    handleLineSelection(e, target) {
        if (target.tagName === 'path') {
            const line = this.tool.lineManager.lines.find(l => l.element === target);
            if (line) {
                if (e.shiftKey || e.ctrlKey || e.metaKey) {
                    this.tool.selectionManager.toggleSelection(target, false);
                } else {
                    this.tool.lineManager.selectLine(line);
                    this.tool.selectionManager.toggleSelection(target, true);
                }
            }
        } else if (target.classList.contains('line-handle')) {
            const line = Array.from(this.tool.lineManager.lineHandles.entries())
                .find(([_, handles]) => handles.start === target || handles.end === target)?.[0];
                
            if (line) {
                this.startLineHandleDrag(e, line, target.classList.contains('start-handle'));
            }
        }
    }

    startLineHandleDrag(e, line, isStart) {
        this.tool.isDraggingLineHandle = true;
        this.tool.lineHandleDragData = {
            line,
            isStart,
            initialX: isStart ? line.startX : line.endX,
            initialY: isStart ? line.startY : line.endY
        };
    }

    handleShapeCreation(e) {
        const rect = this.tool.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const newShape = this.tool.createShape(x, y);
        if (newShape) {
            this.tool.selectionManager.toggleSelection(newShape, true);
        }
    }

    startDragging(e) {
        this.tool.isDragging = true;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
    }

    startResizing(e, element) {
        this.tool.isResizing = true;
        this.tool.selectionManager.toggleSelection(element, true);
        
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

    handleMouseDown(e) {
        const target = e.target;

        // Ignore if clicking within text content
        if (target.classList.contains('text-content')) {
            return;
        }

        // Handle line and handle selection
        if (target.tagName === 'path' || target.classList.contains('line-handle')) {
            this.handleLineSelection(e, target);
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
                if (target === this.tool.canvas) {
                    this.tool.selectionManager.startSelectionDrag(e);
                } else {
                    const shape = target.closest('.shape');
                    if (shape) {
                        if (e.shiftKey || e.ctrlKey || e.metaKey) {
                            this.tool.selectionManager.toggleSelection(shape, false);
                        } else {
                            this.tool.selectionManager.toggleSelection(shape, true);
                        }
                        this.startDragging(e);
                    }
                }
                break;

            case TOOL_TYPES.LINE:
                if (target === this.tool.canvas) {
                    this.startFreeLineDrawing(e);
                }
                break;

            case TOOL_TYPES.RECTANGLE:
            case TOOL_TYPES.TEXT:
            case TOOL_TYPES.IMAGE:
                if (target === this.tool.canvas) {
                    this.handleShapeCreation(e);
                }
                break;
        }
    }

    handleMouseMove(e) {
        const rect = this.tool.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        // Update selection box if dragging
        if (this.tool.selectionManager.isSelectionDrag) {
            this.tool.selectionManager.updateSelectionDrag(e);
            return;
        }

        // Handle dragging of selected elements
        if (this.tool.isDragging) {
            if (this.tool.selectionManager.selectedElements.size > 0) {
                const dx = currentX - this.lastX;
                const dy = currentY - this.lastY;
                
                if (dx !== 0 || dy !== 0) {
                    console.log('Moving selection:', 
                        `dx=${dx}, dy=${dy}, `,
                        `elements=${this.tool.selectionManager.selectedElements.size}`);
                    
                    this.tool.selectionManager.moveSelectedElements(dx, dy);
                    this.lastX = currentX;
                    this.lastY = currentY;
                }
            }
            return;
        }

        // Rest of the mouse move handling...

        if (this.tool.isDraggingLineHandle && this.tool.lineHandleDragData) {
            const { line, isStart } = this.tool.lineHandleDragData;
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const snapped = this.tool.gridHelper.snapPosition(x, y);
            
            if (isStart) {
                this.tool.lineManager.updateLine(line, snapped.x, snapped.y, line.endX, line.endY);
            } else {
                this.tool.lineManager.updateLine(line, line.startX, line.startY, snapped.x, snapped.y);
            }
            return;
        }

        // Handle dragging
        if (this.tool.isDragging) {
            const dx = e.clientX - this.lastX;
            const dy = e.clientY - this.lastY;
            
            if (dx !== 0 || dy !== 0) {
                this.tool.selectionManager.moveSelectedElements(dx, dy);
            }
            
            this.lastX = e.clientX;
            this.lastY = e.clientY;
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
        // Finalize line handle drag
        if (this.tool.isDraggingLineHandle) {
            const { line, isStart } = this.tool.lineHandleDragData;
            if (line) {
                this.tool.lineManager.selectLine(line);
            }
            this.tool.isDraggingLineHandle = false;
            this.tool.lineHandleDragData = null;
        }

        // Rest of mouse up handling...

        // Finalize selection if we were dragging a selection box
        if (this.tool.selectionManager.isSelectionDrag) {
            this.tool.selectionManager.finalizeSelection();
            this.tool.selectionManager.endSelectionDrag();
        }

        // Handle line drawing completion
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
        this.tool.isDraggingLineHandle = false;
        this.tool.lineHandleDragData = null;
        this.tool.isDrawingLine = false;
        this.tool.isDragging = false;
        this.tool.isResizing = false;
    }

    handleKeyDown(e) {
        // Handle delete key for multiple selections
        if ((e.key === 'Delete' || e.key === 'Backspace') && 
            !e.target.classList.contains('text-content')) {
            e.preventDefault();
            this.tool.selectionManager.deleteSelectedElements();
            return;
        }

        // Handle other keyboard shortcuts
        if (!e.target.classList.contains('text-content')) {
            // Grid toggle with 'G' key
            if (e.key.toLowerCase() === 'g') {
                this.tool.toggleGrid();
            }

            // Tool shortcuts
            switch (e.key.toLowerCase()) {
                case 'v': this.tool.setCurrentTool(TOOL_TYPES.SELECT); break;
                case 'r': this.tool.setCurrentTool(TOOL_TYPES.RECTANGLE); break;
                case 't': this.tool.setCurrentTool(TOOL_TYPES.TEXT); break;
                case 'i': this.tool.setCurrentTool(TOOL_TYPES.IMAGE); break;
                case 'l': this.tool.setCurrentTool(TOOL_TYPES.LINE); break;
            }
        }
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