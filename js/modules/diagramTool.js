import { ShapeFactory } from './shapes/ShapeFactory.js';
import { LineManager } from './lines/LineManager.js';
import { EventHandler } from './eventHandler.js';
import { GridHelper } from './gridHelper.js';
import { SelectionManager } from './selectionManager.js';
import { TOOL_TYPES, MIN_DIMENSIONS } from '../utils/constants.js';

class DiagramTool {
    constructor(canvas) {
        // Core properties
        this.canvas = canvas;
        this.currentTool = TOOL_TYPES.SELECT;
        this.elements = [];
        this.hasUnsavedChanges = false;

        // State flags
        this.isDragging = false;
        this.isDrawingLine = false;
        this.isResizing = false;
        this.isDraggingLineHandle = false;
        this.lineHandleDragData = null;
        
        // Drag tracking
        this.dragStartPositions = new Map();
        this.dragStartX = 0;
        this.dragStartY = 0;
        
        // Selection and interaction
        this.selectedElement = null;
        this.temporaryLine = null;
        
        // Line drawing state
        this.lineStartX = 0;
        this.lineStartY = 0;
        
        // Initialize helpers
        this.gridHelper = new GridHelper(20, 100);
        this.lineManager = new LineManager(this.canvas);
        this.selectionManager = new SelectionManager(this);
        this.eventHandler = new EventHandler(this);
        
        // Initialize UI
        this.setupToolbar();
    }
    

    setupToolbar() {
        // Set up tool buttons
        document.querySelectorAll('.tool-button[data-tool]').forEach(button => {
            button.addEventListener('click', () => {
                const tool = button.dataset.tool;
                if (tool) {
                    this.setCurrentTool(tool);
                }
            });
        });

        // Add grid toggle button if not exists
        let gridButton = document.getElementById('grid-toggle');
        if (!gridButton) {
            gridButton = document.createElement('button');
            gridButton.className = 'tool-button';
            gridButton.id = 'grid-toggle';
            gridButton.title = 'Toggle Grid (G)';
            gridButton.addEventListener('click', () => this.toggleGrid());
            
            const toolbar = document.getElementById('drawing-toolbar');
            if (toolbar) {
                toolbar.appendChild(gridButton);
            }
        }

        // Set initial grid state
        this.updateGridButtonState();
    }

    toggleGrid() {
        const isEnabled = this.gridHelper.toggleGrid();
        this.canvas.classList.toggle('hide-grid', !isEnabled);
        this.updateGridButtonState();
    }

    updateGridButtonState() {
        const gridButton = document.getElementById('grid-toggle');
        if (gridButton) {
            gridButton.classList.toggle('active', this.gridHelper.enabled);
        }
    }

    setCurrentTool(tool) {
        console.log('Setting current tool:', tool);
        this.currentTool = tool;
        
        // Update UI state
        if (tool === TOOL_TYPES.LINE) {
            this.canvas.classList.add('line-tool-active');
        } else {
            this.canvas.classList.remove('line-tool-active');
        }

        // Update toolbar UI
        document.querySelectorAll('.tool-button[data-tool]').forEach(button => {
            button.classList.toggle('active', button.dataset.tool === tool);
        });

        // Clear selection when changing tools
        if (tool !== TOOL_TYPES.SELECT) {
            this.selectionManager.clearSelection();
        }
    }

    createShape(x, y, type = null, width = null, height = null, data = null) {
        const actualType = type || this.currentTool;
        console.log('Creating shape of type:', actualType);
        const snapped = this.gridHelper.snapPosition(x, y);
        const shape = ShapeFactory.createShape(
            actualType, 
            snapped.x, 
            snapped.y, 
            width, 
            height,
            data
        );
        
        if (!shape) {
            console.error('Failed to create shape of type:', actualType);
            return null;
        }
        
        this.canvas.appendChild(shape);
        this.elements.push(shape);
        this.hasUnsavedChanges = true;
        
        return shape;
    }

    // FUTURE REFACTORING NOTE:
    // The following methods are kept for backwards compatibility
    // In a future refactoring, we should:
    // 1. Store Shape objects instead of DOM elements in this.elements
    // 2. Delegate DOM manipulation to the Shape classes
    // 3. Update all references to use Shape objects' methods
    
    selectElement(element) {
        this.selectionManager.toggleSelection(element, true);
    }

    deselectAll() {
        this.selectionManager.clearSelection();
    }

    deleteSelectedElement() {
        this.selectionManager.deleteSelectedElements();
    }

    // FUTURE REFACTORING:
    // These methods directly manipulate the DOM. In a future refactoring,
    // this should be done through Shape object methods instead.
    
    moveElement(element, x, y) {
        if (!element) return;
        
        const snapped = this.gridHelper.snapPosition(x, y);
        element.style.left = `${snapped.x}px`;
        element.style.top = `${snapped.y}px`;
        
        this.lineManager.updateConnectedLines(element);
        this.hasUnsavedChanges = true;
    }

