export class SelectionManager {
    constructor(diagramTool) {
        this.tool = diagramTool;
        this.selectedElements = new Set();
        this.selectionBox = null;
        this.isSelectionDrag = false;
        this.dragStart = { x: 0, y: 0 };
        this.lastClickTime = 0;
        this.setupSelectionBox();
    }

    setupSelectionBox() {
        this.selectionBox = document.createElement('div');
        this.selectionBox.className = 'selection-box';
        this.tool.canvas.appendChild(this.selectionBox);
    }

    startSelectionDrag(e) {
        const rect = this.tool.canvas.getBoundingClientRect();
        this.isSelectionDrag = true;
        this.dragStart = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        this.selectionBox.style.display = 'block';
        this.updateSelectionBox(e);

        // If not holding shift/ctrl, clear existing selection
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
            this.clearSelection();
        }
    }

    updateSelectionDrag(e) {
        if (!this.isSelectionDrag) return;
        this.updateSelectionBox(e);
        this.selectElementsInBox();
    }

    updateSelectionBox(e) {
        const rect = this.tool.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        const left = Math.min(this.dragStart.x, currentX);
        const top = Math.min(this.dragStart.y, currentY);
        const width = Math.abs(currentX - this.dragStart.x);
        const height = Math.abs(currentY - this.dragStart.y);

        this.selectionBox.style.left = `${left}px`;
        this.selectionBox.style.top = `${top}px`;
        this.selectionBox.style.width = `${width}px`;
        this.selectionBox.style.height = `${height}px`;
    }

    endSelectionDrag() {
        this.isSelectionDrag = false;
        this.selectionBox.style.display = 'none';
    }

    selectElementsInBox() {
        const boxRect = this.selectionBox.getBoundingClientRect();
        const canvasRect = this.tool.canvas.getBoundingClientRect();

        // Adjust box coordinates relative to canvas
        const selectionArea = {
            left: boxRect.left - canvasRect.left,
            right: boxRect.right - canvasRect.left,
            top: boxRect.top - canvasRect.top,
            bottom: boxRect.bottom - canvasRect.top
        };

        // Remove 'in-selection' class from all elements
        this.tool.elements.forEach(element => {
            element.classList.remove('in-selection');
        });

        // Add 'in-selection' class to elements in selection box
        this.tool.elements.forEach(element => {
            const elementRect = element.getBoundingClientRect();
            const elementArea = {
                left: elementRect.left - canvasRect.left,
                right: elementRect.right - canvasRect.left,
                top: elementRect.top - canvasRect.top,
                bottom: elementRect.bottom - canvasRect.top
            };

            if (this.isOverlapping(selectionArea, elementArea)) {
                element.classList.add('in-selection');
            }
        });
    }

    isOverlapping(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom);
    }

    toggleSelection(element, exclusive = true) {
        if (!element) return;

        if (exclusive) {
            this.clearSelection();
        }

        if (this.selectedElements.has(element)) {
            this.removeFromSelection(element);
        } else {
            this.addToSelection(element);
        }
    }

    addToSelection(element) {
        if (!element || this.selectedElements.has(element)) return;
        
        this.selectedElements.add(element);
        element.classList.add('selected');
        this.updateSelectionState();
    }

    removeFromSelection(element) {
        if (!element || !this.selectedElements.has(element)) return;
        
        this.selectedElements.delete(element);
        element.classList.remove('selected');
        this.updateSelectionState();
    }

    clearSelection() {
        this.selectedElements.forEach(element => {
            element.classList.remove('selected');
        });
        this.selectedElements.clear();
        this.tool.lineManager.selectLine(null);
        this.updateSelectionState();

        // Also clear any in-selection elements
        this.tool.elements.forEach(element => {
            element.classList.remove('in-selection');
        });
    }

    updateSelectionState() {
        // Update the main tool's selected element reference for backward compatibility
        this.tool.selectedElement = this.selectedElements.size === 1 ? 
            Array.from(this.selectedElements)[0] : null;
    }

    finalizeSelection() {
        // Convert all in-selection elements to selected elements
        this.tool.elements.forEach(element => {
            if (element.classList.contains('in-selection')) {
                element.classList.remove('in-selection');
                this.addToSelection(element);
            }
        });
    }

    deleteSelectedElements() {
        this.selectedElements.forEach(element => {
            if (element instanceof SVGPathElement) {
                this.tool.lineManager.removeLine(element);
            } else {
                this.tool.lineManager.removeConnectedLines(element);
                const index = this.tool.elements.indexOf(element);
                if (index > -1) {
                    this.tool.elements.splice(index, 1);
                    element.remove();
                }
            }
        });
        this.clearSelection();
    }

    moveSelectedElements(dx, dy) {
        console.log('Moving selected elements:', 
            `dx=${dx}, dy=${dy}, `, 
            `selected count=${this.selectedElements.size}`);

        this.selectedElements.forEach(element => {
            if (element instanceof SVGPathElement) {
                // Find the corresponding line object
                const line = this.tool.lineManager.lines.find(l => l.element === element);
                if (line) {
                    console.log('Moving line:', 
                        `from (${line.startX},${line.startY}) to (${line.endX},${line.endY})`);
                        
                    const newStartX = line.startX + dx;
                    const newStartY = line.startY + dy;
                    const newEndX = line.endX + dx;
                    const newEndY = line.endY + dy;
                    
                    this.tool.lineManager.updateLine(
                        line,
                        newStartX, newStartY,
                        newEndX, newEndY
                    );
                    
                    console.log('Line moved to:', 
                        `(${newStartX},${newStartY}) to (${newEndX},${newEndY})`);
                }
            } else {
                const currentLeft = parseInt(element.style.left) || 0;
                const currentTop = parseInt(element.style.top) || 0;
                
                const newX = currentLeft + dx;
                const newY = currentTop + dy;
                
                element.style.left = `${newX}px`;
                element.style.top = `${newY}px`;
                
                // Update any connected lines
                this.tool.lineManager.updateConnectedLines(element);
            }
        });
        this.tool.hasUnsavedChanges = true;
    }

    getSelectionBounds() {
        if (this.selectedElements.size === 0) return null;

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        this.selectedElements.forEach(element => {
            if (!(element instanceof SVGPathElement)) {
                const rect = element.getBoundingClientRect();
                minX = Math.min(minX, rect.left);
                minY = Math.min(minY, rect.top);
                maxX = Math.max(maxX, rect.right);
                maxY = Math.max(maxY, rect.bottom);
            }
        });

        return {
            left: minX,
            top: minY,
            right: maxX,
            bottom: maxY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    handleKeyboardShortcuts(e) {
        // Ctrl+A or Cmd+A: Select all
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            this.tool.elements.forEach(element => {
                this.addToSelection(element);
            });
        }

        // Delete or Backspace: Delete selected elements
        if ((e.key === 'Delete' || e.key === 'Backspace') && 
            !e.target.classList.contains('text-content')) {
            e.preventDefault();
            this.deleteSelectedElements();
        }

        // Escape: Clear selection
        if (e.key === 'Escape') {
            this.clearSelection();
        }
    }

    cleanup() {
        this.clearSelection();
        if (this.selectionBox) {
            this.selectionBox.remove();
            this.selectionBox = null;
        }
    }
}