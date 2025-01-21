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
        
        // If line is a path element, find the corresponding line object
        if (line instanceof SVGPathElement) {
            line = this.lines.find(l => l.element === line);
        }
        
        const index = this.lines.findIndex(l => l === line);
        if (index !== -1) {
            this.lines[index].element.remove();
            this.lines.splice(index, 1);
        }
    }

    removeConnectedLines(shape) {
        if (!shape) return;
        
        const connectedLines = this.lines.filter(line => {
            const element = line.element;
            const box = shape.getBoundingClientRect();
            const startInBox = this.isPointInBox(line.startX, line.startY, box);
            const endInBox = this.isPointInBox(line.endX, line.endY, box);
            return startInBox || endInBox;
        });

        connectedLines.forEach(line => this.removeLine(line));
    }

    isPointInBox(x, y, box) {
        return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
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
}