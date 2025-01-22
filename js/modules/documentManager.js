import { DiagramTool } from './diagramTool.js';

export class DocumentManager {
    constructor() {
        this.documents = new Map();
        this.activeDocument = null;
        this.documentCounter = 0;
        
        // Cache DOM elements
        this.tabsBar = document.getElementById('tabs-bar');
        this.container = document.getElementById('documents-container');
        
        // Initialize event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // New document button
        const newDocButton = document.getElementById('new-doc');
        if (newDocButton) {
            newDocButton.addEventListener('click', () => {
                this.createNewDocument();
            });
        }

        // Save document button
        const saveDocButton = document.getElementById('save-doc');
        if (saveDocButton) {
            console.log('Setting up save button handler');
            const newButton = saveDocButton.cloneNode(true);
            saveDocButton.parentNode.replaceChild(newButton, saveDocButton);
            
            // Use a single click handler
            const handleSave = async (e) => {
                console.log('Save button clicked', e.isTrusted ? 'User Click' : 'Programmatic Click');
                
                // Prevent handling the same event multiple times
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                // Prevent multiple simultaneous saves
                if (newButton.disabled) {
                    console.log('Save already in progress, ignoring');
                    return;
                }
                
                if (this.activeDocument) {
                    await this.saveDocument(this.activeDocument.id);
                }
            };
            
            // Remove any existing listeners before adding new one
            newButton.replaceWith(newButton.cloneNode(true));
            const finalButton = document.getElementById('save-doc');
            finalButton.addEventListener('click', handleSave);
        }

        // Handle tab bar scroll for many tabs
        this.tabsBar.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.tabsBar.scrollLeft += e.deltaY;
        });

        // Handle file drops
        this.container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        this.container.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const files = Array.from(e.dataTransfer.files);
            const jsonFiles = files.filter(file => file.name.endsWith('.json'));
            
            if (jsonFiles.length > 0) {
                this.loadDocument(jsonFiles[0]);
            }
        });
    }

    createNewDocument() {
        const docId = `doc-${++this.documentCounter}`;
        
        // Create document container
        const docElement = document.createElement('div');
        docElement.className = 'document';
        docElement.id = docId;
        
        // Create canvas
        const canvas = document.createElement('div');
        canvas.className = 'canvas';
        docElement.appendChild(canvas);
        
        // Add to container
        this.container.appendChild(docElement);
        
        // Create tab
        const tab = this.createTab(docId, this.documentCounter);
        this.tabsBar.appendChild(tab);
        
        // Create DiagramTool instance
        const diagram = new DiagramTool(canvas);
        
        // Store document info
        const docInfo = {
            id: docId,
            element: docElement,
            tab: tab,
            diagram: diagram,
            name: `Document ${this.documentCounter}`
        };
        
        this.documents.set(docId, docInfo);
        
        // Activate new document
        this.activateDocument(docId);
        
        return docInfo;
    }

    createTab(docId, number) {
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.innerHTML = `
            <span>Document ${number}</span>
            <span class="tab-close">×</span>
        `;
        
        // Tab click event (for activation)
        tab.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close')) {
                this.activateDocument(docId);
            }
        });
        
        // Close button click event
        const closeButton = tab.querySelector('.tab-close');
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeDocument(docId);
        });

        // Double click to rename
        tab.querySelector('span:first-child').addEventListener('dblclick', (e) => {
            this.startRenameDocument(docId);
        });
        
        return tab;
    }

    startRenameDocument(docId) {
        const doc = this.documents.get(docId);
        if (!doc) return;

        const nameSpan = doc.tab.querySelector('span:first-child');
        const currentName = nameSpan.textContent;
        
        // Create input element
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'tab-rename-input';
        
        // Replace span with input
        nameSpan.replaceWith(input);
        input.focus();
        input.select();

        const finishRename = () => {
            const newName = input.value.trim() || currentName;
            nameSpan.textContent = newName;
            input.replaceWith(nameSpan);
            doc.name = newName;
        };

        // Handle input events
        input.addEventListener('blur', finishRename);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                finishRename();
            } else if (e.key === 'Escape') {
                nameSpan.textContent = currentName;
                input.replaceWith(nameSpan);
            }
        });
    }

    activateDocument(docId) {
        // Deactivate current document
        if (this.activeDocument) {
            this.activeDocument.element.classList.remove('active');
            this.activeDocument.tab.classList.remove('active');
        }
        
        // Activate new document
        const doc = this.documents.get(docId);
        if (doc) {
            doc.element.classList.add('active');
            doc.tab.classList.add('active');
            this.activeDocument = doc;

            // Ensure tab is visible
            const tabRect = doc.tab.getBoundingClientRect();
            const barRect = this.tabsBar.getBoundingClientRect();
            
            if (tabRect.left < barRect.left) {
                this.tabsBar.scrollLeft += tabRect.left - barRect.left;
            } else if (tabRect.right > barRect.right) {
                this.tabsBar.scrollLeft += tabRect.right - barRect.right;
            }
        }
    }

    closeDocument(docId) {
        const doc = this.documents.get(docId);
        if (!doc) return;

        // Check for unsaved changes
        if (doc.diagram && doc.diagram.hasUnsavedChanges) {
            const confirmClose = window.confirm('This document has unsaved changes. Do you want to close it anyway?');
            if (!confirmClose) return;
        }
        
        // Remove DOM elements
        doc.element.remove();
        doc.tab.remove();
        
        // Clean up any diagram resources
        if (doc.diagram && typeof doc.diagram.cleanup === 'function') {
            doc.diagram.cleanup();
        }
        
        // Remove from collection
        this.documents.delete(docId);
        
        // If closing active document, activate another
        if (this.activeDocument && this.activeDocument.id === docId) {
            const nextDoc = Array.from(this.documents.values())[0];
            if (nextDoc) {
                this.activateDocument(nextDoc.id);
            } else {
                this.activeDocument = null;
                this.createNewDocument(); // Create new document if none left
            }
        }
    }

    async saveDocument(docId) {
        console.log('saveDocument called with docId:', docId);
        const doc = this.documents.get(docId);
        if (!doc || !doc.diagram) {
            console.log('No document found or no diagram');
            return;
        }

        // Get save button and store original text
        const saveButton = document.getElementById('save-doc');
        const originalText = saveButton ? saveButton.textContent : 'Save';
        console.log('Starting save process');

        try {
            // Show loading state
            if (saveButton) {
                saveButton.textContent = 'Saving...';
                saveButton.disabled = true;
            }

            // Get diagram data (now returns a promise)
            console.log('Getting diagram data');
            const diagramData = await doc.diagram.getSerializableData();
            
            // Create blob and download link
            const blob = new Blob([JSON.stringify(diagramData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${doc.name.replace(/\s+/g, '_')}.json`;
            
            // Trigger download
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Cleanup
            URL.revokeObjectURL(url);
            
            // Reset unsaved changes flag
            doc.diagram.hasUnsavedChanges = false;

            // Restore button state
            if (saveButton) {
                saveButton.textContent = originalText;
                saveButton.disabled = false;
            }
            
        } catch (error) {
            console.error('Error saving document:', error);
            alert('Failed to save document. Please try again.');
            
            // Restore button state on error
            const saveButton = document.getElementById('save-doc');
            if (saveButton) {
                saveButton.textContent = 'Save';
                saveButton.disabled = false;
            }
        }
    }

    loadDocument(file) {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const doc = this.createNewDocument();
                
                if (doc && doc.diagram) {
                    await doc.diagram.loadFromData(data);
                    doc.name = file.name.replace(/\.json$/, '');
                    doc.tab.querySelector('span:first-child').textContent = doc.name;
                }
            } catch (error) {
                console.error('Error loading document:', error);
                alert('Failed to load document. The file might be corrupted or in wrong format.');
            }
        };
        
        reader.onerror = () => {
            alert('Error reading file. Please try again.');
        };
        
        reader.readAsText(file);
    }

    getActiveDocument() {
        return this.activeDocument;
    }

    closeAllDocuments() {
        // Create array of IDs first to avoid modifying collection during iteration
        const docIds = Array.from(this.documents.keys());
        docIds.forEach(id => this.closeDocument(id));
    }

    cleanup() {
        // Remove event listeners
        const saveButton = document.getElementById('save-doc');
        if (saveButton) {
            const newButton = saveButton.cloneNode(true);
            saveButton.parentNode.replaceChild(newButton, saveButton);
        }

        const newDocButton = document.getElementById('new-doc');
        if (newDocButton) {
            const newButton = newDocButton.cloneNode(true);
            newDocButton.parentNode.replaceChild(newButton, newDocButton);
        }

        // Close all documents
        this.closeAllDocuments();
    }
}