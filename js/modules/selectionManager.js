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
 
        const selectionArea = {
            left: boxRect.left - canvasRect.left,
            right: boxRect.right - canvasRect.left,
            top: boxRect.top - canvasRect.top,
            bottom: boxRect.bottom - canvasRect.top
        };
 
        // Clear existing in-selection states
        this.tool.elements.forEach(element => {
            element.classList.remove('in-selection');
        });
        this.tool.lineManager.lines.forEach(line => {
            line.element.classList.remove('in-selection');
        });
 
        // Check shapes
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
 
        // Check lines
        this.tool.lineManager.lines.forEach(line => {
            const lineBounds = {
                left: Math.min(line.startX, line.endX),
                right: Math.max(line.startX, line.endX),
                top: Math.min(line.startY, line.endY),
                bottom: Math.max(line.startY, line.endY)
            };
 
            if (this.isOverlapping(selectionArea, lineBounds)) {
                line.element.classList.add('in-selection');
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
 
        this.tool.elements.forEach(element => {
            element.classList.remove('in-selection');
        });
    }
 
    updateSelectionState() {
        this.tool.selectedElement = this.selectedElements.size === 1 ? 
            Array.from(this.selectedElements)[0] : null;
    }
 
    finalizeSelection() {
        this.tool.elements.forEach(element => {
            if (element.classList.contains('in-selection')) {
                element.classList.remove('in-selection');
                this.addToSelection(element);
            }
        });
 
        this.tool.lineManager.lines.forEach(line => {
            if (line.element.classList.contains('in-selection')) {
                line.element.classList.remove('in-selection');
                this.addToSelection(line.element);
            }
        });
    }
 
    moveSelectedElements(dx, dy) {
        this.selectedElements.forEach(element => {
            if (element instanceof SVGPathElement) {
                const line = this.tool.lineManager.lines.find(l => l.element === element);
                if (line) {
                    const newStartX = line.startX + dx;
                    const newStartY = line.startY + dy;
                    const newEndX = line.endX + dx;
                    const newEndY = line.endY + dy;
                    
                    this.tool.lineManager.updateLine(
                        line,
                        newStartX, newStartY,
                        newEndX, newEndY
                    );
                }
            } else {
                const currentLeft = parseInt(element.style.left) || 0;
                const currentTop = parseInt(element.style.top) || 0;
                
                const newX = currentLeft + dx;
                const newY = currentTop + dy;
                
                element.style.left = `${newX}px`;
                element.style.top = `${newY}px`;
                
                this.tool.lineManager.updateConnectedLines(element);
            }
        });
        this.tool.hasUnsavedChanges = true;
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
 
    cleanup() {
        this.clearSelection();
        if (this.selectionBox) {
            this.selectionBox.remove();
            this.selectionBox = null;
        }
    }
 }