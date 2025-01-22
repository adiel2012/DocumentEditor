import { DocumentManager } from './modules/documentManager.js';

class Application {
    constructor() {
        console.log('Application constructor called');
        this.documentManager = null;
        this.init();
    }

    init() {
        console.log('Initializing application');
        // Initialize document manager
        this.documentManager = new DocumentManager();

        // Create initial document
        this.documentManager.createNewDocument();

        // Set up global keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Set up main toolbar actions
        this.setupMainToolbar();
        console.log('Application initialization complete');
    }

    setupKeyboardShortcuts() {
        const handleKeyDown = async (e) => {
            // Ctrl + N: New Document
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.documentManager.createNewDocument();
            }

            // Ctrl + O: Open Document
            if (e.ctrlKey && e.key === 'o') {
                e.preventDefault();
                const fileInput = document.getElementById('file-input');
                if (fileInput) fileInput.click();
            }

            // Ctrl + S: Save Document
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                if (this.documentManager.activeDocument) {
                    await this.documentManager.saveDocument(this.documentManager.activeDocument.id);
                }
            }

            // Ctrl + W: Close Current Document
            if (e.ctrlKey && e.key === 'w') {
                e.preventDefault();
                if (this.documentManager.activeDocument) {
                    this.documentManager.closeDocument(this.documentManager.activeDocument.id);
                }
            }
        };

        // Remove any existing listeners and add new one
        document.removeEventListener('keydown', handleKeyDown);
        document.addEventListener('keydown', handleKeyDown);
    }

    setupMainToolbar() {
        // New Document Button
        const newDocButton = document.getElementById('new-doc');
        if (newDocButton) {
            const newButton = newDocButton.cloneNode(true);
            newDocButton.parentNode.replaceChild(newButton, newDocButton);
            
            newButton.addEventListener('click', () => {
                this.documentManager.createNewDocument();
            });
            newButton.title = 'New Document (Ctrl+N)';
        }

        // Open Document Button
        const openDocButton = document.getElementById('open-doc');
        if (openDocButton) {
            openDocButton.title = 'Open Document (Ctrl+O)';
        }

        // Set up tooltips for all toolbar buttons
        document.querySelectorAll('.tool-button').forEach(button => {
            const tool = button.dataset.tool;
            if (tool) {
                button.title = this.getToolTip(tool);
            }
        });
    }

    getToolTip(tool) {
        const tooltips = {
            'select': 'Select Tool (V)',
            'rectangle': 'Rectangle Tool (R)',
            'text': 'Text Tool (T)',
            'image': 'Image Tool (I)',
            'line': 'Line Tool (L)',
            'delete': 'Delete Selected (Del)'
        };
        return tooltips[tool] || tool;
    }

    cleanup() {
        // Cleanup document manager
        if (this.documentManager) {
            this.documentManager.cleanup();
        }

        // Remove event listeners
        document.removeEventListener('keydown', this.setupKeyboardShortcuts);
    }
}

// Initialize the application when the DOM is loaded
let app = null;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded - creating application instance');
    if (app) {
        console.warn('Application instance already exists!');
        return;
    }
    app = new Application();
    window.app = app; // Make app accessible globally if needed
});

// Prevent browser's default file drag behavior
document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
});

// Handle window resize
let resizeTimeout = null;
window.addEventListener('resize', () => {
    // Debounce resize events
    if (resizeTimeout) {
        clearTimeout(resizeTimeout);
    }
    
    resizeTimeout = setTimeout(() => {
        if (app && app.documentManager) {
            // Update active document if needed
            const activeDoc = app.documentManager.activeDocument;
            if (activeDoc && activeDoc.diagram) {
                activeDoc.diagram.handleResize();
            }
        }
        resizeTimeout = null;
    }, 100);
});

// Handle browser closing
window.addEventListener('beforeunload', (e) => {
    if (app && app.documentManager) {
        // Check for unsaved changes
        const hasUnsavedChanges = Array.from(app.documentManager.documents.values())
            .some(doc => doc.diagram && doc.diagram.hasUnsavedChanges);

        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        }
    }
});

// Handle cleanup when window unloads
window.addEventListener('unload', () => {
    if (app) {
        app.cleanup();
    }
});