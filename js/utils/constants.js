export const SHAPE_TYPES = {
    RECTANGLE: 'rectangle',
    TEXT: 'text',
    IMAGE: 'image'
};

export const TOOL_TYPES = {
    SELECT: 'select',
    LINE: 'line',
    ...SHAPE_TYPES
};

export const MIN_DIMENSIONS = {
    WIDTH: 100,
    HEIGHT: 60
};

export const CONNECTION_POINTS = ['top', 'right', 'bottom', 'left'];

export const DEFAULT_STYLES = {
    LINE_COLOR: '#333',
    LINE_WIDTH: '2',
    SELECTION_COLOR: '#2196f3',
    SELECTION_SHADOW: '0 0 10px rgba(33, 150, 243, 0.3)'
};