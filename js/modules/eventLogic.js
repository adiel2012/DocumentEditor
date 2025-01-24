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
        const line = tool.lineManager.lines.find(l => l.element === target);
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
        const line = Array.from(tool.lineManager.lineHandles.entries())
            .find(([_, handles]) => Object.values(handles).includes(target))?.[0];

        if (line) {
            const handlePosition = Array.from(target.classList)
                .find(cls => ['nw', 'ne', 'se', 'sw'].includes(cls));
            startLineHandleDrag(e, line, handlePosition, tool);
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
    tool.lineStartX = e.clientX - rect.left;
    tool.lineStartY = e.clientY - rect.top;
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
