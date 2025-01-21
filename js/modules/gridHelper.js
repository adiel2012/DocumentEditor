export class GridHelper {
    constructor(gridSize = 20, largeGridSize = 100) {
        // Basic configuration
        this.gridSize = gridSize;
        this.largeGridSize = largeGridSize;
        this.enabled = true;
        
        // Snap thresholds
        this.snapThreshold = gridSize / 2;
        
        // Minimum dimensions for shapes
        this.minWidth = 100;
        this.minHeight = 60;
    }

    /**
     * Snaps a single value to the nearest grid point
     * @param {number} value - The value to snap
     * @param {number} [customGridSize] - Optional custom grid size for this operation
     * @returns {number} The snapped value
     */
    snapToGrid(value, customGridSize) {
        if (!this.enabled) return value;
        
        const gridSize = customGridSize || this.gridSize;
        return Math.round(value / gridSize) * gridSize;
    }

    /**
     * Snaps dimensions to the grid while respecting minimum sizes
     * @param {number} width - The width to snap
     * @param {number} height - The height to snap
     * @returns {Object} Object containing snapped width and height
     */
    snapDimensions(width, height) {
        if (!this.enabled) return { width, height };

        return {
            width: Math.max(this.minWidth, this.snapToGrid(width)),
            height: Math.max(this.minHeight, this.snapToGrid(height))
        };
    }

    /**
     * Snaps a position (x,y coordinates) to the grid
     * @param {number} x - The x coordinate
     * @param {number} y - The y coordinate
     * @returns {Object} Object containing snapped x and y coordinates
     */
    snapPosition(x, y) {
        if (!this.enabled) return { x, y };

        return {
            x: this.snapToGrid(x),
            y: this.snapToGrid(y)
        };
    }

    /**
     * Snaps a line's endpoint to the nearest grid intersection
     * @param {number} x - The x coordinate
     * @param {number} y - The y coordinate
     * @returns {Object} Object containing snapped coordinates
     */
    snapLineEndpoint(x, y) {
        if (!this.enabled) return { x, y };

        return {
            x: this.snapToGrid(x),
            y: this.snapToGrid(y)
        };
    }

    /**
     * Calculates the nearest connection point on a shape to a given position
     * @param {Object} shape - The shape element
     * @param {number} x - The x coordinate to connect to
     * @param {number} y - The y coordinate to connect to
     * @returns {Object} The nearest connection point coordinates
     */
    getNearestConnectionPoint(shape, x, y) {
        const rect = shape.getBoundingClientRect();
        const points = [
            { x: rect.left + rect.width / 2, y: rect.top }, // top
            { x: rect.right, y: rect.top + rect.height / 2 }, // right
            { x: rect.left + rect.width / 2, y: rect.bottom }, // bottom
            { x: rect.left, y: rect.top + rect.height / 2 } // left
        ];

        return points.reduce((nearest, point) => {
            const distance = Math.hypot(point.x - x, point.y - y);
            if (distance < nearest.distance) {
                return { ...point, distance };
            }
            return nearest;
        }, { ...points[0], distance: Infinity });
    }

    /**
     * Toggles the grid on/off
     * @returns {boolean} The new state of the grid
     */
    toggleGrid() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    /**
     * Sets a new grid size
     * @param {number} size - The new grid size in pixels
     */
    setGridSize(size) {
        if (size > 0) {
            this.gridSize = size;
            this.snapThreshold = size / 2;
        }
    }

    /**
     * Sets a new large grid size
     * @param {number} size - The new large grid size in pixels
     */
    setLargeGridSize(size) {
        if (size > this.gridSize) {
            this.largeGridSize = size;
        }
    }

    /**
     * Gets the current grid configuration
     * @returns {Object} The current grid configuration
     */
    getGridConfig() {
        return {
            enabled: this.enabled,
            gridSize: this.gridSize,
            largeGridSize: this.largeGridSize,
            snapThreshold: this.snapThreshold,
            minWidth: this.minWidth,
            minHeight: this.minHeight
        };
    }

    /**
     * Determines if a point is close enough to snap to the grid
     * @param {number} value - The value to check
     * @param {number} gridLine - The grid line value to snap to
     * @returns {boolean} Whether the point should snap
     */
    shouldSnap(value, gridLine) {
        return Math.abs(value - gridLine) <= this.snapThreshold;
    }
}