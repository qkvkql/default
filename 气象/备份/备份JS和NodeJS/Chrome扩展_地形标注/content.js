// Wait for the window to load, then wait 1 second
window.addEventListener('load', () => {
    setTimeout(initExtension, 1000);
});

function initExtension() {
    const mapContainer = document.querySelector('.leaflet-container');

    if (!mapContainer) {
        console.error("Map container not found!");
        return;
    }

    const button = document.createElement('button');
    button.id = 'custom-map-btn';
    button.innerText = 'Add Marker';
    document.body.appendChild(button);

    button.addEventListener('click', () => {
        createDraggableMarker(mapContainer);
    });
}

function createDraggableMarker(container) {
    const existing = document.getElementById('my-draggable-marker');
    if (existing) existing.remove();

    const marker = document.createElement('div');
    marker.id = 'my-draggable-marker';
    marker.className = 'custom-placemarker';
    
    container.appendChild(marker);

    // --- NEW Positioning Logic ---
    const containerRect = container.getBoundingClientRect();
    
    // Match these to the width/height in CSS
    const markerW = 32; 
    const markerH = 42; 

    // Center X: (Map Width / 2) - (Half Marker Width) -> Centers the icon horizontally
    const startLeft = (containerRect.width / 2) - (markerW / 2);
    
    // Center Y: (Map Height / 2) - (Full Marker Height) -> Puts the BOTTOM TIP exactly at center
    const startTop = (containerRect.height / 2) - markerH;

    marker.style.left = `${startLeft}px`;
    marker.style.top = `${startTop}px`;

    // --- Event Blocking (Prevent Map Dragging) ---
    const stopEvents = (e) => {
        e.stopPropagation();
        if(e.type === 'mousedown') e.preventDefault(); 
    };

    marker.addEventListener('pointerdown', stopEvents);
    marker.addEventListener('mousedown', stopEvents);
    marker.addEventListener('click', (e) => e.stopPropagation());
    marker.addEventListener('dblclick', (e) => e.stopPropagation());
    
    marker.addEventListener('mouseover', () => {
        container.style.pointerEvents = 'none'; 
        marker.style.pointerEvents = 'auto';    
    });
    
    marker.addEventListener('mouseout', () => {
        container.style.pointerEvents = 'auto'; 
    });

    // --- Drag Logic ---
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    marker.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = marker.offsetLeft;
        initialTop = marker.offsetTop;
        marker.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        e.preventDefault();
        e.stopPropagation();

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;

        // --- Boundary Checks ---
        const maxLeft = container.offsetWidth - markerW;
        const maxTop = container.offsetHeight - markerH;

        if (newLeft < 0) newLeft = 0;
        if (newLeft > maxLeft) newLeft = maxLeft;
        if (newTop < 0) newTop = 0;
        if (newTop > maxTop) newTop = maxTop;

        marker.style.left = `${newLeft}px`;
        marker.style.top = `${newTop}px`;
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            marker.style.cursor = 'move';
            container.style.pointerEvents = 'auto';
        }
    });
}