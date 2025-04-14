# Document Editor

A browser-based diagram and document editor that allows users to create, edit, and connect shapes in a canvas interface.

[Try the live demo](https://adiel2012.github.io/DocumentEditor/index.html)

## Features

- Multiple document tabs support
- Rectangle, text, and image shapes
- Line connections between shapes
- Selection and manipulation of shapes and lines
- Grid with snapping options
- Save and load documents

## Architecture

The application follows a modular architecture with the following components:

### Core Components

- **DiagramTool**: Main controller for the canvas and diagram operations
- **DocumentManager**: Handles multiple documents and tabs
- **EventHandler**: Processes user input
- **GridHelper**: Manages the grid and snapping functionality
- **LineManager**: Creates and manages lines
- **SelectionManager**: Handles selection of shapes and lines
- **ShapeFactory**: Creates shapes based on requested types

### Shapes

Shapes are built using a base class with type-specific implementations:

- **Shape**: Abstract base class that defines common properties and methods
- **RectangleShape**: Implementation of a rectangular shape
- **TextShape**: Implementation of a text box
- **ImageShape**: Implementation of an image container

### CSS Structure

CSS is organized by component and shape type:

- **Main CSS**: `css/styles.css` - Imports all other CSS files
- **Component CSS**: Located in `css/components/`
- **Shape-specific CSS**: Located in `css/shapes/`

## Extending the Application

### Adding a New Shape

To add a new shape type (e.g., Circle), follow these steps:

1. **Create the Shape Class:**

   Create a new file `js/modules/shapes/shapes/CircleShape.js`:

   ```javascript
   import { Shape } from '../Shape.js';
   import { SHAPE_TYPES } from '../../../utils/constants.js';

   export class CircleShape extends Shape {
       constructor(id, x, y, width, height, fillColor = '#f0f0f0') {
           super(id, x, y, width, height);
           this.fillColor = fillColor;
       }
       
       getShapeType() {
           return SHAPE_TYPES.CIRCLE;
       }
       
       renderContent() {
           // Apply circle-specific styling to the element
           this.element.style.borderRadius = '50%';
           this.element.style.backgroundColor = this.fillColor;
       }
       
       toJSON() {
           const baseData = super.toJSON();
           return {
               ...baseData,
               fillColor: this.fillColor
           };
       }
   }
   ```

2. **Update Constants:**

   Add the new shape type to `js/utils/constants.js`:

   ```javascript
   export const SHAPE_TYPES = {
       RECTANGLE: 'rectangle',
       TEXT: 'text',
       IMAGE: 'image',
       CIRCLE: 'circle'  // Add new shape type
   };
   ```

3. **Register in ShapeFactory:**

   Update `js/modules/shapes/ShapeFactory.js`:

   ```javascript
   import { CircleShape } from './shapes/CircleShape.js';
   
   // Then add it to the registry
   static shapeRegistry = new Map([
       [SHAPE_TYPES.RECTANGLE, RectangleShape],
       [SHAPE_TYPES.TEXT, TextShape],
       [SHAPE_TYPES.IMAGE, ImageShape],
       [SHAPE_TYPES.CIRCLE, CircleShape]  // Add new shape
   ]);
   ```

4. **Create the CSS:**

   Create a file `css/shapes/circle.css`:

   ```css
   /* Circle Shape Styles */
   .shape.circle {
     border-radius: 50%;
   }
   ```

5. **Import the CSS:**

   Add to `css/styles.css`:

   ```css
   @import 'shapes/circle.css';
   ```

6. **Add UI Element:**

   Add a button for the shape in `index.html`:

   ```html
   <button class="tool-button" data-tool="circle" title="Circle Tool (C)">
       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>
   </button>
   ```

7. **Add Keyboard Shortcut:**

   Update `js/modules/eventHandler.js`:

   ```javascript
   // In the handleKeyDown method
   case 'c': this.tool.setCurrentTool(TOOL_TYPES.CIRCLE); break;
   ```

8. **Add Tooltip:**

   Update `js/main.js`:

   ```javascript
   getToolTip(tool) {
       const tooltips = {
           // Existing tooltips...
           'circle': 'Circle Tool (C)',
       };
       return tooltips[tool] || tool;
   }
   ```

## Development

### Prerequisites

- Modern web browser
- Local web server for development

### Running Locally

1. Clone the repository
2. Start a local web server in the project directory
3. Open the application in your browser (e.g., http://localhost:8000)

### Project Structure

```
DocumentEditor/
├── css/
│   ├── components/       # Component-specific CSS
│   ├── shapes/           # Shape-specific CSS
│   └── styles.css        # Main CSS file
├── js/
│   ├── modules/
│   │   ├── lines/        # Line-related functionality
│   │   ├── shapes/       # Shape class definitions
│   │   │   └── shapes/   # Individual shape implementations
│   │   ├── diagramTool.js
│   │   ├── documentManager.js
│   │   ├── eventHandler.js
│   │   ├── eventLogic.js
│   │   ├── gridHelper.js
│   │   └── selectionManager.js
│   ├── utils/
│   │   └── constants.js
│   └── main.js
└── index.html
```

## License

This project is open-source and available for use, modification, and distribution.