(function () {
  // Snippet to paste into browser console to forward console errors to the dev server
  const origError = console.error;
  window.__forwardClientLogs = true;

  console.error = function (...args) {
    try {
      fetch('/api/client-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 'error', args: args, url: location.href, timestamp: new Date().toISOString() })
      }).catch(() => {})
    } catch (e) {}
    origError.apply(console, args);
  }

  console.log('✅ Client log forwarder installed. console.error() will be forwarded to /api/client-logs')
})();
