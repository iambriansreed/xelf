const flexItem = 'flex-item';
const DEFAULT_STYLE = {
    flexDirection: 'row',
    flexGrow: '1',
};
class App {
    constructor() {
        this.keyMaps = {
            8: () => this.deleteItemToEdit(),
            46: () => this.deleteItemToEdit(),
            39: () => this.setItemToEdit(this.$item.nextSibling),
            37: () => this.setItemToEdit(this.$item.previousSibling),
            38: () => this.setItemToEdit(this.$item.parentNode),
            27: () => this.setItemToEdit(this.$item.parentNode),
            40: () => this.setItemToEdit(this.$item.firstChild),
        };
        this.$item = null;
        this.$fields = [
            {
                element: document.querySelector(`#flex-direction-toggle`),
                onClick: (_, element) => {
                    getSiblings(element).forEach((el) => el.removeAttribute('data-selected'));
                    element.setAttribute('data-selected', '');
                    this.$item.classList.remove('flex-direction-row', 'flex-direction-column');
                    this.$item.style.flexDirection = element.value;
                },
                onUpdateItem: (field) => {
                    const value = this.$item.style.flexDirection || 'row';
                    toArray(field.childNodes).forEach((el) => {
                        el.removeAttribute && el.removeAttribute('data-selected');
                    });
                    field
                        .querySelector(`[value="${value}"]`)
                        .setAttribute('data-selected', '');
                    const display = this.itemIsBase || this.$item.childNodes.length > 0
                        ? ''
                        : 'none';
                    field.style.display = display;
                },
            },
            {
                element: document.querySelector(`[name="flexGrow"]`),
                onChange: (_, element) => {
                    this.$item.style.flexGrow = element.value;
                },
                onUpdateItem: (field) => {
                    field.value = this.$item.style.flexGrow;
                    field.style.display = this.itemIsBase ? 'none' : '';
                },
            },
            {
                element: document.querySelector(`[name="flexBasis"]`),
                onChange: (_, element) => {
                    this.$item.style.flexBasis = element.value;
                },
                onUpdateItem: (field) => {
                    field.value = this.$item.style.flexBasis;
                    field.style.display = this.itemIsBase ? 'none' : '';
                },
            },
            {
                element: document.querySelector(`[name="height"]`),
                onChange: (_, element) => {
                    this.$item.style.height = element.value;
                },
                onUpdateItem: (field) => {
                    field.value = this.$item.style.height;
                    field.style.display = this.itemIsBase ? 'none' : '';
                },
            },
            {
                element: document.querySelector(`[name="width"]`),
                onChange: (_, element) => {
                    this.$item.style.width = element.value;
                },
                onUpdateItem: (field) => {
                    field.value = this.$item.style.width;
                    field.style.display = this.itemIsBase ? 'none' : '';
                },
            },
            {
                element: document.querySelector(`[name="className"]`),
                onChange: (_, element) => {
                    this.$item.dataset.classname = element.value;
                },
                onUpdateItem: (field) => {
                    field.value = this.$item.dataset.classname || '';
                    field.style.display = this.itemIsBase ? 'none' : '';
                },
            },
        ];
        this.deleteItemToEdit = () => {
            if (this.itemIsBase) {
                return;
            }
            const other = this.$item.nextSibling ||
                this.$item.previousSibling ||
                this.$item.parentNode;
            this.$item.remove();
            this.setItemToEdit(other);
        };
        this.setItemToEdit = (_itemToEdit) => {
            if (!_itemToEdit ||
                !_itemToEdit.classList.contains(flexItem))
                return;
            this.$item = _itemToEdit;
            const isBase = this.itemIsBase;
            toArray(document.getElementsByClassName(flexItem)).map((node) => node.classList.remove('editing'));
            this.$item.classList.add('editing');
            const hideIfBase = isBase ? 'none' : '';
            this.$deleteBtn.style.display = hideIfBase;
            this.$parentBtn.style.display = hideIfBase;
            this.$toolbar.dataset.elementSelected = 'true';
            this.$fields.forEach(({ element: field, onUpdateItem }) => {
                onUpdateItem && onUpdateItem(field);
            });
            this.updateStatus();
        };
        this.updateStatus = () => {
            const pathSections = [];
            let pathElement = this.$item;
            let isBase;
            do {
                isBase = pathElement.isSameNode(this.$base);
                pathSections.push({
                    name: pathElement.dataset.classname || 'element',
                    index: isBase ? null : getIndex(pathElement),
                    ref: pathElement.dataset.ref,
                });
                pathElement = pathElement.parentNode;
            } while (!isBase);
            this.$status.innerHTML =
                pathSections
                    .reverse()
                    .map(({ ref, index, name }) => `<span><button type="button" value="${ref}">${name}${index !== null ? ` [${index}]` : ''}</button></span>`)
                    .join('') + '</span>';
        };
        this.addEventListeners = () => {
            this.$fields.forEach((field) => {
                const { element, onChange, onClick } = field;
                onChange &&
                    element.addEventListener('change', (event) => onChange(event, event.target));
                onClick &&
                    element.addEventListener('click', (event) => onClick(event, event.target));
            });
            this.$addChildBtn.addEventListener('click', (event) => {
                const eventTarget = event.target;
                const isFirstChild = this.$item.childNodes.length === 0;
                if (isFirstChild) {
                    const parent = this.$item.parentNode;
                    this.$item.style.flexDirection =
                        parent.style.flexDirection === 'row' ? 'column' : 'row';
                }
                this.$item.appendChild(newItem());
                this.$item.appendChild(newItem());
            });
            this.$parentBtn.addEventListener('click', () => {
                this.setItemToEdit(this.$item.parentNode);
            });
            this.$deleteBtn.addEventListener('click', () => {
                this.deleteItemToEdit();
            });
            this.$toolbar.addEventListener('keydown', (event) => {
                event.stopPropagation();
            });
            this.$exportBtn.addEventListener('click', () => {
                const baseStyle = this.$base.getAttribute('style');
                const str = (`<div style="${baseStyle}">` +
                    this.$base.innerHTML
                        .replace(/ class="[^"]+"/g, '')
                        .replace(/ data-ref="[^"]+"/g, '')
                        .replace(/>/g, '>\n') +
                    `</div>`).replace(/ style="/g, 'style="display:flex;flex-wrap:wrap;');
                const container = document.querySelector('textarea[data-copy-pasta]');
                container.innerHTML = str;
                container.select();
                document.execCommand('copy');
            });
            this.$status.addEventListener('click', (event) => {
                const eventTarget = event.target;
                if (eventTarget.value) {
                    const itemSelected = document.querySelector(`[data-ref="${eventTarget.value}"]`);
                    itemSelected && this.setItemToEdit(itemSelected);
                }
            });
            this.$base.addEventListener('click', (event) => {
                const eventTarget = event.target;
                if (eventTarget.classList.contains(flexItem)) {
                    this.setItemToEdit(event.target);
                }
            });
            document.addEventListener('keydown', (event) => {
                const key = event.keyCode || event.charCode;
                if (this.keyMaps[key])
                    this.keyMaps[key]();
            });
        };
        this.$toolbar = document.getElementById('toolbar');
        this.$status = document.getElementById('status');
        this.$base = document.getElementById('base');
        this.$addChildBtn = this.$toolbar.querySelector('button[value="add-child"]');
        this.$parentBtn = this.$toolbar.querySelector('button[value="parent"]');
        this.$deleteBtn = this.$toolbar.querySelector('button[value="delete"]');
        this.$exportBtn = this.$toolbar.querySelector('button[value="export"]');
        this.addEventListeners();
        assignToStyle(this.$base, DEFAULT_STYLE);
        this.setItemToEdit(this.$base);
    }
    static initialize() {
        window.addEventListener('load', () => new this());
    }
    get itemIsBase() {
        return this.$item.isSameNode(this.$base);
    }
}
App.initialize();
function toArray(nodes) {
    const elements = [];
    for (var i = 0, n = nodes.length; i < n; i++) {
        elements.push(nodes[i]);
    }
    return elements;
}
function newItem() {
    const defaultElement = document.createElement('div');
    Object.assign(defaultElement.style, DEFAULT_STYLE);
    defaultElement.className = flexItem;
    defaultElement.setAttribute('data-ref', makeId(10));
    return defaultElement;
}
function getSiblings(element) {
    return toArray(element.parentNode.children).filter((child) => !element.isSameNode(child));
}
function getIndex(element) {
    if (!element.parentNode)
        return 0;
    return toArray(element.parentNode.childNodes).indexOf(element);
}
function styleToString(style) {
    const styleObj = style;
    return Object.keys(style)
        .map((key) => `${key}:${styleObj[key]}`)
        .join(';');
}
function assignToStyle(element, newStyle) {
    const combinedStyle = Object.assign({}, element.style, newStyle);
    element.setAttribute('style', styleToString(combinedStyle));
}
function makeId(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
//# sourceMappingURL=scripts.js.map