import { DEFAULT_STYLES } from '../utils/constants.js';

export class LineManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.lines = [];
        this.svgContainer = null;
        this.initializeSVGContainer();
    }

    initializeSVGContainer() {
        this.svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svgContainer.setAttribute('width', '100%');
        this.svgContainer.setAttribute('height', '100%');
        this.svgContainer.style.position = 'absolute';
        this.svgContainer.style.left = '0';
        this.svgContainer.style.top = '0';
        this.svgContainer.style.pointerEvents = 'none';
        this.svgContainer.style.zIndex = '1';

        // Add defs for arrow markers
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrowhead');
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '7');
        marker.setAttribute('refX', '9');
        marker.setAttribute('refY', '3.5');
        marker.setAttribute('orient', 'auto');

        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
        polygon.setAttribute('fill', '#333');

        marker.appendChild(polygon);
        defs.appendChild(marker);
        this.svgContainer.appendChild(defs);
        
        this.canvas.appendChild(this.svgContainer);
    }

    createLine(startX, startY, endX, endY) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('stroke', DEFAULT_STYLES.LINE_COLOR);
        path.setAttribute('stroke-width', DEFAULT_STYLES.LINE_WIDTH);
        path.setAttribute('fill', 'none');
        path.setAttribute('marker-end', 'url(#arrowhead)');
        
        const d = this.calculatePath(startX, startY, endX, endY);
        path.setAttribute('d', d);
        
        this.svgContainer.appendChild(path);
        
        const line = {
            element: path,
            startX,
            startY,
            endX,
            endY,
            startElement: null,
            endElement: null,
            startPoint: null,
            endPoint: null
        };
        
        this.lines.push(line);
        return line;
    }

    calculatePath(startX, startY, endX, endY) {
        // Calculate control points for the curve
        const dx = endX - startX;
        const dy = endY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Adjust curve intensity based on distance
        const curveIntensity = Math.min(distance * 0.5, 50);
        
        // Calculate control points
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        
        // Create a smooth curve
        return `M ${startX} ${startY} 
                Q ${midX} ${startY} ${midX} ${midY}
                Q ${midX} ${endY} ${endX} ${endY}`;
    }

    removeLine(line) {
        if (!line) return;
        
        const index = this.lines.findIndex(l => l.element === (line.element || line));
        if (index !== -1) {
            const lineToRemove = this.lines[index];
            if (lineToRemove.element && lineToRemove.element.parentNode) {
                lineToRemove.element.remove();
            }
            this.lines.splice(index, 1);
        }
    }

    removeConnectedLines(shape) {
        this.lines = this.lines.filter(line => {
            const isConnected = line.startElement === shape || line.endElement === shape;
            if (isConnected && line.element) {
                line.element.remove();
            }
            return !isConnected;
        });
    }

    updateLine(lineObj, startX, startY, endX, endY) {
        if (!lineObj || !lineObj.element) return;
        
        const d = this.calculatePath(startX, startY, endX, endY);
        lineObj.element.setAttribute('d', d);
        
        Object.assign(lineObj, { startX, startY, endX, endY });
    }

    // Get line by connected elements
    getLineByElements(startElement, endElement) {
        return this.lines.find(line => 
            (line.startElement === startElement && line.endElement === endElement) ||
            (line.startElement === endElement && line.endElement === startElement)
        );
    }

    // Update all lines connected to a shape
    updateConnectedLines(shape) {
        this.lines.forEach(line => {
            if (line.startElement === shape || line.endElement === shape) {
                const startPoint = line.startElement === shape ? line.startPoint : line.endPoint;
                const endPoint = line.endElement === shape ? line.endPoint : line.startPoint;
                
                if (startPoint && endPoint) {
                    const startRect = startPoint.getBoundingClientRect();
                    const endRect = endPoint.getBoundingClientRect();
                    const canvasRect = this.canvas.getBoundingClientRect();

                    const startX = startRect.left + startRect.width/2 - canvasRect.left;
                    const startY = startRect.top + startRect.height/2 - canvasRect.top;
                    const endX = endRect.left + endRect.width/2 - canvasRect.left;
                    const endY = endRect.top + endRect.height/2 - canvasRect.top;

                    this.updateLine(line, startX, startY, endX, endY);
                }
            }
        });
    }
}