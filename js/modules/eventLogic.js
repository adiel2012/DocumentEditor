// File: eventLogic.js

export const setupEventListeners = (tool, handleMouseDown, handleMouseMove, handleMouseUp, handleKeyDown) => {
    document.querySelectorAll('.tool-button').forEach(button => {
        button.addEventListener('click', () => {
            if (button.id === 'delete-button') {
                tool.selectionManager.deleteSelectedElements();
            } else if (button.dataset.tool) {
                tool.setCurrentTool(button.dataset.tool);
                tool.selectionManager.clearSelection();
            }
        });
    });

    tool.canvas.addEventListener('mousedown', handleMouseDown);
    tool.canvas.addEventListener('mousemove', handleMouseMove);
    tool.canvas.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    tool.canvas.addEventListener('dragstart', (e) => e.preventDefault());
};

export const handleLineSelection = (e, target, tool, startDragging, startLineHandleDrag) => {
    if (target.tagName === 'path') {
        const line = tool.lineManager.getLineByElement(target);
        if (line) {
            if (e.shiftKey || e.ctrlKey || e.metaKey) {
                tool.selectionManager.toggleSelection(target, false);
            } else {
                tool.lineManager.selectLine(line);
                tool.selectionManager.toggleSelection(target, true);
            }
            startDragging(e, tool);
        }
    } else if (target.classList.contains('line-handle')) {
        const lineInfo = tool.lineManager.getLineFromHandle(target);
        if (lineInfo) {
            const rect = tool.canvas.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            
            startLineHandleDrag(e, lineInfo.line, lineInfo.position, tool);
        }
    }
};

export const startLineHandleDrag = (e, line, handlePosition, tool) => {
    const rect = tool.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    tool.isDraggingLineHandle = true;
    tool.lineHandleDragData = {
        line,
        handlePosition,
        initialMouseX: mouseX,
        initialMouseY: mouseY,
        initialStartX: line.startX,
        initialStartY: line.startY,
        initialEndX: line.endX,
        initialEndY: line.endY,
    };
};

export const startDragging = (e, tool) => {
    const rect = tool.canvas.getBoundingClientRect();
    tool.isDragging = true;
    tool.lastX = e.clientX - rect.left;
    tool.lastY = e.clientY - rect.top;
};

export const startResizing = (e, element, tool) => {
    tool.isResizing = true;
    tool.selectionManager.toggleSelection(element, true);

    tool.initialWidth = element.offsetWidth;
    tool.initialHeight = element.offsetHeight;
    tool.initialMouseX = e.clientX;
    tool.initialMouseY = e.clientY;
};

export const startLineDrawing = (e, connectionPoint, tool) => {
    tool.isDrawingLine = true;
    const rect = tool.canvas.getBoundingClientRect();
    const shape = connectionPoint.parentElement;
    const position = connectionPoint.dataset.position;

    const shapeRect = shape.getBoundingClientRect();
    switch (position) {
        case 'top':
            tool.lineStartX = shapeRect.left + shapeRect.width / 2 - rect.left;
            tool.lineStartY = shapeRect.top - rect.top;
            break;
        case 'right':
            tool.lineStartX = shapeRect.right - rect.left;
            tool.lineStartY = shapeRect.top + shapeRect.height / 2 - rect.top;
            break;
        case 'bottom':
            tool.lineStartX = shapeRect.left + shapeRect.width / 2 - rect.left;
            tool.lineStartY = shapeRect.bottom - rect.top;
            break;
        case 'left':
            tool.lineStartX = shapeRect.left - rect.left;
            tool.lineStartY = shapeRect.top + shapeRect.height / 2 - rect.top;
            break;
    }
};

export const startFreeLineDrawing = (e, tool) => {
    tool.isDrawingLine = true;
    const rect = tool.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Apply grid snapping if enabled
    const snapped = tool.gridHelper.enabled ? 
        tool.gridHelper.snapPosition(x, y) : 
        { x, y };
    
    tool.lineStartX = snapped.x;
    tool.lineStartY = snapped.y;
};

export const handleShapeCreation = (e, tool) => {
    const rect = tool.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newShape = tool.createShape(x, y);
    if (newShape) {
        tool.selectionManager.toggleSelection(newShape, true);
    }
};

export const handleLineHandleDrag = (e, tool) => {
    if (!tool.isDraggingLineHandle || !tool.lineHandleDragData) return;
    
    const rect = tool.canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const { line, handlePosition, initialMouseX, initialMouseY, initialStartX, initialStartY, initialEndX, initialEndY } = tool.lineHandleDragData;

    const dx = currentX - initialMouseX;
    const dy = currentY - initialMouseY;

    let newStartX = initialStartX;
    let newStartY = initialStartY;
    let newEndX = initialEndX;
    let newEndY = initialEndY;

    // Apply transformations based on which handle is being dragged
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

    // Apply grid snapping if enabled
    if (tool.gridHelper.enabled) {
        newStartX = tool.gridHelper.snapToGrid(newStartX);
        newStartY = tool.gridHelper.snapToGrid(newStartY);
        newEndX = tool.gridHelper.snapToGrid(newEndX);
        newEndY = tool.gridHelper.snapToGrid(newEndY);
    }

    tool.lineManager.updateLine(line, newStartX, newStartY, newEndX, newEndY);
    tool.hasUnsavedChanges = true;
};

export const endLineHandleDrag = (tool) => {
    if (tool.isDraggingLineHandle && tool.lineHandleDragData) {
        const { line } = tool.lineHandleDragData;
        if (line) {
            tool.lineManager.selectLine(line);
        }
        tool.isDraggingLineHandle = false;
        tool.lineHandleDragData = null;
    }
};

export const moveSelectedLines = (dx, dy, tool) => {
    tool.selectionManager.selectedElements.forEach(element => {
        if (element instanceof SVGPathElement) {
            const line = tool.lineManager.getLineByElement(element);
            if (line) {
                // Apply grid snapping if enabled
                let newDx = dx;
                let newDy = dy;
                
                if (tool.gridHelper.enabled) {
                    const snappedStart = tool.gridHelper.snapPosition(line.startX + dx, line.startY + dy);
                    newDx = snappedStart.x - line.startX;
                    newDy = snappedStart.y - line.startY;
                }
                
                tool.lineManager.moveLine(line, newDx, newDy);
            }
        }
    });
};