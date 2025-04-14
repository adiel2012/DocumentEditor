import { Shape } from '../Shape.js';
import { SHAPE_TYPES } from '../../../utils/constants.js';

export class TextShape extends Shape {
    constructor(id, x, y, width, height, content = 'Click to edit') {
        super(id, x, y, width, height);
        this.content = content;
    }
    
    getShapeType() {
        return SHAPE_TYPES.TEXT;
    }
    
    renderContent() {
        const textArea = document.createElement('div');
        textArea.contentEditable = true;
        textArea.className = 'text-content';
        textArea.innerText = this.content;
        textArea.style.width = '100%';
        textArea.style.height = '100%';
        
        textArea.addEventListener('click', (e) => {
            e.stopPropagation();
            textArea.focus();
        });
        
        this.element.appendChild(textArea);
    }
    
    toJSON() {
        const baseData = super.toJSON();
        return {
            ...baseData,
            content: this.element ? this.element.querySelector('.text-content').innerText : this.content
        };
    }
}