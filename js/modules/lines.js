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
        this.svgContainer.style.zIndex = '1';
        this.canvas.appendChild(this.svgContainer);
    }

    createLine(startX, startY, endX, endY) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('stroke', '#333');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        
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
        return line;
    }

    removeLine(line) {
        if (!line) return;
        
        const index = this.lines.findIndex(l => l === line);
        if (index !== -1) {
            line.element.remove();
            this.lines.splice(index, 1);
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
    }
}