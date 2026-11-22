
const canvas = document.getElementById("canvas");
const pageTabs = document.getElementById("pageTabs");

let pages = [
    {
        name: "Page 1",
        elements: []
    }
];

let currentPage = 0;
let selectedElement = null;

function updatePlaceholder() {
    const placeholder = document.getElementById("placeholder");
    placeholder.style.display = pages[currentPage].elements.length === 0 ? "block" : "none";
}

function updatePageTabs() {
    pageTabs.innerHTML = "";

    pages.forEach((page, index) => {
        const tab = document.createElement("button");

        tab.className = "page-tab";
        tab.textContent = page.name;

        if (index === currentPage) {
            tab.classList.add("active");
        }

        tab.onclick = () => showPage(index);

        pageTabs.appendChild(tab);
    });
}

function showPage(index) {
    if (index < 0 || index >= pages.length) return;

    currentPage = index;
    selectedElement = null;

    canvas.querySelectorAll(".element").forEach(element => {
        element.classList.remove("selected");
    });

    canvas.querySelectorAll(".element").forEach(element => {
        element.remove();
    });

    pages[currentPage].elements.forEach(element => {
        canvas.appendChild(element);
    });

    updatePageTabs();
    updatePlaceholder();
}

function addPage() {
    const pageNumber = pages.length + 1;

    pages.push({
        name: "Page " + pageNumber,
        elements: []
    });

    showPage(pages.length - 1);
}

function renamePage() {
    const newName = prompt("Enter the new page name:");

    if (newName && newName.trim() !== "") {
        pages[currentPage].name = newName.trim();
        updatePageTabs();
    }
}

function deletePage() {
    if (pages.length === 1) {
        alert("You must have at least one page.");
        return;
    }

    const confirmDelete = confirm("Are you sure you want to delete this page?");

    if (!confirmDelete) return;

    pages.splice(currentPage, 1);

    if (currentPage >= pages.length) {
        currentPage = pages.length - 1;
    }

    showPage(currentPage);
}

function registerElement(element, width, height) {
    element.classList.add("element");

    const position = findFreePosition(width, height);

    element.style.left = position.x + "px";
    element.style.top = position.y + "px";

    canvas.appendChild(element);
    pages[currentPage].elements.push(element);

    makeDraggable(element);
    selectElement(element);
    updatePlaceholder();
}

function findFreePosition(width, height) {
    const maxWidth = canvas.clientWidth;
    const maxHeight = canvas.clientHeight;

    for (let y = 20; y < maxHeight - height; y += 30) {
        for (let x = 20; x < maxWidth - width; x += 30) {
            const overlaps = pages[currentPage].elements.some(element => {
                const left = parseFloat(element.style.left) || 0;
                const top = parseFloat(element.style.top) || 0;
                const right = left + element.offsetWidth;
                const bottom = top + element.offsetHeight;

                return (
                    x < right &&
                    x + width > left &&
                    y < bottom &&
                    y + height > top
                );
            });

            if (!overlaps) {
                return { x, y };
            }
        }
    }

    return { x: 20, y: 20 };
}

function addText() {
    const text = document.createElement("div");

    text.className = "text-element";
    text.contentEditable = "true";
    text.dataset.placeholder = "Write something...";
    text.textContent = "";

    registerElement(text, 180, 40);
    text.focus();
}

function addImage(event) {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        event.target.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        const image = document.createElement("img");

        image.src = e.target.result;
        image.className = "image-element";

        image.onload = function() {
            registerElement(image, image.offsetWidth, image.offsetHeight);
        };
    };

    reader.readAsDataURL(file);
    event.target.value = "";
}

function addTable() {
    let rows = parseInt(prompt("How many rows?"));
    let columns = parseInt(prompt("How many columns?"));

    if (
        !Number.isInteger(rows) ||
        !Number.isInteger(columns) ||
        rows < 1 ||
        columns < 1 ||
        rows > 15 ||
        columns > 10
    ) {
        alert("Enter between 1 and 15 rows and between 1 and 10 columns.");
        return;
    }

    const table = document.createElement("table");
    table.className = "table-element";

    for (let i = 0; i < rows; i++) {
        const row = document.createElement("tr");

        for (let j = 0; j < columns; j++) {
            const cell = document.createElement("td");

            cell.contentEditable = "true";
            cell.textContent = "Text";

            row.appendChild(cell);
        }

        table.appendChild(row);
    }

    registerElement(table, table.offsetWidth, table.offsetHeight);
}

function selectElement(element) {
    if (selectedElement) {
        selectedElement.classList.remove("selected");
    }

    selectedElement = element;
    selectedElement.classList.add("selected");
}

function deleteSelected() {
    if (!selectedElement) {
        alert("Select an element first.");
        return;
    }

    pages[currentPage].elements = pages[currentPage].elements.filter(
        element => element !== selectedElement
    );

    selectedElement.remove();
    selectedElement = null;

    updatePlaceholder();
}

function makeDraggable(element) {
    element.addEventListener("pointerdown", function(event) {
        const isText = element.classList.contains("text-element");
        const isTable = element.classList.contains("table-element");

        if ((isText || isTable) && !event.shiftKey) {
            selectElement(element);
            return;
        }

        if (event.target.isContentEditable && !event.shiftKey) {
            return;
        }

        if (event.button !== 0) return;

        event.preventDefault();
        selectElement(element);

        const canvasRect = canvas.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        const startX = event.clientX;
        const startY = event.clientY;

        const originalLeft = elementRect.left - canvasRect.left;
        const originalTop = elementRect.top - canvasRect.top;

        element.setPointerCapture(event.pointerId);

        function moveElement(moveEvent) {
            let newLeft = originalLeft + moveEvent.clientX - startX;
            let newTop = originalTop + moveEvent.clientY - startY;

            newLeft = Math.max(0, Math.min(
                newLeft,
                canvas.clientWidth - element.offsetWidth
            ));

            newTop = Math.max(0, Math.min(
                newTop,
                canvas.clientHeight - element.offsetHeight
            ));

            element.style.left = newLeft + "px";
            element.style.top = newTop + "px";
        }

        function stopMoving() {
            element.removeEventListener("pointermove", moveElement);
            element.removeEventListener("pointerup", stopMoving);
            element.removeEventListener("pointercancel", stopMoving);
        }

        element.addEventListener("pointermove", moveElement);
        element.addEventListener("pointerup", stopMoving);
        element.addEventListener("pointercancel", stopMoving);
    });
}

function showMoveHelp() {
    alert("To move text boxes and tables, hold SHIFT and drag them. Images can be dragged normally.");
}

canvas.addEventListener("click", function(event) {
    if (event.target === canvas || event.target.id === "placeholder") {
        if (selectedElement) {
            selectedElement.classList.remove("selected");
        }

        selectedElement = null;
    }
});

function downloadDesign() {
    if (typeof html2canvas === "undefined") {
        alert("Download library could not load. Check your internet connection.");
        return;
    }

    if (selectedElement) {
        selectedElement.classList.remove("selected");
    }

    html2canvas(canvas, {
        backgroundColor: "#ffffff",
        scale: 2
    }).then(image => {
        const link = document.createElement("a");

        link.download = pages[currentPage].name + ".png";
        link.href = image.toDataURL("image/png");
        link.click();

        if (selectedElement) {
            selectedElement.classList.add("selected");
        }
    }).catch(() => {
        alert("Could not download the page.");
        if (selectedElement) {
            selectedElement.classList.add("selected");
        }
    });
}

updatePageTabs();
updatePlaceholder();
