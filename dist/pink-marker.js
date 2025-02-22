"use strict";
const defaultOptions = {
    modalClass: '',
    modalTextareaClass: '',
    modalButtonContainerClass: '',
    saveButtonClass: '',
    cancelButtonClass: '',
    deleteButtonClass: '',
    saveButtonText: 'Save',
    cancelButtonText: 'Cancel',
    deleteButtonText: 'Delete',
    overlayColor: 'rgba(255,105,180,0.5)',
    iconClass: '',
    iconContainerClass: '',
    iconContainerTitle: 'Click to open modal',
    defaultIcon: './icon.svg',
};
class PinkMarker {
    constructor(options) {
        this.annotations = [];
        this.updateAnnotations = () => {
            this.removeAnnotation();
            this.annotations.forEach((annotation) => {
                this.highlightSelectionFromEncoding(annotation.encoding);
                this.attachIcon(annotation.encoding, annotation.icon);
            });
        };
        this.options = Object.assign(Object.assign({}, defaultOptions), options);
    }
    init() {
        document.addEventListener('mouseup', () => {
            const sel = window.getSelection();
            if (sel && sel.toString().trim()) {
                const encoding = this.encodeSelection();
                if (encoding) {
                    this.showModal(encoding, '', (newNote) => {
                        this.annotations.push({
                            encoding,
                            note: newNote,
                            icon: this.options.defaultIcon,
                        });
                    });
                    this.highlightSelectionFromEncoding(encoding);
                    this.attachIcon(encoding, this.options.defaultIcon);
                }
            }
        });
        window.addEventListener('resize', this.updateAnnotations);
        window.addEventListener('orientationchange', this.updateAnnotations);
    }
    createTextNodeIndexMap(root = document.body) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) {
            nodes.push(walker.currentNode);
        }
        return nodes;
    }
    encodeNumber(num) {
        const base = 52;
        return this.toBase52Char(Math.floor(num / base)) + this.toBase52Char(num % base);
    }
    toBase52Char(n) {
        return n < 26 ? String.fromCharCode(65 + n) : String.fromCharCode(97 + n - 26);
    }
    decodeNumber(str) {
        if (str.length !== 2)
            throw new Error('decodeNumber expects a string of length 2');
        return this.fromBase52Char(str.charAt(0)) * 52 + this.fromBase52Char(str.charAt(1));
    }
    fromBase52Char(ch) {
        const code = ch.charCodeAt(0);
        if (code >= 65 && code < 91)
            return code - 65;
        if (code >= 97 && code < 123)
            return code - 97 + 26;
        throw new Error('Invalid character for Base52: ' + ch);
    }
    getFirstTextNode(node) {
        if (node.nodeType === Node.TEXT_NODE)
            return node;
        for (let i = 0; i < node.childNodes.length; i++) {
            const text = this.getFirstTextNode(node.childNodes[i]);
            if (text)
                return text;
        }
        return null;
    }
    getLastTextNodeFrom(node) {
        if (node.nodeType === Node.TEXT_NODE)
            return node;
        for (let i = node.childNodes.length - 1; i >= 0; i--) {
            const text = this.getLastTextNodeFrom(node.childNodes[i]);
            if (text)
                return text;
        }
        return null;
    }
    getLastTextNodeBefore(node) {
        let sibling = node.previousSibling;
        while (sibling) {
            if (sibling.nodeType === Node.TEXT_NODE) {
                return sibling;
            }
            const text = this.getLastTextNodeFrom(sibling);
            if (text)
                return text;
            sibling = sibling.previousSibling;
        }
        return null;
    }
    encodeSelection() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0)
            return null;
        const range = selection.getRangeAt(0);
        if (range.startContainer.nodeType !== Node.TEXT_NODE) {
            const firstText = this.getFirstTextNode(range.startContainer);
            if (firstText) {
                range.setStart(firstText, 0);
            }
            else {
                return null;
            }
        }
        if (range.endContainer.nodeType !== Node.TEXT_NODE) {
            const lastText = this.getLastTextNodeBefore(range.endContainer);
            if (lastText) {
                const offset = lastText.textContent ? lastText.textContent.length : 0;
                range.setEnd(lastText, offset);
            }
            else {
                return null;
            }
        }
        const textNodes = this.createTextNodeIndexMap(document.body);
        const startIndex = textNodes.indexOf(range.startContainer);
        const endIndex = textNodes.indexOf(range.endContainer);
        if (startIndex === -1 || endIndex === -1)
            return null;
        return ('!{' +
            this.encodeNumber(startIndex) +
            this.encodeNumber(range.startOffset) +
            this.encodeNumber(endIndex) +
            this.encodeNumber(range.endOffset) +
            '}');
    }
    decodeSelection(encoding) {
        if (!encoding.startsWith('!{') || !encoding.endsWith('}'))
            return null;
        const inner = encoding.slice(2, -1);
        if (inner.length !== 8)
            return null;
        const startIndex = this.decodeNumber(inner.slice(0, 2));
        const startOffset = this.decodeNumber(inner.slice(2, 4));
        const endIndex = this.decodeNumber(inner.slice(4, 6));
        const endOffset = this.decodeNumber(inner.slice(6, 8));
        const textNodes = this.createTextNodeIndexMap(document.body);
        const startNode = textNodes[startIndex];
        const endNode = textNodes[endIndex];
        if (!startNode || !endNode)
            return null;
        const range = document.createRange();
        try {
            range.setStart(startNode, startOffset);
            range.setEnd(endNode, endOffset);
        }
        catch (_a) {
            return null;
        }
        return range;
    }
    filterRects(rects) {
        return rects.filter((rect) => !rects.some((other) => {
            if (rect === other)
                return false;
            return rect.left >= other.left && rect.top >= other.top && rect.right <= other.right && rect.bottom <= other.bottom;
        }));
    }
    highlightRange(range) {
        const rects = Array.from(range.getClientRects());
        const filteredRects = this.filterRects(rects);
        filteredRects.forEach((rect) => {
            const overlay = document.createElement('div');
            overlay.className = 'pink-marker-overlay';
            overlay.style.position = 'absolute';
            overlay.style.top = `${rect.top + window.scrollY}px`;
            overlay.style.left = `${rect.left + window.scrollX}px`;
            overlay.style.width = `${rect.width}px`;
            overlay.style.height = `${rect.height}px`;
            overlay.style.backgroundColor = this.options.overlayColor;
            overlay.style.pointerEvents = 'none';
            document.body.appendChild(overlay);
        });
    }
    removeAnnotation() {
        document.querySelectorAll('.pink-marker-overlay').forEach((el) => el.remove());
        document.querySelectorAll('.annotation-icon').forEach((el) => el.remove());
    }
    highlightSelectionFromEncoding(encoding) {
        const range = this.decodeSelection(encoding);
        if (range)
            this.highlightRange(range);
    }
    showModal(encoding, initialNote, onSave) {
        let modal = document.getElementById(encoding);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = encoding;
            modal.className = this.options.modalClass || '';
            modal.style.position = 'fixed';
            modal.style.top = '50%';
            modal.style.left = '50%';
            modal.style.transform = 'translate(-50%, -50%)';
            modal.style.backgroundColor = 'white';
            modal.style.padding = '20px';
            modal.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
            modal.style.zIndex = '1000';
            const textarea = document.createElement('textarea');
            textarea.id = 'annotation-text';
            textarea.className = this.options.modalTextareaClass || '';
            textarea.style.width = '300px';
            textarea.style.height = '100px';
            modal.appendChild(textarea);
            const btnContainer = document.createElement('div');
            btnContainer.className = this.options.modalButtonContainerClass || '';
            btnContainer.style.marginTop = '10px';
            const saveBtn = document.createElement('button');
            saveBtn.className = this.options.saveButtonClass || '';
            saveBtn.textContent = this.options.saveButtonText;
            saveBtn.addEventListener('click', () => {
                onSave(document.getElementById('annotation-text').value);
                modal.style.display = 'none';
                document.removeEventListener('click', outsideClickListener);
            });
            const cancelBtn = document.createElement('button');
            cancelBtn.className = this.options.cancelButtonClass || '';
            cancelBtn.textContent = this.options.cancelButtonText;
            cancelBtn.style.marginLeft = '10px';
            cancelBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                document.removeEventListener('click', outsideClickListener);
            });
            const deleteBtn = document.createElement('button');
            deleteBtn.className = this.options.deleteButtonClass || '';
            deleteBtn.textContent = this.options.deleteButtonText;
            deleteBtn.style.marginLeft = '10px';
            deleteBtn.addEventListener('click', () => {
                const index = this.annotations.findIndex((a) => a.encoding === encoding);
                if (index !== -1)
                    this.annotations.splice(index, 1);
                modal.style.display = 'none';
                document.removeEventListener('click', outsideClickListener);
                this.updateAnnotations();
            });
            btnContainer.append(saveBtn, cancelBtn, deleteBtn);
            modal.appendChild(btnContainer);
            document.body.appendChild(modal);
        }
        document.getElementById('annotation-text').value = initialNote;
        modal.style.display = 'block';
        const outsideClickListener = (event) => {
            if (modal && !modal.contains(event.target)) {
                modal.style.display = 'none';
                document.removeEventListener('click', outsideClickListener);
            }
        };
        setTimeout(() => {
            document.addEventListener('click', outsideClickListener);
        }, 0);
    }
    attachIcon(encoding, icon) {
        const range = this.decodeSelection(encoding);
        if (!range)
            return;
        const rect = range.getBoundingClientRect();
        const iconContainer = document.createElement('div');
        const iconElement = document.createElement('img');
        iconContainer.className = `${this.options.iconContainerClass} annotation-icon` || 'annotation-icon';
        iconElement.className = this.options.iconClass || '';
        iconElement.src = icon;
        iconElement.style.width = '20px';
        iconElement.style.height = '20px';
        iconContainer.style.position = 'absolute';
        iconContainer.style.top = `${rect.top + window.scrollY - 10}px`;
        iconContainer.style.left = `${rect.left + window.scrollX + rect.width - 10}px`;
        iconContainer.style.cursor = 'pointer';
        iconContainer.title = this.options.iconContainerTitle;
        iconContainer.addEventListener('click', () => {
            var _a;
            const note = ((_a = this.annotations.find((a) => a.encoding === encoding)) === null || _a === void 0 ? void 0 : _a.note) || '';
            this.showModal(encoding, note, (newNote) => {
                const ann = this.annotations.find((a) => a.encoding === encoding);
                if (ann)
                    ann.note = newNote;
            });
        });
        iconContainer.appendChild(iconElement);
        document.body.appendChild(iconContainer);
    }
}
//# sourceMappingURL=pink-marker.js.map