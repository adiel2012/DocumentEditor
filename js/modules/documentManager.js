import { DiagramTool } from './diagramTool.js';

export class DocumentManager {
    constructor() {
        this.documents = new Map();
        this.activeDocument = null;
        this.documentCounter = 0;
        this.isSaving = false;  
        
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
            const newButton = newDocButton.cloneNode(true);
            newDocButton.parentNode.replaceChild(newButton, newDocButton);
            
            newButton.addEventListener('click', () => {
                this.createNewDocument();
            });
        }

        // Open document button and file input
        const openDocButton = document.getElementById('open-doc');
        const fileInput = document.getElementById('file-input');
        if (openDocButton && fileInput) {
            const newOpenButton = openDocButton.cloneNode(true);
            openDocButton.parentNode.replaceChild(newOpenButton, openDocButton);
            
            newOpenButton.addEventListener('click', () => {
                fileInput.click();
            });

            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    console.log('Loading document:', file.name);
                    this.loadDocument(file);
                    fileInput.value = '';  // Reset file input
                }
            });
        }

        // Save document button
        const saveDocButton = document.getElementById('save-doc');
        if (saveDocButton) {
            console.log('Setting up save button handler');
            const newButton = saveDocButton.cloneNode(true);
            saveDocButton.parentNode.replaceChild(newButton, saveDocButton);
            
            const handleSave = async (e) => {
                console.log('Save button clicked', e.isTrusted ? 'User Click' : 'Programmatic Click');
                
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                if (newButton.disabled) {
                    console.log('Save already in progress, ignoring');
                    return;
                }
                
                if (this.activeDocument) {
                    await this.saveDocument(this.activeDocument.id);
                }
            };
            
            newButton.replaceWith(newButton.cloneNode(true));
            const finalButton = document.getElementById('save-doc');
            finalButton.addEventListener('click', handleSave);
        }

        // Handle tab bar scroll
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
        
        const docElement = document.createElement('div');
        docElement.className = 'document';
        docElement.id = docId;
        
        const canvas = document.createElement('div');
        canvas.className = 'canvas';
        docElement.appendChild(canvas);
        
        this.container.appendChild(docElement);
        
        const tab = this.createTab(docId, this.documentCounter);
        this.tabsBar.appendChild(tab);
        
        const diagram = new DiagramTool(canvas);
        
        const docInfo = {
            id: docId,
            element: docElement,
            tab: tab,
            diagram: diagram,
            name: `Document ${this.documentCounter}`
        };
        
        this.documents.set(docId, docInfo);
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
        
        tab.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close')) {
                this.activateDocument(docId);
            }
        });
        
        const closeButton = tab.querySelector('.tab-close');
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeDocument(docId);
        });

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
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'tab-rename-input';
        
        nameSpan.replaceWith(input);
        input.focus();
        input.select();

        const finishRename = () => {
            const newName = input.value.trim() || currentName;
            nameSpan.textContent = newName;
            input.replaceWith(nameSpan);
            doc.name = newName;
        };

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
        if (this.activeDocument) {
            this.activeDocument.element.classList.remove('active');
            this.activeDocument.tab.classList.remove('active');
        }
        
        const doc = this.documents.get(docId);
        if (doc) {
            doc.element.classList.add('active');
            doc.tab.classList.add('active');
            this.activeDocument = doc;

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

        if (doc.diagram && doc.diagram.hasUnsavedChanges) {
            const confirmClose = window.confirm('This document has unsaved changes. Do you want to close it anyway?');
            if (!confirmClose) return;
        }
        
        doc.element.remove();
        doc.tab.remove();
        
        if (doc.diagram && typeof doc.diagram.cleanup === 'function') {
            doc.diagram.cleanup();
        }
        
        this.documents.delete(docId);
        
        if (this.activeDocument && this.activeDocument.id === docId) {
            const nextDoc = Array.from(this.documents.values())[0];
            if (nextDoc) {
                this.activateDocument(nextDoc.id);
            } else {
                this.activeDocument = null;
                this.createNewDocument();
            }
        }
    }

    async saveDocument(docId) {
        console.log('saveDocument called with docId:', docId);
        
        if (this.isSaving) {
            console.log('Save already in progress, ignoring');
            return;
        }
        
        const doc = this.documents.get(docId);
        if (!doc || !doc.diagram) {
            console.log('No document found or no diagram');
            return;
        }

        this.isSaving = true;
        
        const saveButton = document.getElementById('save-doc');
        const originalText = saveButton ? saveButton.textContent : 'Save';
        console.log('Starting save process');

        try {
            if (saveButton) {
                saveButton.textContent = 'Saving...';
                saveButton.disabled = true;
            }

            console.log('Getting diagram data');
            const diagramData = await doc.diagram.getSerializableData();
            
            const blob = new Blob([JSON.stringify(diagramData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${doc.name.replace(/\s+/g, '_')}.json`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            doc.diagram.hasUnsavedChanges = false;

            if (saveButton) {
                saveButton.textContent = originalText;
                saveButton.disabled = false;
            }
            
            this.isSaving = false;
            
        } catch (error) {
            console.error('Error saving document:', error);
            alert('Failed to save document. Please try again.');
            
            if (saveButton) {
                saveButton.textContent = 'Save';
                saveButton.disabled = false;
            }
            
            this.isSaving = false;
        }
    }

    loadDocument(file) {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                console.log('File read successfully, parsing content...');
                const content = e.target.result;
                const data = JSON.parse(content);
                
                console.log('Creating new document...');
                const doc = this.createNewDocument();
                
                if (doc && doc.diagram) {
                    console.log('Loading data into diagram...');
                    await doc.diagram.loadFromData(data);
                    doc.name = file.name.replace(/\.json$/, '');
                    doc.tab.querySelector('span:first-child').textContent = doc.name;
                    console.log('Document loaded successfully');
                } else {
                    console.error('Failed to create new document or diagram');
                }
            } catch (error) {
                console.error('Error loading document:', error);
                alert(`Failed to load document. Error: ${error.message}`);
            }
        };
        
        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            alert('Error reading file. Please try again.');
        };
        
        console.log('Starting to read file:', file.name);
        reader.readAsText(file);
    }

    getActiveDocument() {
        return this.activeDocument;
    }

    closeAllDocuments() {
        const docIds = Array.from(this.documents.keys());
        docIds.forEach(id => this.closeDocument(id));
    }

    cleanup() {
        const saveButton = document.getElementById('save-doc');
        if (saveButton) {
            const newButton = saveButton.cloneNode(true);
            saveButton.parentNode.replaceChild(newButton, saveButton);
        }

        const openButton = document.getElementById('open-doc');
        if (openButton) {
            const newButton = openButton.cloneNode(true);
            openButton.parentNode.replaceChild(newButton, newButton);
        }

        const newDocButton = document.getElementById('new-doc');
        if (newDocButton) {
            const newButton = newDocButton.cloneNode(true);
            newDocButton.parentNode.replaceChild(newButton, newButton);
        }

        this.closeAllDocuments();
    }
}