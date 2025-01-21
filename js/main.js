import { DocumentManager } from './modules/documentManager.js';

class Application {
    constructor() {
        this.documentManager = null;
        this.init();
    }

    init() {
        // Initialize document manager
        this.documentManager = new DocumentManager();

        // Create initial document
        this.documentManager.createNewDocument();

        // Set up global keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Set up main toolbar actions
        this.setupMainToolbar();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl + N: New Document
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.documentManager.createNewDocument();
            }

            // Ctrl + S: Save Document
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                if (this.documentManager.activeDocument) {
                    this.documentManager.saveDocument(this.documentManager.activeDocument.id);
                }
            }

            // Ctrl + W: Close Current Document
            if (e.ctrlKey && e.key === 'w') {
                e.preventDefault();
                if (this.documentManager.activeDocument) {
                    this.documentManager.closeDocument(this.documentManager.activeDocument.id);
                }
            }
        });
    }

    setupMainToolbar() {
        // New Document Button
        const newDocButton = document.getElementById('new-doc');
        if (newDocButton) {
            newDocButton.addEventListener('click', () => {
                this.documentManager.createNewDocument();
            });
        }

        // Save Document Button
        const saveDocButton = document.getElementById('save-doc');
        if (saveDocButton) {
            saveDocButton.addEventListener('click', () => {
                if (this.documentManager.activeDocument) {
                    this.documentManager.saveDocument(this.documentManager.activeDocument.id);
                }
            });

            // Add tooltip or title
            saveDocButton.title = 'Save Document (Ctrl+S)';
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
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new Application();
});

// Prevent browser's default file drag behavior
document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.app && window.app.documentManager) {
        // Update active document if needed
        const activeDoc = window.app.documentManager.activeDocument;
        if (activeDoc && activeDoc.diagram) {
            activeDoc.diagram.handleResize();
        }
    }
});

// Handle browser closing
window.addEventListener('beforeunload', (e) => {
    if (window.app && window.app.documentManager) {
        // Check for unsaved changes
        const hasUnsavedChanges = Array.from(window.app.documentManager.documents.values())
            .some(doc => doc.diagram && doc.diagram.hasUnsavedChanges);

        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        }
    }
});