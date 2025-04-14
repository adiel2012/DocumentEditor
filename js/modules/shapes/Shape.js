import { CONNECTION_POINTS } from '../../utils/constants.js';

export class Shape {
    constructor(id, x, y, width, height) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = width || 100;
        this.height = height || 60;
        this.element = null;
    }
    
    render() {
        const element = document.createElement('div');
        element.className = `shape ${this.getShapeType()}`;
        element.style.left = `${this.x}px`;
        element.style.top = `${this.y}px`;
        element.style.width = `${this.width}px`;
        element.style.height = `${this.height}px`;
        
        this.element = element;
        this.addConnectionPoints();
        this.addResizeHandle();
        this.renderContent();
        
        return element;
    }
    
    getShapeType() {
        throw new Error('getShapeType must be implemented by subclasses');
    }
    
    renderContent() {
        throw new Error('renderContent must be implemented by subclasses');
    }
    
    addConnectionPoints() {
        CONNECTION_POINTS.forEach(position => {
            const point = document.createElement('div');
            point.className = 'connection-point';
            point.dataset.position = position;
            this.element.appendChild(point);
        });
    }
    
    addResizeHandle() {
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        this.element.appendChild(resizeHandle);
    }
    
    move(x, y) {
        this.x = x;
        this.y = y;
        if (this.element) {
            this.element.style.left = `${x}px`;
            this.element.style.top = `${y}px`;
        }
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        if (this.element) {
            this.element.style.width = `${width}px`;
            this.element.style.height = `${height}px`;
        }
    }
    
    toJSON() {
        return {
            type: this.getShapeType(),
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}