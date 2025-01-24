// File: eventHandler.js

import {
    setupEventListeners,
    handleLineSelection,
    startLineHandleDrag,
    startDragging,
    startResizing,
    startLineDrawing,
    startFreeLineDrawing,
    handleShapeCreation,
} from './eventLogic.js';

import { TOOL_TYPES } from '../utils/constants.js';

export class EventHandler {
    constructor(diagramTool) {
        this.tool = diagramTool;
        this.lastX = 0;
        this.lastY = 0;

        // Bind methods to this instance
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);

        // Setup event listeners using the external logic
        setupEventListeners(
            this.tool,
            this.handleMouseDown,
            this.handleMouseMove,
            this.handleMouseUp,
            this.handleKeyDown
        );
    }

    handleMouseDown(e) {
        const target = e.target;

        if (target.classList.contains('text-content')) {
            return;
        }

        if (target.tagName === 'path' || target.classList.contains('line-handle')) {
            handleLineSelection(e, target, this.tool, startDragging, startLineHandleDrag);
            return;
        }

        if (target.classList.contains('resize-handle')) {
            startResizing(e, target.parentElement, this.tool);
            return;
        }

        if (target.classList.contains('connection-point')) {
            startLineDrawing(e, target, this.tool);
            return;
        }

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
                        startDragging(e, this.tool);
                    }
                }
                break;

            case TOOL_TYPES.LINE:
                if (target === this.tool.canvas) {
                    startFreeLineDrawing(e, this.tool);
                }
                break;

            case TOOL_TYPES.RECTANGLE:
            case TOOL_TYPES.TEXT:
            case TOOL_TYPES.IMAGE:
                if (target === this.tool.canvas) {
                    handleShapeCreation(e, this.tool);
                }
                break;
        }
    }

    handleMouseMove(e) {
        const rect = this.tool.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        if (this.tool.isDraggingLineHandle && this.tool.lineHandleDragData) {
            const { line, handlePosition, initialMouseX, initialMouseY, initialStartX, initialStartY, initialEndX, initialEndY } = this.tool.lineHandleDragData;

            const dx = currentX - initialMouseX;
            const dy = currentY - initialMouseY;

            let newStartX = initialStartX;
            let newStartY = initialStartY;
            let newEndX = initialEndX;
            let newEndY = initialEndY;

            switch (handlePosition) {
                case 'nw':
                    newStartX += dx;
                    newStartY += dy;
                    break;
                case 'ne':
                    newEndX += dx;
                    newStartY += dy;
                    break;
                case 'se':
                    newEndX += dx;
                    newEndY += dy;
                    break;
                case 'sw':
                    newStartX += dx;
                    newEndY += dy;
                    break;
            }

            this.tool.lineManager.updateLine(line, newStartX, newStartY, newEndX, newEndY);
            return;
        }

        if (this.tool.selectionManager.isSelectionDrag) {
            this.tool.selectionManager.updateSelectionDrag(e);
            return;
        }

        if (this.tool.isDragging && this.tool.selectionManager.selectedElements.size > 0) {
            const dx = currentX - this.lastX;
            const dy = currentY - this.lastY;

            if (dx !== 0 || dy !== 0) {
                this.tool.selectionManager.moveSelectedElements(dx, dy);
                this.lastX = currentX;
                this.lastY = currentY;
            }
            return;
        }

        if (this.tool.isResizing && this.tool.selectedElement) {
            const dx = e.clientX - this.tool.initialMouseX;
            const dy = e.clientY - this.tool.initialMouseY;
            const newWidth = this.tool.initialWidth + dx;
            const newHeight = this.tool.initialHeight + dy;
            this.tool.resizeElement(this.tool.selectedElement, newWidth, newHeight);
        }

        if (this.tool.isDrawingLine) {
            const snapped = this.tool.gridHelper.snapPosition(currentX, currentY);

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
        if (this.tool.isDraggingLineHandle) {
            const { line } = this.tool.lineHandleDragData;
            if (line) {
                this.tool.lineManager.selectLine(line);
            }
            this.tool.isDraggingLineHandle = false;
            this.tool.lineHandleDragData = null;
        }

        if (this.tool.selectionManager.isSelectionDrag) {
            this.tool.selectionManager.finalizeSelection();
            this.tool.selectionManager.endSelectionDrag();
        }

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

        this.tool.isDragging = false;
        this.tool.isDrawingLine = false;
        this.tool.isResizing = false;
    }

    handleKeyDown(e) {
        if ((e.key === 'Delete' || e.key === 'Backspace') && 
            !e.target.classList.contains('text-content')) {
            e.preventDefault();
            this.tool.selectionManager.deleteSelectedElements();
            return;
        }

        if (!e.target.classList.contains('text-content')) {
            if (e.key.toLowerCase() === 'g') {
                this.tool.toggleGrid();
            }

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
        this.tool.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.tool.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.tool.canvas.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('keydown', this.handleKeyDown);

        document.querySelectorAll('.tool-button').forEach(button => {
            button.replaceWith(button.cloneNode(true));
        });
    }
}
