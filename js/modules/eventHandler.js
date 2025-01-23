import { TOOL_TYPES } from '../utils/constants.js';

export class EventHandler {
   constructor(diagramTool) {
       this.tool = diagramTool;
       this.lastX = 0;
       this.lastY = 0;
       
       // Bind methods
       this.handleMouseDown = this.handleMouseDown.bind(this);
       this.handleMouseMove = this.handleMouseMove.bind(this);
       this.handleMouseUp = this.handleMouseUp.bind(this);
       this.handleKeyDown = this.handleKeyDown.bind(this);
       
       this.setupEventListeners();
   }

   setupEventListeners() {
       // Tool selection buttons
       document.querySelectorAll('.tool-button').forEach(button => {
           button.addEventListener('click', () => {
               if (button.id === 'delete-button') {
                   this.tool.selectionManager.deleteSelectedElements();
               } else if (button.dataset.tool) {
                   this.tool.setCurrentTool(button.dataset.tool);
                   this.tool.selectionManager.clearSelection();
               }
           });
       });

       // Canvas events
       this.tool.canvas.addEventListener('mousedown', this.handleMouseDown);
       this.tool.canvas.addEventListener('mousemove', this.handleMouseMove);
       this.tool.canvas.addEventListener('mouseup', this.handleMouseUp);
       document.addEventListener('keydown', this.handleKeyDown);
       this.tool.canvas.addEventListener('dragstart', (e) => e.preventDefault());
   }

   handleLineSelection(e, target) {
       if (target.tagName === 'path') {
           const line = this.tool.lineManager.lines.find(l => l.element === target);
           if (line) {
               if (e.shiftKey || e.ctrlKey || e.metaKey) {
                   this.tool.selectionManager.toggleSelection(target, false);
               } else {
                   this.tool.lineManager.selectLine(line);
                   this.tool.selectionManager.toggleSelection(target, true);
               }
               // Initialize drag for line
               const rect = this.tool.canvas.getBoundingClientRect();
               this.startDragging(e);
           }
       } else if (target.classList.contains('line-handle')) {
           const line = Array.from(this.tool.lineManager.lineHandles.entries())
               .find(([_, handles]) => Object.values(handles).includes(target))?.[0];
               
           if (line) {
               // Get handle position (nw, ne, se, sw)
               const handlePosition = Array.from(target.classList)
                   .find(cls => ['nw', 'ne', 'se', 'sw'].includes(cls));
               this.startLineHandleDrag(e, line, handlePosition);
           }
       }
   }

   startLineHandleDrag(e, line, handlePosition) {
       const rect = this.tool.canvas.getBoundingClientRect();
       const mouseX = e.clientX - rect.left;
       const mouseY = e.clientY - rect.top;

       this.tool.isDraggingLineHandle = true;
       this.tool.lineHandleDragData = {
           line,
           handlePosition,
           initialMouseX: mouseX,
           initialMouseY: mouseY,
           initialStartX: line.startX,
           initialStartY: line.startY,
           initialEndX: line.endX,
           initialEndY: line.endY
       };
   }

   handleShapeCreation(e) {
       const rect = this.tool.canvas.getBoundingClientRect();
       const x = e.clientX - rect.left;
       const y = e.clientY - rect.top;
       const newShape = this.tool.createShape(x, y);
       if (newShape) {
           this.tool.selectionManager.toggleSelection(newShape, true);
       }
   }

   startDragging(e) {
       const rect = this.tool.canvas.getBoundingClientRect();
       this.tool.isDragging = true;
       this.lastX = e.clientX - rect.left;
       this.lastY = e.clientY - rect.top;
   }

   startResizing(e, element) {
       this.tool.isResizing = true;
       this.tool.selectionManager.toggleSelection(element, true);
       
       this.tool.initialWidth = element.offsetWidth;
       this.tool.initialHeight = element.offsetHeight;
       this.tool.initialMouseX = e.clientX;
       this.tool.initialMouseY = e.clientY;
   }

