/*
 * api.js —— 前端与后端数据库的同步客户端
 * 用法：在 index.html 中于 app.js 之前引入；默认连接 http://localhost:8000。
 * 覆盖地址：在 index.html 顶部加 <script>window.API_BASE="http://你的地址:端口";</script>
 *
 * 设计原则：
 *   - 前端 localStorage 始终是「本地真相来源」，可离线使用；
 *   - 本客户端在 save() 后把当前患者+量表结果异步镜像到后端（fire-and-forget）；
 *   - 后端不可达时静默降级，不影响本地操作。
 */
(function () {
  var base = window.API_BASE || "http://localhost:8000";
  var enabled = true; // 默认开启；后端未启动时会自动降级
  var seq = 0;

  function rid() { return "req_" + Date.now() + "_" + (++seq); }

  function req(method, path, body) {
    return fetch(base + path, {
      method: method,
      headers: { "Content-Type": "application/json", "X-Request-Id": rid() },
      body: body == null ? undefined : JSON.stringify(body)
    }).then(function (r) {
      var ct = r.headers.get("Content-Type") || "";
      if (ct.indexOf("json") < 0) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return {};
      }
      return r.json().then(function (j) {
        if (!r.ok) throw j;
        return j;
      });
    });
  }

  function get(p) { return req("GET", p); }
  function post(p, b) { return req("POST", p, b); }
  function put(p, b) { return req("PUT", p, b); }

  window.API = {
    base: base,
    isEnabled: function () { return enabled; },
    setEnabled: function (v) { enabled = !!v; },
    health: function () { return get("/api/v1/health"); },
    upsertPatient: function (p) { return post("/api/v1/patients", { patient: p }); },
    getPatients: function () { return get("/api/v1/patients"); },
    getPatient: function (code) { return get("/api/v1/patients/" + encodeURIComponent(code)); },
    putPatient: function (code, patch) { return put("/api/v1/patients/" + encodeURIComponent(code), patch); },
    upsertAssessment: function (code, a) {
      return post("/api/v1/patients/" + encodeURIComponent(code) + "/assessments", a);
    },
    getAssessments: function (code) {
      return get("/api/v1/patients/" + encodeURIComponent(code) + "/assessments");
    },
    saveDraft: function (code, role, flow, data) {
      return put("/api/v1/patients/" + encodeURIComponent(code) + "/drafts/" + encodeURIComponent(role),
        { flow: flow, data: data });
    },
    getDraft: function (code, role) {
      return get("/api/v1/patients/" + encodeURIComponent(code) + "/drafts/" + encodeURIComponent(role));
    }
  };
})();