    resizeElement(element, width, height) {
        if (!element) return;
        
        const snapped = this.gridHelper.snapDimensions(width, height);
        const finalWidth = Math.max(MIN_DIMENSIONS.WIDTH, snapped.width);
        const finalHeight = Math.max(MIN_DIMENSIONS.HEIGHT, snapped.height);
        
        element.style.width = `${finalWidth}px`;
        element.style.height = `${finalHeight}px`;
        
        this.lineManager.updateConnectedLines(element);
        this.hasUnsavedChanges = true;
    }

    handleResize() {
        if (this.lineManager) {
            this.lineManager.updateAllLines();
        }
    }

    async getSerializableData() {
        try {
            console.log('Starting serialization of diagram data');
            
            // Process elements
            const elementPromises = this.elements.map(async element => {
                try {
                    // Get common properties
                    const baseData = {
                        type: this.getElementType(element),
                        x: parseInt(element.style.left) || 0,
                        y: parseInt(element.style.top) || 0,
                        width: element.offsetWidth,
                        height: element.offsetHeight
                    };
                    
                    // Special handling for image content that might need async processing
                    if (baseData.type === 'image') {
                        const img = element.querySelector('img');
                        if (!img) return null;
                        
                        // Default placeholder
                        if (img.src.startsWith('data:image/svg+xml')) {
                            return { ...baseData, content: null };
                        }
                        
                        // External images need to be converted to base64
                        if (!img.src.startsWith('data:')) {
                            try {
                                const response = await fetch(img.src);
                                const blob = await response.blob();
                                const base64 = await new Promise((resolve) => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => resolve(reader.result);
                                    reader.readAsDataURL(blob);
                                });
                                return { ...baseData, content: base64 };
                            } catch (error) {
                                console.error('Error converting image to base64:', error);
                                return null;
                            }
                        }
                        
                        return { ...baseData, content: img.src };
                    } 
                    // Handle text content
                    else if (baseData.type === 'text') {
                        const textContent = element.querySelector('.text-content');
                        return { 
                            ...baseData, 
                            content: textContent ? textContent.innerText : '' 
                        };
                    }
                    // Handle other shape types
                    // (Add specific handling for new shape types here)
                    
                    // Return basic data for other types
                    return baseData;
                    
                } catch (error) {
                    console.error('Error processing element:', error);
                    return null;
                }
            });

            // Wait for all element processing to complete
            const elements = await Promise.all(elementPromises);
            console.log('Elements processed:', elements.length);

            return {
                elements: elements.filter(el => el !== null),
                lines: this.lineManager.getSerializableLines()
            };
        } catch (error) {
            console.error('Error in getSerializableData:', error);
            throw error;
        }
    }
    
    // Helper to get element type from DOM element
    getElementType(element) {
        for (const type of Object.values(SHAPE_TYPES)) {
            if (element.classList.contains(type)) {
                return type;
            }
        }
        return null;
    }

    loadFromData(data) {
        try {
            console.log('Starting loadFromData with data:', data);

            // Clear existing elements
            this.elements.forEach(element => element.remove());
            this.elements = [];
            this.lineManager.clearAllLines();
            this.selectionManager.clearSelection();

            // Load shapes
            data.elements.forEach((elementData, index) => {
                try {
                    console.log(`Processing element ${index}:`, elementData);
                    const shape = this.createShape(
                        elementData.x, 
                        elementData.y, 
                        elementData.type, 
                        elementData.width, 
                        elementData.height, 
                        elementData.content
                    );
                    
                    if (!shape) {
                        console.error(`Failed to create shape for element ${index}`);
                        return;
                    }
                } catch (elementError) {
                    console.error(`Error processing element ${index}:`, elementError);
                }
            });

            // Load lines
            if (data.lines) {
                console.log('Processing lines:', data.lines);
                data.lines.forEach((lineData, index) => {
                    try {
                        this.lineManager.createLine(
                            lineData.startX,
                            lineData.startY,
                            lineData.endX,
                            lineData.endY
                        );
                    } catch (lineError) {
                        console.error(`Error processing line ${index}:`, lineError);
                    }
                });
            }

            this.hasUnsavedChanges = false;
            console.log('Successfully loaded data');
        } catch (error) {
            console.error('Error in loadFromData:', error);
            throw error;
        }
    }

    cleanup() {
        if (this.eventHandler && typeof this.eventHandler.cleanup === 'function') {
            this.eventHandler.cleanup();
        }

        if (this.lineManager && typeof this.lineManager.cleanup === 'function') {
            this.lineManager.cleanup();
        }

        if (this.selectionManager && typeof this.selectionManager.cleanup === 'function') {
            this.selectionManager.cleanup();
        }

        this.elements.forEach(element => element.remove());
        this.elements = [];
        
        this.selectedElement = null;
        this.temporaryLine = null;
        this.isDragging = false;
        this.isDrawingLine = false;
        this.isResizing = false;
        this.isDraggingLineHandle = false;
        this.lineHandleDragData = null;
    }
}

export { DiagramTool };