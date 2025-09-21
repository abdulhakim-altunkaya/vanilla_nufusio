// index.js
document.addEventListener('DOMContentLoaded', function() {
    const svgObject = document.getElementById('svg-display');

    // Check if the object element exists
    if (!svgObject) {
        console.error('SVG object element not found');
        return;
    }

    svgObject.addEventListener('load', function() {
        let svgDoc;
        try {
            svgDoc = svgObject.contentDocument || svgObject.getSVGDocument();
            if (!svgDoc) {
                console.error('SVG document is not accessible. Ensure the SVG file is loaded and served correctly.');
                return;
            }

            // Find all path elements with data-name attribute
            const paths = svgDoc.querySelectorAll('path[data-name]');
            if (paths.length === 0) {
                console.warn('No paths with data-name found in SVG. Check SVG structure.');
                return;
            }

            paths.forEach(function(path) {
                path.addEventListener('click', function(event) {
                    const provinceName = this.getAttribute('data-name');
                    console.log('Clicked province:', provinceName);
                    event.stopPropagation();
                });

                // Optional: Add visual feedback
                path.style.cursor = 'pointer';
                path.addEventListener('mouseover', function() {
                    this.style.fill = '#db3939ff';
                });
                path.addEventListener('mouseout', function() {
                    this.style.fill = ''; // Reset to original
                });
            });

            console.log('Event listeners added to', paths.length, 'provinces');
        } catch (error) {
            console.error('Error accessing SVG:', error);
        }
    });

    // Check if SVG loaded correctly
    setTimeout(() => {
        if (!svgObject.contentDocument && !svgObject.getSVGDocument()) {
            console.error('SVG failed to load. Check file path or CORS issues.');
        }
    }, 1000); // Delay to ensure load attempt
});