   startLineDrawing(e, connectionPoint) {
       this.tool.isDrawingLine = true;
       const rect = this.tool.canvas.getBoundingClientRect();
       const shape = connectionPoint.parentElement;
       const position = connectionPoint.dataset.position;
       
       const shapeRect = shape.getBoundingClientRect();
       switch (position) {
           case 'top':
               this.tool.lineStartX = shapeRect.left + shapeRect.width / 2 - rect.left;
               this.tool.lineStartY = shapeRect.top - rect.top;
               break;
           case 'right':
               this.tool.lineStartX = shapeRect.right - rect.left;
               this.tool.lineStartY = shapeRect.top + shapeRect.height / 2 - rect.top;
               break;
           case 'bottom':
               this.tool.lineStartX = shapeRect.left + shapeRect.width / 2 - rect.left;
               this.tool.lineStartY = shapeRect.bottom - rect.top;
               break;
           case 'left':
               this.tool.lineStartX = shapeRect.left - rect.left;
               this.tool.lineStartY = shapeRect.top + shapeRect.height / 2 - rect.top;
               break;
       }
   }

   startFreeLineDrawing(e) {
       this.tool.isDrawingLine = true;
       const rect = this.tool.canvas.getBoundingClientRect();
       this.tool.lineStartX = e.clientX - rect.left;
       this.tool.lineStartY = e.clientY - rect.top;
   }

   handleMouseDown(e) {
       const target = e.target;

       if (target.classList.contains('text-content')) {
           return;
       }

       if (target.tagName === 'path' || target.classList.contains('line-handle')) {
           this.handleLineSelection(e, target);
           return;
       }

       if (target.classList.contains('resize-handle')) {
           this.startResizing(e, target.parentElement);
           return;
       }

       if (target.classList.contains('connection-point')) {
           this.startLineDrawing(e, target);
           return;
       }

       switch (this.tool.currentTool) {
           case TOOL_TYPES.SELECT:
               if (target === this.tool.canvas) {
                   this.tool.selectionManager.startSelectionDrag(e);
               } else {
                   const shape = target.closest('.shape');
                   if (shape) {
                       if (e.shiftKey || e.ctrlKey || e.metaKey) {
                           this.tool.selectionManager.toggleSelection(shape, false);
                       } else {
                           this.tool.selectionManager.toggleSelection(shape, true);
                       }
                       this.startDragging(e);
                   }
               }
               break;

           case TOOL_TYPES.LINE:
               if (target === this.tool.canvas) {
                   this.startFreeLineDrawing(e);
               }
               break;

           case TOOL_TYPES.RECTANGLE:
           case TOOL_TYPES.TEXT:
           case TOOL_TYPES.IMAGE:
               if (target === this.tool.canvas) {
                   this.handleShapeCreation(e);
               }
               break;
       }
   }

