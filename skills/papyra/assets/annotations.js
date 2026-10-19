(() => {
  const entries = [];
  let frame;
  function draw() {
    for (const entry of entries) {
      const { element } = entry;
      if (!element.getClientRects().length || !element.getBoundingClientRect().width) continue;
      try {
        const requested = element.dataset.notation;
        const type = requested === 'circle' && element.getClientRects().length > 1
          ? 'underline' : requested;
        const computed = getComputedStyle(element);
        const color = type === 'highlight'
          ? computed.getPropertyValue('--notation-highlight').trim() || 'rgba(127,127,127,.2)'
          : computed.getPropertyValue('--notation-color').trim();
        const stroke = !color || color === 'currentColor' ? computed.color : color;
        if (entry.type !== type) {
          entry.annotation?.remove();
          entry.annotation = RoughNotation.annotate(element, {
            type, animate: false, multiline: true, iterations: 1,
            color: stroke,
            padding: type === 'circle' ? 3 : 1, strokeWidth: 1.5
          });
          entry.svg = type === 'highlight' ? element.previousElementSibling : element.nextElementSibling;
          entry.svg.dataset.enhancement = 'notation';
          entry.svg.setAttribute('aria-hidden', 'true');
          entry.type = type;
        }
        entry.annotation.color = stroke;
        entry.annotation.show();
        element.classList.add('notation-ready');
      } catch (error) {
        entry.annotation?.remove();
        entry.type = undefined;
        element.classList.remove('notation-ready');
        console.error('Notation failed:', error);
      }
    }
  }
  function refresh() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(draw);
  }
  async function start() {
    await document.fonts.ready;
    document.querySelectorAll('[data-notation]').forEach(element => {
      if (['underline', 'highlight', 'circle'].includes(element.dataset.notation)) entries.push({ element });
    });
    refresh();
    // The library observes size changes; these events also cover position-only changes.
    document.addEventListener('load', refresh, true);
    document.addEventListener('toggle', refresh, true);
    document.addEventListener('papyra:refresh-annotations', refresh);
    window.addEventListener('resize', refresh, { passive: true });
  }
  start().catch(error => console.error('Notation initialization failed:', error));
})();
