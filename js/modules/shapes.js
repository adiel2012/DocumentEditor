import { SHAPE_TYPES, CONNECTION_POINTS } from '../utils/constants.js';

export class ShapeFactory {
    static createShape(type, x, y) {
        const shape = document.createElement('div');
        shape.className = `shape ${type}`;
        shape.style.left = `${x}px`;
        shape.style.top = `${y}px`;
        
        this.addConnectionPoints(shape);
        this.addResizeHandle(shape);
        
        switch(type) {
            case 'text':
                this.setupTextShape(shape);
                break;
            case 'image':
                this.setupImageShape(shape);
                break;
            case 'rectangle':
                // Rectangle is the default shape
                break;
        }
        
        return shape;
    }

    static addResizeHandle(shape) {
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        shape.appendChild(resizeHandle);
    }

    static addConnectionPoints(shape) {
        CONNECTION_POINTS.forEach(position => {
            const point = document.createElement('div');
            point.className = 'connection-point';
            point.dataset.position = position;
            shape.appendChild(point);
        });
    }

    static setupTextShape(shape) {
        const textArea = document.createElement('div');
        textArea.contentEditable = true;
        textArea.className = 'text-content';
        textArea.innerText = 'Click to edit';
        textArea.style.width = '100%';
        textArea.style.height = '100%';
        
        textArea.addEventListener('click', (e) => {
            e.stopPropagation();
            textArea.focus();
        });
        
        shape.appendChild(textArea);
    }

    static setupImageShape(shape) {
        const imageInput = document.createElement('input');
        imageInput.type = 'file';
        imageInput.accept = 'image/*';
        imageInput.style.display = 'none';
        
        const img = document.createElement('img');
        // Use a data URL for placeholder image
        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="12" fill="%23666" text-anchor="middle" dy=".3em"%3EClick to upload%3C/text%3E%3C/svg%3E';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        
        imageInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
        
        shape.appendChild(imageInput);
        shape.appendChild(img);
        
        img.addEventListener('click', () => {
            imageInput.click();
        });
    }
}