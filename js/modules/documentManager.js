import { DiagramTool } from './diagramTool.js';

class DocumentManager {
    constructor() {
        this.documents = new Map();
        this.activeDocument = null;
        this.documentCounter = 0;
        
        this.tabsBar = document.getElementById('tabs-bar');
        this.container = document.getElementById('documents-container');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('new-doc').addEventListener('click', () => {
            this.createNewDocument();
        });

        document.getElementById('save-doc').addEventListener('click', () => {
            if (this.activeDocument) {
                this.saveDocument(this.activeDocument.id);
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
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.innerHTML = `
            <span>Document ${this.documentCounter}</span>
            <span class="tab-close">×</span>
        `;
        
        // Tab events
        tab.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close')) {
                this.activateDocument(docId);
            }
        });
        
        tab.querySelector('.tab-close').addEventListener('click', () => {
            this.closeDocument(docId);
        });
        
        this.tabsBar.appendChild(tab);
        
        // Create DiagramTool instance
        const diagram = new DiagramTool(canvas);
        
        // Store document info
        this.documents.set(docId, {
            id: docId,
            element: docElement,
            tab: tab,
            diagram: diagram
        });
        
        // Activate new document
        this.activateDocument(docId);
    }

    activateDocument(docId) {
        // Deactivate current
        if (this.activeDocument) {
            this.activeDocument.element.classList.remove('active');
            this.activeDocument.tab.classList.remove('active');
        }
        
        // Activate new
        const doc = this.documents.get(docId);
        if (doc) {
            doc.element.classList.add('active');
            doc.tab.classList.add('active');
            this.activeDocument = doc;
        }
    }

    closeDocument(docId) {
        const doc = this.documents.get(docId);
        if (!doc) return;
        
        // Remove elements
        doc.element.remove();
        doc.tab.remove();
        
        // Remove from collection
        this.documents.delete(docId);
        
        // If closing active document, activate another
        if (this.activeDocument && this.activeDocument.id === docId) {
            const nextDoc = this.documents.values().next().value;
            if (nextDoc) {
                this.activateDocument(nextDoc.id);
            } else {
                this.activeDocument = null;
            }
        }
    }

    saveDocument(docId) {
        const doc = this.documents.get(docId);
        if (!doc) return;
        
        // Implement save functionality here
        console.log('Saving document:', docId);
    }
}

export { DocumentManager };