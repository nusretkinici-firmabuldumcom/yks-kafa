/*
 * YKS KAFA - "tables/..." REST API shim
 * Bu site aslen bir backend'in otomatik sağladığı basit bir tablo/REST API'sine
 * (fetch('tables/users'), POST/PATCH tables/...) göre yazılmış. GitHub Pages statik
 * barındırma olduğu için böyle bir backend yok — bu dosya window.fetch'i yakalayıp
 * aynı REST sözleşmesini (GET -> {data:[...]}, POST -> oluşturulan kayıt, PATCH -> güncellenen kayıt)
 * tarayıcının localStorage'ı üzerinde simüle eder. Böylece kayıt ol / giriş yap / soru çöz /
 * performans takibi akışları gerçek bir sunucu olmadan da çalışır.
 */
(function () {
  const PREFIX = 'ykskafa_table_';
  const _fetch = window.fetch.bind(window);

  function loadTable(name) {
    try { return JSON.parse(localStorage.getItem(PREFIX + name)) || []; }
    catch (e) { return []; }
  }
  function saveTable(name, arr) {
    localStorage.setItem(PREFIX + name, JSON.stringify(arr));
  }
  function genId() {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
  }
  function jsonResponse(obj, status) {
    return Promise.resolve(new Response(JSON.stringify(obj), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json' }
    }));
  }
  function parseBody(init) {
    try { return init && init.body ? JSON.parse(init.body) : {}; }
    catch (e) { return {}; }
  }

  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const m = url.match(/^tables\/([a-zA-Z_]+)(?:\/([^/?]+))?(?:\?(.*))?$/);
    if (!m) return _fetch(input, init);

    const tableName = m[1];
    const recordId = m[2];
    const query = m[3];
    const method = ((init && init.method) || 'GET').toUpperCase();
    const table = loadTable(tableName);

    if (method === 'GET' && !recordId) {
      const params = new URLSearchParams(query || '');
      const limit = parseInt(params.get('limit'), 10) || table.length;
      return jsonResponse({ data: table.slice(0, limit), total: table.length });
    }
    if (method === 'GET' && recordId) {
      const rec = table.find(r => r.id === recordId);
      return rec ? jsonResponse(rec) : jsonResponse({ error: 'not found' }, 404);
    }
    if (method === 'POST') {
      const body = parseBody(init);
      const record = Object.assign({ id: genId(), created_at: new Date().toISOString() }, body);
      table.push(record);
      saveTable(tableName, table);
      return jsonResponse(record, 200);
    }
    if (method === 'PATCH' || method === 'PUT') {
      const body = parseBody(init);
      const idx = table.findIndex(r => r.id === recordId);
      if (idx === -1) return jsonResponse({ error: 'not found' }, 404);
      table[idx] = Object.assign({}, table[idx], body);
      saveTable(tableName, table);
      return jsonResponse(table[idx], 200);
    }
    if (method === 'DELETE') {
      saveTable(tableName, table.filter(r => r.id !== recordId));
      return jsonResponse({ success: true }, 200);
    }
    return _fetch(input, init);
  };
})();
