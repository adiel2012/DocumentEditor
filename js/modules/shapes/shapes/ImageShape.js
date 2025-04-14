import { Shape } from '../Shape.js';
import { SHAPE_TYPES } from '../../../utils/constants.js';

export class ImageShape extends Shape {
    constructor(id, x, y, width, height, imageData = null) {
        super(id, x, y, width, height);
        this.imageData = imageData;
    }
    
    getShapeType() {
        return SHAPE_TYPES.IMAGE;
    }
    
    renderContent() {
        const imageInput = document.createElement('input');
        imageInput.type = 'file';
        imageInput.accept = 'image/*';
        imageInput.style.display = 'none';
        
        const img = document.createElement('img');
        
        // Use the provided image data or a placeholder
        if (this.imageData) {
            img.src = this.imageData;
        } else {
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="12" fill="%23666" text-anchor="middle" dy=".3em"%3EClick to upload%3C/text%3E%3C/svg%3E';
        }
        
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        
        imageInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    img.src = e.target.result;
                    this.imageData = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
        
        this.element.appendChild(imageInput);
        this.element.appendChild(img);
        
        img.addEventListener('click', () => {
            imageInput.click();
        });
    }
    
    toJSON() {
        const baseData = super.toJSON();
        return {
            ...baseData,
            content: this.imageData
        };
    }
}