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

    selectLine(line) {
        if (this.selectedLine) {
            this.selectedLine.element.setAttribute('stroke-width', '2');
            this.selectedLine.element.setAttribute('stroke', '#333');
            const handles = this.lineHandles.get(this.selectedLine);
            if (handles) {
                handles.start.style.display = 'none';
                handles.end.style.display = 'none';
            }
        }

        this.selectedLine = line;
        
        if (line) {
            line.element.setAttribute('stroke-width', '3');
            line.element.setAttribute('stroke', '#2196f3');
            const handles = this.lineHandles.get(line);
            if (handles) {
                handles.start.style.display = 'block';
                handles.end.style.display = 'block';
            }
        }
    }

    updateLine(line, startX, startY, endX, endY) {
        if (!line || !line.element) return;
        
        const d = `M ${startX} ${startY} L ${endX} ${endY}`;
        line.element.setAttribute('d', d);
        
        line.startX = startX;
        line.startY = startY;
        line.endX = endX;
        line.endY = endY;

        const handles = this.lineHandles.get(line);
        if (handles) {
            handles.start.style.left = `${startX}px`;
            handles.start.style.top = `${startY}px`;
            handles.end.style.left = `${endX}px`;
            handles.end.style.top = `${endY}px`;
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

    createLineHandles(line) {
        const startHandle = document.createElement('div');
        startHandle.className = 'line-handle start-handle';
        startHandle.style.position = 'absolute';
        startHandle.style.width = '8px';
        startHandle.style.height = '8px';
        startHandle.style.backgroundColor = 'white';
        startHandle.style.border = '1px solid #333';
        startHandle.style.borderRadius = '50%';
        startHandle.style.cursor = 'move';
        startHandle.style.display = 'none';
        startHandle.style.zIndex = '2';
        startHandle.style.transform = 'translate(-50%, -50%)';
        this.canvas.appendChild(startHandle);

        const endHandle = startHandle.cloneNode(true);
        endHandle.className = 'line-handle end-handle';
        this.canvas.appendChild(endHandle);

        this.lineHandles.set(line, { start: startHandle, end: endHandle });
        this.updateLineHandles(line);
    }

    updateLineHandles(line) {
        const handles = this.lineHandles.get(line);
        if (!handles) return;

        handles.start.style.left = `${line.startX}px`;
        handles.start.style.top = `${line.startY}px`;
        handles.end.style.left = `${line.endX}px`;
        handles.end.style.top = `${line.endY}px`;

        const isSelected = line === this.selectedLine;
        handles.start.style.display = isSelected ? 'block' : 'none';
        handles.end.style.display = isSelected ? 'block' : 'none';
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
                handles.start.remove();
                handles.end.remove();
                this.lineHandles.delete(line);
            }

            this.lines[index].element.remove();
            this.lines.splice(index, 1);

            if (this.selectedLine === line) {
                this.selectedLine = null;
            }
        }
    }

    removeConnectedLines(shape) {
        if (!shape) return;
        
        const connectedLines = this.lines.filter(line => {
            const box = shape.getBoundingClientRect();
            const startInBox = this.isPointInBox(line.startX, line.startY, box);
            const endInBox = this.isPointInBox(line.endX, line.endY, box);
            return startInBox || endInBox;
        });

        connectedLines.forEach(line => this.removeLine(line));
    }

    isPointInBox(x, y, box) {
        const rect = this.canvas.getBoundingClientRect();
        const adjustedX = x + rect.left;
        const adjustedY = y + rect.top;
        return adjustedX >= box.left && adjustedX <= box.right && 
               adjustedY >= box.top && adjustedY <= box.bottom;
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
            handles.start.remove();
            handles.end.remove();
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