   handleMouseMove(e) {
       const rect = this.tool.canvas.getBoundingClientRect();
       const currentX = e.clientX - rect.left;
       const currentY = e.clientY - rect.top;

       if (this.tool.isDraggingLineHandle && this.tool.lineHandleDragData) {
           const { line, handlePosition, initialMouseX, initialMouseY, 
                   initialStartX, initialStartY, initialEndX, initialEndY } = this.tool.lineHandleDragData;
           
           const dx = currentX - initialMouseX;
           const dy = currentY - initialMouseY;

           let newStartX = initialStartX;
           let newStartY = initialStartY;
           let newEndX = initialEndX;
           let newEndY = initialEndY;

           switch(handlePosition) {
               case 'nw':
                   newStartX += dx;
                   newStartY += dy;
                   break;
               case 'ne':
                   newEndX += dx;
                   newStartY += dy;
                   break;
               case 'se':
                   newEndX += dx;
                   newEndY += dy;
                   break;
               case 'sw':
                   newStartX += dx;
                   newEndY += dy;
                   break;
           }

           this.tool.lineManager.updateLine(line, newStartX, newStartY, newEndX, newEndY);
           return;
       }

       if (this.tool.selectionManager.isSelectionDrag) {
           this.tool.selectionManager.updateSelectionDrag(e);
           return;
       }

       if (this.tool.isDragging && this.tool.selectionManager.selectedElements.size > 0) {
           const dx = currentX - this.lastX;
           const dy = currentY - this.lastY;
           
           if (dx !== 0 || dy !== 0) {
               this.tool.selectionManager.moveSelectedElements(dx, dy);
               this.lastX = currentX;
               this.lastY = currentY;
           }
           return;
       }

       if (this.tool.isResizing && this.tool.selectedElement) {
           const dx = e.clientX - this.tool.initialMouseX;
           const dy = e.clientY - this.tool.initialMouseY;
           const newWidth = this.tool.initialWidth + dx;
           const newHeight = this.tool.initialHeight + dy;
           this.tool.resizeElement(this.tool.selectedElement, newWidth, newHeight);
       }

       if (this.tool.isDrawingLine) {
           const snapped = this.tool.gridHelper.snapPosition(currentX, currentY);

           if (this.tool.temporaryLine) {
               this.tool.lineManager.updateLine(
                   this.tool.temporaryLine,
                   this.tool.lineStartX,
                   this.tool.lineStartY,
                   snapped.x,
                   snapped.y
               );
           } else {
               this.tool.temporaryLine = this.tool.lineManager.createLine(
                   this.tool.lineStartX,
                   this.tool.lineStartY,
                   snapped.x,
                   snapped.y
               );
           }
       }
   }

   handleMouseUp(e) {
       if (this.tool.isDraggingLineHandle) {
           const { line } = this.tool.lineHandleDragData;
           if (line) {
               this.tool.lineManager.selectLine(line);
           }
           this.tool.isDraggingLineHandle = false;
           this.tool.lineHandleDragData = null;
       }

       if (this.tool.selectionManager.isSelectionDrag) {
           this.tool.selectionManager.finalizeSelection();
           this.tool.selectionManager.endSelectionDrag();
       }

       if (this.tool.isDrawingLine) {
           const rect = this.tool.canvas.getBoundingClientRect();
           const endX = e.clientX - rect.left;
           const endY = e.clientY - rect.top;
           const snapped = this.tool.gridHelper.snapPosition(endX, endY);

           if (this.tool.temporaryLine) {
               this.tool.lineManager.updateLine(
                   this.tool.temporaryLine,
                   this.tool.lineStartX,
                   this.tool.lineStartY,
                   snapped.x,
                   snapped.y
               );
               this.tool.temporaryLine = null;
           }
       }

       this.tool.isDragging = false;
       this.tool.isDrawingLine = false;
       this.tool.isResizing = false;
   }

   handleKeyDown(e) {
       if ((e.key === 'Delete' || e.key === 'Backspace') && 
           !e.target.classList.contains('text-content')) {
           e.preventDefault();
           this.tool.selectionManager.deleteSelectedElements();
           return;
       }

       if (!e.target.classList.contains('text-content')) {
           if (e.key.toLowerCase() === 'g') {
               this.tool.toggleGrid();
           }

           switch (e.key.toLowerCase()) {
               case 'v': this.tool.setCurrentTool(TOOL_TYPES.SELECT); break;
               case 'r': this.tool.setCurrentTool(TOOL_TYPES.RECTANGLE); break;
               case 't': this.tool.setCurrentTool(TOOL_TYPES.TEXT); break;
               case 'i': this.tool.setCurrentTool(TOOL_TYPES.IMAGE); break;
               case 'l': this.tool.setCurrentTool(TOOL_TYPES.LINE); break;
           }
       }
   }

   cleanup() {
       this.tool.canvas.removeEventListener('mousedown', this.handleMouseDown);
       this.tool.canvas.removeEventListener('mousemove', this.handleMouseMove);
       this.tool.canvas.removeEventListener('mouseup', this.handleMouseUp);
       document.removeEventListener('keydown', this.handleKeyDown);
       
       document.querySelectorAll('.tool-button').forEach(button => {
           button.replaceWith(button.cloneNode(true));
       });
   }
}