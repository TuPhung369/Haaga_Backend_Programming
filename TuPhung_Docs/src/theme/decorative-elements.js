// Add decorative elements to the DOM
export default function addDecorativeElements() {
  if (document.querySelector('.decorative-circle-1')) {
    return; // Elements already added
  }

  // Create decorative circles
  const circle1 = document.createElement('div');
  circle1.className = 'decorative-circle-1';
  document.body.appendChild(circle1);

  const circle2 = document.createElement('div');
  circle2.className = 'decorative-circle-2';
  document.body.appendChild(circle2);

  // Create a full-page background container
  const fullPageBg = document.createElement('div');
  fullPageBg.className = 'full-page-background';
  fullPageBg.style.position = 'fixed';
  fullPageBg.style.top = '0';
  fullPageBg.style.left = '0';
  fullPageBg.style.width = '100%';
  fullPageBg.style.height = '100%';
  fullPageBg.style.zIndex = '-5';
  fullPageBg.style.pointerEvents = 'none';
  
  // Insert at the beginning of body
  document.body.insertBefore(fullPageBg, document.body.firstChild);
}