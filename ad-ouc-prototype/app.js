/* =============================================================
 * 认知障碍早期筛查 —— 聊天式对话引擎（零依赖，纯原生 JS）
 * 读取 window.INTAKE / window.SCALES 配置，通用渲染。
 * ============================================================= */
(function () {
  "use strict";

  var STORE_KEY = "adouc_state_v1";
  var LIGHT = { green: "🟢", yellow: "🟡", red: "🔴" };

  /* 角色定义：身份切换须真实驱动行为（可见量表 / 人称 / 反馈 / 字号） */
  var ROLES = {
    rater:     { name: "主试（医生）", tag: "主试", desc: "可操作全部量表，逐题提问并记录，可见分数与三色灯。" },
    self:      { name: "患者（自评）", tag: "自评", desc: "仅做自评量表（SCD-Q9），界面放大字号，不显示分数与灯色。" },
    informant: { name: "家属（知情者）", tag: "家属", desc: "仅做知情者量表（FAQ / NPI / CDR），问题人称自动变为『他/她』。" }
  };
  function roleTag(r) { return (ROLES[r] && ROLES[r].tag) || r; }
  /* 三通道：首页按通道分流（参考 ad-scd.ai.studio 的三入口结构）。
     rater 通道可见全部量表；self / informant 仅见通道内量表。 */
  var CHANNELS = {
    self: {
      name: "受试者自评通道", en: "Patient Self-Assessment",
      desc: "面向受试者本人。大字清晰排版、语音朗读、生活化对话，轻松完成主观认知下降自评。",
      scales: ["SCD-Q9"]
    },
    informant: {
      name: "家属与知情者观察通道", en: "Informant & Family Observation",
      desc: "面向与受试者共同生活的家属或照料者。客观记录近期记忆变化、日常功能与精神行为表现。",
      scales: ["FAQ", "NPI", "CDR"]
    },
    rater: {
      name: "医师临床与科研工作站", en: "Clinician & Researcher Workbench",
      desc: "面向神经内科医师与科研人员。提供标准神经心理测评、自动计分、综合诊断报告与 Excel 导出。",
      scales: null // null = 全部
    }
  };
  /* 该量表对当前身份是否可见 */
  function scaleVisibleTo(key, role) {
    if (role === "rater") return true;
    var ch = CHANNELS[role];
    return !!(ch && ch.scales && ch.scales.indexOf(key) >= 0);
  }
  /* 家属视角把第二人称统一替换为『他/她』，体现角色切换 */
  function applyPronoun(text) {
    if (state.role !== "informant" || !text) return text;
    return text.replace(/您/g, "他/她").replace(/你/g, "他/她");
  }

  /* ---------- 全局状态 ---------- */
  var state = {
    role: "rater",            // rater(主试) / self(患者) / informant(家属)
    channel: null,           // 当前选中的首页通道（null=通道选择页）
    view: "home",            // home / chat
    patient: null,           // 当前建档信息
    flow: null,              // 当前流程对象
    flowType: null,          // intake / scale
    idx: 0,                  // 当前题目下标
    answers: {},             // itemId -> 值
    messages: [],            // 聊天记录
    patients: [],            // 已完成/进行中的患者 [{patient, results}]
    _timer: null             // 计时器句柄
  };

  /* ---------- 工具 ---------- */
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function genCode() {
    var d = new Date();
    var ym = ("" + d.getFullYear()).slice(2) + ("0" + (d.getMonth() + 1)).slice(-2);
    var r = Math.floor(1000 + Math.random() * 9000);
    return "S" + ym + "-" + r;
  }
  function save() {
    try {
      var copy = JSON.parse(JSON.stringify(state));
      delete copy._timer;
      localStorage.setItem(STORE_KEY, JSON.stringify(copy));
    } catch (e) { /* 忽略存储异常 */ }
  }
  function load() {
    try {
      var s = localStorage.getItem(STORE_KEY);
      if (!s) return false;
      var o = JSON.parse(s);
      o._timer = null;
      Object.keys(o).forEach(function (k) { state[k] = o[k]; });
      return true;
    } catch (e) { return false; }
  }

  /* ---------- 计分 ---------- */
  function compute(flow, answers) {
    var sc = flow.scoring || { type: "sum", thresholds: [] };
    var total = 0;
    if (sc.type === "primary") {
      total = Number(answers[sc.primaryItem] || 0);
    } else {
      flow.items.forEach(function (it) {
        var v = answers[it.id];
        if (v == null) return;
        if (it.kind === "choice" || it.kind === "emoji") total += Number(v);
        else if (it.kind === "number" || it.kind === "timer") total += Number(v);
      });
    }
    var hit = null;
    (sc.thresholds || []).forEach(function (t) {
      if (total >= t.min && total <= t.max) hit = t;
    });
    if (!hit) hit = { level: "yellow", label: "（未匹配阈值）" };
    return { total: total, level: hit.level, label: hit.label };
  }

  /* ---------- 消息流 ---------- */
  function botSay(text, light) {
    state.messages.push({ side: "bot", text: text, light: light || null });
  }
  function userSay(text) {
    state.messages.push({ side: "user", text: text });
  }

  /* ---------- 渲染：顶栏 ---------- */
  function renderTop() {
    $("roleSelect").value = state.role;
    var badge = $("roleBadge");
    if (badge) badge.textContent = "身份：" + ROLES[state.role].name;
    document.body.classList.toggle("role-self", state.role === "self");
    var dot = $("offlineDot");
    if (navigator.onLine === false) {
      dot.textContent = "● 离线模式";
      dot.className = "offline on";
    } else {
      dot.textContent = "● 在线";
      dot.className = "offline";
    }
  }

  /* ---------- 渲染：消息流 ---------- */
  function renderChat() {
    var box = $("chat");
    box.innerHTML = "";
    state.messages.forEach(function (m) {
      var row = el("div", "row " + (m.side === "bot" ? "left" : "right"));
      var b = el("div", "bubble " + (m.side === "bot" ? "bot" : "user"));
      if (m.light) {
        b.classList.add("result", m.light);
        b.innerHTML = "";
        var l = el("div", "light " + m.light, LIGHT[m.light]);
        var t = el("div", "rtxt", m.text);
        b.appendChild(l); b.appendChild(t);
      } else {
        b.textContent = m.text;
      }
      // 左侧气泡带语音小喇叭（仅演示）
      if (m.side === "bot") {
        var sp = el("span", "speak", "🔊");
        sp.onclick = function () { speak(m.text); };
        b.appendChild(sp);
      }
      row.appendChild(b);
      box.appendChild(row);
    });
    box.scrollTop = box.scrollHeight;
  }

  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    try {
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "zh-CN"; u.rate = 0.95;
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  /* ---------- 渲染：底栏（按当前题目类型） ---------- */
  function renderComposer() {
    var c = $("composer");
    c.innerHTML = "";
    if (state.view !== "chat") return;

    var flow = state.flow;
    if (!flow) return;

    // 流程已结束
    if (state.idx >= flow.items.length) {
      var tip = el("div", "hint", "本环节已完成 ✅");
      c.appendChild(tip);
      if (state.flowType === "intake") {
        c.appendChild(bigBtn("➡ 进入量表评估", function () { showScaleMenu(); }));
      } else {
        c.appendChild(bigBtn("➡ 再做一个量表", function () { showScaleMenu(); }));
        c.appendChild(bigBtn("🏠 返回首页", goHome));
      }
      return;
    }

    var it = flow.items[state.idx];
    if (it.kind === "choice") {
      it.options.forEach(function (op) {
        c.appendChild(bigBtn(op.label, function () { answer(it, op.score, op.label); }));
      });
    } else if (it.kind === "emoji") {
      var faces = ["😊", "🙂", "😐", "🙁", "😭"];
      faces.forEach(function (f, i) {
        var b = bigBtn(f, function () { answer(it, i, f); });
        b.classList.add("emoji"); c.appendChild(b);
      });
    } else if (it.kind === "number" || it.kind === "timer") {
      if (it.kind === "timer") {
        c.appendChild(timerBlock(it));
      } else {
        c.appendChild(numberBlock(it, function (val) { answer(it, val, "" + val); }));
      }
    } else { // text
      var input = el("input", "textin");
      input.placeholder = "请输入…";
      input.type = "text";
      var send = bigBtn("发送", function () {
        var v = input.value.trim();
        if (!v) { input.focus(); return; }
        answer(it, v, v);
      });
      c.appendChild(input); c.appendChild(send);
    }
  }

  function bigBtn(label, fn) {
    var b = el("button", "bigbtn", label);
    b.onclick = fn;
    return b;
  }
  function numberBlock(it, cb) {
    var wrap = el("div", "numwrap");
    var input = el("input", "textin");
    input.type = "number";
    if (it.max != null) input.max = it.max;
    if (it.hint) input.placeholder = it.hint;
    var ok = bigBtn("确认", function () {
      var v = parseFloat(input.value);
      if (isNaN(v) || v < 0) { input.focus(); return; }
      if (it.max != null && v > it.max) { alert("超过上限 " + it.max); return; }
      cb(v);
    });
    wrap.appendChild(input); wrap.appendChild(ok);
    return wrap;
  }
  function timerBlock(it) {
    var wrap = el("div", "timerwrap");
    var disp = el("div", "timerdisp", it.seconds + "s");
    var note = el("div", "hint", it.hint || "倒计时结束后录入正确词数");
    var btn = bigBtn("▶ 开始计时", function () {
      var left = it.seconds;
      disp.textContent = left + "s";
      btn.disabled = true;
      state._timer = setInterval(function () {
        left--;
        disp.textContent = left + "s";
        if (left <= 10) disp.classList.add("warn");
        if (left <= 0) {
          clearInterval(state._timer); state._timer = null;
          disp.textContent = "时间到！";
          // 计时结束 → 显示数字录入
          var nb = numberBlock(it, function (val) {
            answer(it, val, "词数 " + val);
          });
          wrap.appendChild(nb);
        }
      }, 1000);
    });
    wrap.appendChild(disp); wrap.appendChild(note); wrap.appendChild(btn);
    return wrap;
  }

  /* ---------- 作答处理 ---------- */
  function answer(it, value, display) {
    state.answers[it.id] = value;
    if (display) userSay(display);
    state.idx++;
    save();
  }

  // 发出当前下标对应的题目
  function askCurrent() {
    var flow = state.flow;
    if (!flow || state.idx >= flow.items.length) return;
    var it = flow.items[state.idx];
    var q = it.q;
    if (it.id === "birth") q += "（当前 " + new Date().getFullYear() + " 年）";
    botSay(applyPronoun(q));
  }

  /* ---------- 流程：建档 ---------- */
  function startIntake() {
    state.flow = window.INTAKE;
    state.flowType = "intake";
    state.idx = 0; state.answers = {};
    state.messages = [];
    state.view = "chat";
    botSay(window.INTAKE.intro);
    // 推第一条题
    askCurrent();
    switchView();
  }

  // 建档完成时由 answer 触发的"收尾"需在 idx 越界时处理
  function finishIntakeIfNeeded() {
    if (state.flowType === "intake" && state.idx >= state.flow.items.length && !state.patient) {
      var a = state.answers;
      var age = a.birth ? (new Date().getFullYear() - Number(a.birth)) : null;
      var patient = {
        code: genCode(),
        name: a.name, gender: a.gender === 0 ? "男" : (a.gender === 1 ? "女" : a.gender),
        birth: a.birth, age: age, edu: a.edu, height: a.height, weight: a.weight,
        marry: textOf(a.marry), live: textOf(a.live), phone: a.phone, time: nowStr()
      };
      state.patient = patient;
      state.patients.push({ patient: patient, results: [] });
      botSay("建档完成！研究编号：" + patient.code + (age != null ? "，自动算得年龄 " + age + " 岁。" : "。"));
      botSay("接下来可以做几个小测验，帮您了解记忆和情绪状况～");
      save();
    }
  }
  function textOf(v) { return (typeof v === "string") ? v : (v == null ? "" : "" + v); }
  function nowStr() {
    var d = new Date();
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2) +
      " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
  }

  /* ---------- 流程：量表 ---------- */
  function showScaleMenu() {
    state.view = "chat";
    state.flow = null; state.flowType = "scaleMenu";
    state.idx = 0; state.answers = {};
    state.messages = [];
    botSay(applyPronoun(state.patient ? ("好的，" + (state.patient.name || "您好") + "，咱们开始做测验吧～") : "咱们开始做测验吧～"));
    renderChat(); renderScaleCards();
  }
  function renderScaleCards() {
    var c = $("composer");
    c.innerHTML = "";
    var visible = Object.keys(window.SCALES).filter(function (k) { return scaleVisibleTo(k, state.role); });
    var hint = el("div", "hint",
      "当前身份【" + ROLES[state.role].name + "】可操作以下量表（点卡片开始）：");
    c.appendChild(hint);
    visible.forEach(function (key) {
      var s = window.SCALES[key];
      var card = el("button", "scaleCard");
      card.innerHTML = "<b>" + s.short + "</b><span>" + s.name + "</span>" +
        "<em class='ctag " + s.role + "'>" + roleTag(s.role) + "</em>";
      card.onclick = function () { startScale(key); };
      c.appendChild(card);
    });
    if (!visible.length) {
      c.appendChild(el("div", "hint", "（当前身份暂无可操作量表）"));
    }
    c.appendChild(bigBtn("🏠 返回首页", goHome));
  }
  function startScale(key) {
    var s = window.SCALES[key];
    state.flow = s; state.flowType = "scale";
    state.idx = 0; state.answers = {};
    state.messages = [];
    botSay(applyPronoun(s.intro));
    botSay(applyPronoun(s.items[0].q));
    switchView();
  }

  // 量表结束时计分
  function finishScaleIfNeeded() {
    if (state.flowType === "scale" && state.idx >= state.flow.items.length) {
      var r = compute(state.flow, state.answers);
      var who = state.role === "self" ? "（患者自评）" : (state.role === "informant" ? "（家属提供）" : "（主试评定）");
      // 主试/导出视图显示分数与灯；患者侧仅泛化鼓励
      if (state.role === "self") {
        botSay("测验完成啦，您很棒！结果建议由医生进一步评估～", "green");
      } else {
        botSay(s_title(state.flow) + who + " 总分 " + fmt(r.total) +
               "。" + LIGHT[r.level] + " " + r.label, r.level);
      }
      // 记录结果
      if (state.patient) {
        var rec = state.patients.filter(function (p) { return p.patient.code === state.patient.code; })[0];
        if (rec) {
          rec.results = rec.results.filter(function (x) { return x.scale !== state.flow.short; });
          rec.results.push({ scale: state.flow.short, name: state.flow.name, score: r.total, level: r.level, label: r.label, time: nowStr() });
        }
      }
      save();
    }
  }
  function s_title(flow) { return "【" + flow.short + "】"; }
  function fmt(n) { return (Math.round(n * 10) / 10); }

  /* ---------- 视图切换 ---------- */
  function switchView() {
    if (state.view === "home") {
      $("home").style.display = "block";
      $("chatWrap").style.display = "none";
    } else {
      $("home").style.display = "none";
      $("chatWrap").style.display = "flex";
      // intake 收尾 / scale 收尾
      if (state.flowType === "intake") finishIntakeIfNeeded();
      if (state.flowType === "scale") finishScaleIfNeeded();
      renderTop(); renderChat(); renderComposer();
    }
  }
  function goHome() {
    state.view = "home";
    if (state._timer) { clearInterval(state._timer); state._timer = null; }
    save();
    renderHome();
    switchView();
  }

  /* ---------- 首页（三通道入口，参考 ad-scd.ai.studio） ---------- */
  function renderHome() {
    var h = $("home");
    h.innerHTML = "";
    h.appendChild(el("div", "htitle", "认知障碍早期筛查"));
    h.appendChild(el("div", "hsub", "聊天式 · 自动计分 · 红黄绿灯预警"));

    // 通道选择页
    if (!state.channel) {
      h.appendChild(el("div", "hrole", "请选择测评通道或工作台"));
      Object.keys(CHANNELS).forEach(function (r) {
        var ch = CHANNELS[r];
        var card = el("button", "chCard ch-" + r);
        var scalesTxt = ch.scales
          ? ch.scales.map(function (k) { return window.SCALES[k].short; }).join(" · ")
          : "全部量表 + 建档 + 报告 + 导出";
        card.innerHTML = "<b>" + ch.name + "</b><span class='chen'>" + ch.en +
          "</span><p>" + ch.desc + "</p><div class='citems'>包含测评：" + scalesTxt + "</div>";
        card.onclick = function () { enterChannel(r); };
        h.appendChild(card);
      });
      return;
    }

    // 已选通道：操作面板
    var ch = CHANNELS[state.channel];
    h.appendChild(el("div", "hrole", "当前通道：" + ch.name + "（" + ROLES[state.channel].name + "）"));
    h.appendChild(bigBtn("↩ 返回通道选择", function () { state.channel = null; renderHome(); switchView(); }));

    var resume = (state.patient && state.flow && state.idx < state.flow.items.length);
    if (resume) {
      h.appendChild(bigBtn("↩ 继续上次（" + (state.patient.name || "未命名") + "）", function () {
        state.view = "chat"; switchView();
      }));
    }

    if (state.channel === "rater") {
      h.appendChild(bigBtn("➕ 新患者建档", startIntake));
      if (state.patient) h.appendChild(bigBtn("📋 选择量表评估", showScaleMenu));
      h.appendChild(bigBtn("🩺 综合诊断报告", showReport));
      h.appendChild(bigBtn("📤 导出 Excel", showExportMenu));
    } else {
      ch.scales.forEach(function (key) {
        var s = window.SCALES[key];
        var card = el("button", "scaleCard");
        card.innerHTML = "<b>" + s.short + "</b><span>" + s.name + "</span>";
        card.onclick = function () { startScale(key); };
        h.appendChild(card);
      });
    }
  }

  function enterChannel(role) {
    state.role = role;
    state.channel = role;
    save();
    renderTop();
    renderHome();
    switchView();
  }

  /* ---------- 导出 ---------- */
  function showExportMenu() {
    state.view = "chat"; state.flow = null; state.flowType = "export";
    state.messages = []; state.idx = 0; state.answers = {};
    botSay("导出数据：选择范围后生成 Excel（.xls，Excel 可直接打开）。");
    renderChat();
    var c = $("composer"); c.innerHTML = "";
    c.appendChild(bigBtn("📤 导出【当前患者】", function () { doExport([currentRec()]); }));
    c.appendChild(bigBtn("📤 导出【全部患者】(" + state.patients.length + ")", function () { doExport(state.patients); }));
    c.appendChild(bigBtn("🏠 返回首页", goHome));
  }
  function currentRec() {
    if (!state.patient) return null;
    return state.patients.filter(function (p) { return p.patient.code === state.patient.code; })[0] || null;
  }
  function doExport(records) {
    records = (records || []).filter(Boolean);
    if (!records.length) { alert("暂无可导出的患者数据"); return; }
    var anonym = confirm("是否匿名化（隐藏姓名与联系方式）？\n确定=匿名，取消=保留姓名");
    var html = buildXls(records, anonym);
    var blob = new Blob(["﻿" + html], { type: "application/vnd.ms-excel;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "认知筛查数据_" + (new Date().getFullYear()) + ("0"+(new Date().getMonth()+1)).slice(-2) + ("0"+new Date().getDate()).slice(-2) + ".xls";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    botSay("✅ 已生成 Excel 文件，请到下载目录查看。");
    renderChat();
  }
  function buildXls(records, anonym) {
    var keys = Object.keys(window.SCALES);
    var head = "<tr>" +
      "<th>研究编号</th><th>姓名</th><th>性别</th><th>年龄</th><th>教育年限</th>" +
      "<th>身高</th><th>体重</th><th>婚姻</th><th>居住</th>";
    keys.forEach(function (k) { head += "<th>" + window.SCALES[k].short + "(分)</th><th>" + window.SCALES[k].short + "(灯)</th>"; });
    head += "<th>评估时间</th></tr>";
    var rows = records.map(function (rec) {
      var p = rec.patient;
      var map = {}; (rec.results || []).forEach(function (r) { map[r.scale] = r; });
      var t = "<tr>" +
        "<td>" + (p.code || "") + "</td>" +
        "<td>" + (anonym ? "匿名" : (p.name || "")) + "</td>" +
        "<td>" + (p.gender || "") + "</td>" +
        "<td>" + (p.age != null ? p.age : "") + "</td>" +
        "<td>" + (p.edu != null ? p.edu : "") + "</td>" +
        "<td>" + (p.height != null ? p.height : "") + "</td>" +
        "<td>" + (p.weight != null ? p.weight : "") + "</td>" +
        "<td>" + (p.marry || "") + "</td>" +
        "<td>" + (p.live || "") + "</td>";
      keys.forEach(function (k) {
        var r = map[k];
        t += "<td>" + (r ? r.score : "") + "</td><td>" + (r ? LIGHT[r.level] : "") + "</td>";
      });
      t += "<td>" + (p.time || "") + "</td></tr>";
      return t;
    }).join("");
    return "<html><head><meta charset='utf-8'></head><body>" +
      "<table border='1' cellspacing='0'>" + head + rows + "</table></body></html>";
  }

  /* ---------- 角色切换 ---------- */
  function onRoleChange() {
    var nr = $("roleSelect").value;
    if (nr === state.role) return;
    state.role = nr;
    state.channel = nr; // 同步通道，保持首页与下拉一致
    save();
    renderTop();
    renderHome();
    switchView();
  }

  /* ---------- 综合诊断报告（医师通道） ---------- */
  function showReport() {
    var box = $("report");
    box.innerHTML = "";
    var hd = el("div", "rep-hd", "🩺 综合诊断报告");
    var close = el("button", "rep-close", "✕");
    close.onclick = function () { box.style.display = "none"; };
    hd.appendChild(close);
    box.appendChild(hd);

    var rec = currentRec();
    if (!rec || !(rec.results && rec.results.length)) {
      box.appendChild(el("div", "rep-body", "暂无报告数据：请先建档并完成至少一个量表评估。"));
      box.style.display = "flex";
      return;
    }
    var body = el("div", "rep-body");
    var p = rec.patient;
    body.appendChild(el("div", "rep-p",
      "受试者：" + (p.name || "—") + "（" + (p.code || "—") + "）　年龄 " +
      (p.age != null ? p.age + " 岁" : "—") + "　教育 " + (p.edu != null ? p.edu + " 年" : "—")));
    var list = el("div", "rep-list");
    rec.results.forEach(function (r) {
      var item = el("div", "rep-item " + r.level);
      item.innerHTML = "<span class='ri-name'>" + r.name + "</span>" +
        "<span class='ri-score'>" + LIGHT[r.level] + " 总分 " + r.score + "</span>" +
        "<span class='ri-label'>" + r.label + "</span>";
      list.appendChild(item);
    });
    body.appendChild(list);
    var reds = rec.results.filter(function (r) { return r.level === "red"; }).length;
    var yellows = rec.results.filter(function (r) { return r.level === "yellow"; }).length;
    var overall = reds > 0
      ? "🔴 存在需关注的异常指标，建议由神经内科医师进一步评估。"
      : (yellows > 0 ? "🟡 部分指标处于临界，建议随访观察。" : "🟢 已完成量表未见明显异常提示。");
    body.appendChild(el("div", "rep-overall", overall));
    body.appendChild(el("div", "rep-note", "* 本报告为筛查提示，不作诊断结论；最终判断由医师结合临床综合得出。"));
    box.appendChild(body);
    box.style.display = "flex";
  }

  /* ---------- 初始化 ---------- */
  function init() {
    $("roleSelect").onchange = onRoleChange;
    $("btnHome").onclick = goHome;
    load();
    renderHome();
    switchView();
    window.addEventListener("online", renderTop);
    window.addEventListener("offline", renderTop);
    // 兜底：intake 结束时 patient 还没生成（如从续聊恢复），再次触发
    if (state.view === "chat" && state.flowType === "intake") finishIntakeIfNeeded();
    renderTop();
  }

  // answer 之后也要检查收尾
  var _answer = answer;
  answer = function (it, value, display) {
    _answer(it, value, display);
    askCurrent();
    if (state.flowType === "intake") finishIntakeIfNeeded();
    if (state.flowType === "scale") finishScaleIfNeeded();
    renderTop(); renderChat(); renderComposer();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
