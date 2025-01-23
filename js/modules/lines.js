export class LineManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.lines = [];
        this.svgContainer = null;
        this.selectedLine = null;
        this.lineHandles = new Map();
        this.initializeSVGContainer();
    }
 
    initializeSVGContainer() {
        this.svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svgContainer.setAttribute('width', '100%');
        this.svgContainer.setAttribute('height', '100%');
        this.svgContainer.style.position = 'absolute';
        this.svgContainer.style.left = '0';
        this.svgContainer.style.top = '0';
        this.svgContainer.style.zIndex = '1';
        this.svgContainer.style.pointerEvents = 'none';
        this.canvas.appendChild(this.svgContainer);
    }
 
    createLine(startX, startY, endX, endY) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('stroke', '#333');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        path.style.pointerEvents = 'stroke';
        path.style.cursor = 'pointer';
        
        const d = `M ${startX} ${startY} L ${endX} ${endY}`;
        path.setAttribute('d', d);
        
        this.svgContainer.appendChild(path);
        
        const line = {
            element: path,
            startX,
            startY,
            endX,
            endY
        };
        
        this.lines.push(line);
        this.createLineHandles(line);
        return line;
    }
 
    createLineHandles(line) {
        // Create unique IDs for handles
        const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        
        // Create corner handles
        ['nw', 'ne', 'se', 'sw'].forEach(position => {
            const handle = document.createElement('div');
            handle.className = `line-handle corner-handle ${position}-handle`;
            handle.id = `handle-${position}-${uniqueId}`;
            handle.style.position = 'absolute';
            handle.style.width = '8px';
            handle.style.height = '8px';
            handle.style.backgroundColor = 'white';
            handle.style.border = '1px solid #333';
            handle.style.cursor = this.getCornerCursor(position);
            handle.style.display = 'none';
            handle.style.zIndex = '2';
            handle.style.transform = 'translate(-50%, -50%)';
            handle.style.borderRadius = '50%';
            this.canvas.appendChild(handle);
        });
 
        // Store handles reference using unique IDs
        this.lineHandles.set(line, {
            nw: document.getElementById(`handle-nw-${uniqueId}`),
            ne: document.getElementById(`handle-ne-${uniqueId}`),
            se: document.getElementById(`handle-se-${uniqueId}`),
            sw: document.getElementById(`handle-sw-${uniqueId}`)
        });
        
        this.updateLineHandles(line);
    }
 
    getCornerCursor(position) {
        switch(position) {
            case 'nw': return 'nw-resize';
            case 'ne': return 'ne-resize';
            case 'se': return 'se-resize';
            case 'sw': return 'sw-resize';
            default: return 'move';
        }
    }
 
    updateLineHandles(line) {
        const handles = this.lineHandles.get(line);
        if (!handles) return;
 
        const bounds = this.getLineBounds(line);
        const isSelected = line === this.selectedLine;
 
        Object.entries(handles).forEach(([position, handle]) => {
            const pos = this.getHandlePosition(position, line);
            handle.style.left = `${pos.x}px`;
            handle.style.top = `${pos.y}px`;
            handle.style.display = isSelected ? 'block' : 'none';
        });
    }
 
    getLineBounds(line) {
        return {
            left: Math.min(line.startX, line.endX),
            top: Math.min(line.startY, line.endY),
            right: Math.max(line.startX, line.endX),
            bottom: Math.max(line.startY, line.endY),
            width: Math.abs(line.endX - line.startX),
            height: Math.abs(line.endY - line.startY)
        };
    }
 
    getHandlePosition(position, line) {
        switch(position) {
            case 'nw': 
                return { x: line.startX, y: line.startY };
            case 'ne': 
                return { x: line.endX, y: line.startY };
            case 'se': 
                return { x: line.endX, y: line.endY };
            case 'sw': 
                return { x: line.startX, y: line.endY };
            default: 
                return { x: 0, y: 0 };
        }
    }
 
    snapToGrid(value) {
        if (!this.canvas.gridHelper?.enabled) return value;
        const gridSize = this.canvas.gridHelper.gridSize || 20;
        return Math.round(value / gridSize) * gridSize;
    }
 
    selectLine(line) {
        if (this.selectedLine) {
            this.selectedLine.element.setAttribute('stroke-width', '2');
            this.selectedLine.element.setAttribute('stroke', '#333');
            const handles = this.lineHandles.get(this.selectedLine);
            if (handles) {
                Object.values(handles).forEach(handle => {
                    handle.style.display = 'none';
                });
            }
        }
 
        this.selectedLine = line;
        
        if (line) {
            line.element.setAttribute('stroke-width', '3');
            line.element.setAttribute('stroke', '#2196f3');
            const handles = this.lineHandles.get(line);
            if (handles) {
                Object.values(handles).forEach(handle => {
                    handle.style.display = 'block';
                });
            }
        }
    }
 
    updateLine(line, startX, startY, endX, endY) {
        if (!line || !line.element) return;
 
        // Snap to grid if enabled
        startX = this.snapToGrid(startX);
        startY = this.snapToGrid(startY);
        endX = this.snapToGrid(endX);
        endY = this.snapToGrid(endY);
        
        const d = `M ${startX} ${startY} L ${endX} ${endY}`;
        line.element.setAttribute('d', d);
        
        line.startX = startX;
        line.startY = startY;
        line.endX = endX;
        line.endY = endY;
 
        this.updateLineHandles(line);
    }
 
    removeLine(line) {
        if (!line) return;
        
        if (line instanceof SVGPathElement) {
            line = this.lines.find(l => l.element === line);
        }
        
        const index = this.lines.findIndex(l => l === line);
        if (index !== -1) {
            const handles = this.lineHandles.get(line);
            if (handles) {
                Object.values(handles).forEach(handle => handle.remove());
                this.lineHandles.delete(line);
            }
 
            this.lines[index].element.remove();
            this.lines.splice(index, 1);
 
            if (this.selectedLine === line) {
                this.selectedLine = null;
            }
        }
    }
 
    updateConnectedLines(shape) {
        if (!shape) return;
 
        const shapeRect = shape.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
 
        this.lines.forEach(line => {
            const isStartConnected = this.isPointInBox(line.startX, line.startY, shapeRect);
            const isEndConnected = this.isPointInBox(line.endX, line.endY, shapeRect);
 
            if (isStartConnected || isEndConnected) {
                const connectionPoints = {
                    top: {
                        x: shapeRect.left + shapeRect.width / 2 - canvasRect.left,
                        y: shapeRect.top - canvasRect.top
                    },
                    right: {
                        x: shapeRect.right - canvasRect.left,
                        y: shapeRect.top + shapeRect.height / 2 - canvasRect.top
                    },
                    bottom: {
                        x: shapeRect.left + shapeRect.width / 2 - canvasRect.left,
                        y: shapeRect.bottom - canvasRect.top
                    },
                    left: {
                        x: shapeRect.left - canvasRect.left,
                        y: shapeRect.top + shapeRect.height / 2 - canvasRect.top
                    }
                };
 
                if (isStartConnected) {
                    const targetX = isEndConnected ? line.endX : line.endX + line.endX - line.startX;
                    const targetY = isEndConnected ? line.endY : line.endY + line.endY - line.startY;
                    const nearestPoint = this.findNearestConnectionPoint(connectionPoints, targetX, targetY);
                    line.startX = nearestPoint.x;
                    line.startY = nearestPoint.y;
                }
 
                if (isEndConnected) {
                    const targetX = isStartConnected ? line.startX : line.startX + line.startX - line.endX;
                    const targetY = isStartConnected ? line.startY : line.startY + line.startY - line.endY;
                    const nearestPoint = this.findNearestConnectionPoint(connectionPoints, targetX, targetY);
                    line.endX = nearestPoint.x;
                    line.endY = nearestPoint.y;
                }
 
                this.updateLine(line, line.startX, line.startY, line.endX, line.endY);
            }
        });
    }
 
    findNearestConnectionPoint(points, targetX, targetY) {
        let nearestPoint = points.top;
        let shortestDistance = Number.MAX_VALUE;
 
        Object.values(points).forEach(point => {
            const distance = Math.hypot(point.x - targetX, point.y - targetY);
            if (distance < shortestDistance) {
                shortestDistance = distance;
                nearestPoint = point;
            }
        });
 
        return nearestPoint;
    }
 
    isPointInBox(x, y, box) {
        const rect = this.canvas.getBoundingClientRect();
        const adjustedX = x + rect.left;
        const adjustedY = y + rect.top;
        return adjustedX >= box.left && adjustedX <= box.right && 
               adjustedY >= box.top && adjustedY <= box.bottom;
    }
 
    updateAllLines() {
        this.lines.forEach(line => {
            this.updateLine(
                line,
                line.startX,
                line.startY,
                line.endX,
                line.endY
            );
        });
    }
 
    getSerializableLines() {
        return this.lines.map(line => ({
            startX: line.startX,
            startY: line.startY,
            endX: line.endX,
            endY: line.endY
        }));
    }
 
    clearAllLines() {
        for (const handles of this.lineHandles.values()) {
            Object.values(handles).forEach(handle => handle.remove());
        }
        this.lineHandles.clear();
        
        this.lines.forEach(line => line.element.remove());
        this.lines = [];
        this.selectedLine = null;
    }
 
    cleanup() {
        this.clearAllLines();
        if (this.svgContainer) {
            this.svgContainer.remove();
            this.svgContainer = null;
        }
    }
 }