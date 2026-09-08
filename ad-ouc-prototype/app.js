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
    self:      { name: "受试者（自评）", tag: "自评", desc: "完成本人自评量表（SCD-Q9），界面放大字号，不显示分数与灯色。" },
    informant: { name: "家属（知情者）", tag: "家属", desc: "仅做知情者量表（FAQ / NPI / CDR），问题人称自动变为『他/她』。" }
  };
  function roleTag(r) { return (ROLES[r] && ROLES[r].tag) || r; }
  /* 三通道：首页按通道分流（参考 ad-scd.ai.studio 的三入口结构）。
     rater 通道可见全部量表；self / informant 仅见通道内量表。 */
  var CHANNELS = {
    self: {
      name: "受试者 / 自评通道", en: "Patient Self-Assessment",
      desc: "面向受试者本人。大字清晰排版、语音朗读、生活化对话，轻松完成基础信息与主观认知自评。",
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
  var CHANNEL_META = {
    self: { icon: "☀", tone: "green", action: "进入受试者自评" },
    informant: { icon: "家", tone: "magenta", action: "进入知情者评定" },
    rater: { icon: "医", tone: "blue", action: "进入医师工作站" }
  };
  var PATIENT_FIELD_ALIASES = {
    code: ["研究编号", "患者编号", "编号", "code", "id"],
    name: ["姓名", "患者姓名", "受试者姓名", "name"],
    gender: ["性别", "gender", "sex"],
    birth: ["出生年份", "出生年", "出生日期", "birth", "birthday"],
    age: ["年龄", "age"],
    edu: ["教育年限", "受教育年限", "教育", "edu"],
    height: ["身高", "身高cm", "height"],
    weight: ["体重", "体重kg", "weight"],
    marry: ["婚姻", "婚姻状况", "marital"],
    live: ["居住", "居住情况", "居住方式", "living"],
    phone: ["电话", "手机号", "联系方式", "手机", "phone", "mobile"]
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
    skippedScales: {},       // 按量表记录主动跳过，跳过不生成分数
    drafts: {},              // 按角色保存的未完成流程草稿
    intakeTargetCode: null,  // 表格导入补充信息时需要更新的患者编号
    intakeCompleted: false,  // 防止建档收尾逻辑重复执行
    scaleCompleted: false,   // 防止量表完成提示和结果重复写入
    intakeSource: null,      // manual / table_import
    intakeOriginRole: null,  // 表格导入发起角色
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
      setSaveStatus("已保存", "saved");
    } catch (e) { /* 忽略存储异常 */ }
  }
  function setSaveStatus(text, tone) {
    var node = $("saveStatus");
    if (!node) return;
    node.textContent = text;
    node.className = "save-status" + (tone ? " " + tone : "");
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
  /* 华盛顿大学 CDR Global 判定（演示实现，精确判定应按官方查表） */
  function cdrGlobal(b) {
    var m = b.r1, others = [b.r2, b.r3, b.r4, b.r5, b.r6];
    var maxOther = Math.max.apply(null, others);
    var cntHalf = others.filter(function (x) { return x >= 0.5; }).length;
    if (m === 0 && maxOther === 0) return 0;
    if (m === 0.5 && maxOther === 0) return 0.5;
    if (m >= 1 && m < 2 && cntHalf >= 1) return 1;
    if (m >= 2 && m < 3 && maxOther >= 1 && cntHalf >= 2) return 2;
    if (m === 3 && others.filter(function (x) { return x === 3; }).length >= 3) return 3;
    return m; // 兜底：按记忆域近似
  }

  function compute(flow, answers) {
    var sc = flow.scoring || { type: "sum", thresholds: [] };
    var total = 0, details = null;
    if (sc.type === "primary") {
      total = Number(answers[sc.primaryItem] || 0);
      if (flow.short === "AVLT" || flow.short === "AVLT-H") {
        var at1 = Number(answers.t1 || 0), at2 = Number(answers.t2 || 0), at3 = Number(answers.t3 || 0);
        details = { learning: { t1: at1, t2: at2, t3: at3, sum: at1 + at2 + at3 },
                    recog: answers.n5 != null ? Number(answers.n5) : null };
      }
      if (flow.short === "VFT") {
        details = { total: Number(answers.v1 || 0),
                    segments: [Number(answers.v2 || 0), Number(answers.v3 || 0),
                               Number(answers.v4 || 0), Number(answers.v5 || 0)] };
      }
    } else {
      flow.items.forEach(function (it) {
        var v = answers[it.id];
        if (v == null) return;
        if (it.count === false) return; // 仅作记录/趋势、不计入总分（如 VFT 分段）
        if (it.kind === "choice" || it.kind === "emoji" ||
            it.kind === "number" || it.kind === "timer" || it.kind === "recog") total += Number(v);
      });
    }

    // 各维度小计
    var dims = null;
    if (flow.dimensions && flow.dimensions.length) {
      dims = {};
      flow.dimensions.forEach(function (d) {
        var s = 0, m = 0;
        d.items.forEach(function (id) {
          var it = null;
          for (var i = 0; i < flow.items.length; i++) { if (flow.items[i].id === id) { it = flow.items[i]; break; } }
          var v = answers[id];
          if (v != null && it && it.count !== false &&
              (it.kind === "choice" || it.kind === "emoji" ||
               it.kind === "number" || it.kind === "timer" || it.kind === "recog")) {
            s += Number(v); m += (it.max != null ? Number(it.max) : 0);
          }
        });
        dims[d.key] = { name: d.name, score: s, max: d.max || m };
      });
    }

    var hit = null;
    (sc.thresholds || []).forEach(function (t) {
      if (total >= t.min && total <= t.max) hit = t;
    });
    if (!hit) hit = { level: "yellow", label: "（未匹配阈值）" };
    var level = hit.level, label = hit.label;

    // CDR：由记忆域主导给出 Global，灯色与标签以 Global 为准
    if (flow.short === "CDR") {
      var boxes = {};
      flow.items.forEach(function (it) { boxes[it.id] = Number(answers[it.id] || 0); });
      var g = cdrGlobal(boxes);
      var gname = { 0: "正常", 0.5: "可疑/极早期", 1: "轻度痴呆", 2: "中度痴呆", 3: "重度痴呆" }[g] || ("级别 " + g);
      var glevel = (g === 0 || g === 0.5) ? "green" : (g === 1 ? "yellow" : "red");
      level = glevel;
      label = "CDR-SB " + fmt(total) + " · Global " + g + "（" + gname + "）";
      details = { sb: total, global: g, globalName: gname };
    }
    return { total: total, level: level, label: label, details: details, dimensions: dims };
  }

  /* ---------- 消息流 ---------- */
  function botSay(text, light, emphasis) {
    state.messages.push({ side: "bot", text: text, light: light || null, emphasis: !!emphasis });
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

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  var HIGHLIGHT_RE = /(研究编号|姓名|性别|出生年份|年龄|教育年限|身高|体重|婚姻(?:状况)?|居住(?:情况)?|手机号|电话|总分|异常|临界|正常范围|未完成|已跳过|完成)/g;
  function appendHighlightedText(parent, text, light) {
    var source = String(text == null ? "" : text), last = 0, match;
    HIGHLIGHT_RE.lastIndex = 0;
    while ((match = HIGHLIGHT_RE.exec(source))) {
      if (match.index > last) parent.appendChild(document.createTextNode(source.slice(last, match.index)));
      var mark = el("span", "field-highlight", match[0]);
      if (light === "red" || /异常|未完成/.test(match[0])) mark.classList.add("alert");
      else if (light === "yellow" || /临界|已跳过/.test(match[0])) mark.classList.add("warn");
      else if (/正常范围/.test(match[0])) mark.classList.add("good");
      parent.appendChild(mark);
      last = match.index + match[0].length;
    }
    if (last < source.length) parent.appendChild(document.createTextNode(source.slice(last)));
  }

  /* ---------- 渲染：消息流 ---------- */
  function renderChat() {
    var box = $("chat");
    box.innerHTML = "";
    var currentBot = -1;
    var hasCurrentQuestion = state.flow && state.flow.items && state.idx < state.flow.items.length;
    if (hasCurrentQuestion) {
      state.messages.forEach(function (m, i) { if (m.side === "bot") currentBot = i; });
    }
    state.messages.forEach(function (m, messageIndex) {
      var row = el("div", "row " + (m.side === "bot" ? "left" : "right") +
        (messageIndex === currentBot ? " current-row" : " history-row"));
      var b = el("div", "bubble " + (m.side === "bot" ? "bot" : "user"));
      if (messageIndex === currentBot && m.side === "bot") {
        b.classList.add("current");
        b.setAttribute("aria-current", "step");
      }
      if (m.emphasis || (m.side === "bot" && /重要|研究编号|年龄|请问|完成|注意/.test(m.text))) b.classList.add("key");
      if (m.light) {
        b.classList.add("result", m.light);
        b.innerHTML = "";
        var l = el("div", "light " + m.light, LIGHT[m.light]);
        var t = el("div", "rtxt");
        appendHighlightedText(t, m.text, m.light);
        b.appendChild(l); b.appendChild(t);
      } else {
        appendHighlightedText(b, m.text, m.light);
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
    c.className = "composer";
    if (state.view !== "chat") return;

    var flow = state.flow;
    if (!flow) {
      c.classList.add("composer-actions");
      if (state.flowType === "scaleSkipped") {
        c.appendChild(bigBtn("🏠 返回首页", goHome, "primary guide"));
      }
      return;
    }

    renderProgress(c, flow);
    if (state.flowType === "intake" && state.intakeSource === "table_import" && state.role !== "self" && state.idx < flow.items.length) {
      c.appendChild(bigBtn("👤 由患者本人补填", handoffMissingToPatient, "secondary"));
      c.appendChild(el("div", "handoff-hint", "将保留已识别信息，仅让患者填写缺少的项目。"));
    }

    // 流程已结束
    if (state.idx >= flow.items.length) {
      c.classList.add("composer-actions");
      var tip = el("div", "hint", "本环节已完成 ✅");
      c.appendChild(tip);
      if (state.flowType === "intake") {
        c.appendChild(bigBtn("➡ 进入量表评估", function () { showScaleMenu(); }, "primary guide"));
      } else {
        c.appendChild(bigBtn("➡ 再做一个量表", function () { showScaleMenu(); }, "primary guide"));
        c.appendChild(bigBtn("🏠 返回首页", goHome, "secondary"));
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
    } else if (it.kind === "number") {
      if (it.reveal && state.role === "rater") c.appendChild(revealPanel(it.reveal));
      if (it.anchors) c.appendChild(anchorPanel(it.anchors));
      c.appendChild(numberBlock(it, function (val) { answer(it, val, "" + val); }));
    } else if (it.kind === "timer") {
      c.appendChild(timerBlock(it));
    } else if (it.kind === "delay") {
      c.appendChild(delayBlock(it));
    } else if (it.kind === "recog") {
      c.appendChild(recogBlock(it));
    } else { // text
      var input = el("input", "textin");
      var error = el("div", "input-error");
      input.placeholder = "请输入…";
      input.type = "text";
      var send = bigBtn("发送", function () {
        var v = input.value.trim();
        var validation = validateValue(it, v);
        if (!validation.ok) { error.textContent = validation.message; error.classList.add("show"); input.focus(); return; }
        answer(it, v, v || "未填写");
      });
      c.appendChild(input); c.appendChild(error); c.appendChild(send);
      if (it.optional) {
        c.appendChild(bigBtn("暂不填写", function () { answer(it, "", "暂不填写"); }, "secondary"));
      }
    }
  }

  function bigBtn(label, fn, variant) {
    var b = el("button", "bigbtn" + (variant ? " " + variant : ""), label);
    b.type = "button";
    b.onclick = fn;
    return b;
  }

  function normalizeState() {
    if (state.channel && CHANNELS[state.channel]) {
      state.role = state.channel;
    } else if (state.channel && !CHANNELS[state.channel]) {
      state.channel = null;
    }
    if (!ROLES[state.role]) state.role = "rater";
    if (!state.drafts || typeof state.drafts !== "object") state.drafts = {};
  }
  function renderProgress(container, flow) {
    var wrap = el("div", "progress-wrap");
    var total = flow.items.length;
    if (!total) return;
    var current = Math.min(state.idx + 1, total);
    var label = el("div", "progress-label", "当前进度 " + current + " / " + total);
    var track = el("div", "progress-track");
    var bar = el("div", "progress-bar");
    bar.style.width = Math.round((Math.min(state.idx, total) / total) * 100) + "%";
    track.appendChild(bar); wrap.appendChild(label); wrap.appendChild(track); container.appendChild(wrap);
  }
  function validateValue(it, value) {
    var text = String(value == null ? "" : value).trim();
    if (!text && !it.optional) return { ok: false, message: "请先填写后再继续。" };
    if (!text && it.optional) return { ok: true };
    if (it.id === "name" && (text.length < 2 || text.length > (it.maxLength || 40))) {
      return { ok: false, message: "姓名请填写 2~40 个字。" };
    }
    if (it.pattern && !(new RegExp(it.pattern)).test(text)) {
      return { ok: false, message: "手机号格式不正确，请输入 11 位手机号。" };
    }
    if ((it.kind === "number" || it.kind === "timer") && (!/^\d+(\.\d+)?$/.test(text))) {
      return { ok: false, message: "请输入数字，不要包含字母或其他符号。" };
    }
    if ((it.kind === "number" || it.kind === "timer") && it.min != null && Number(text) < it.min) {
      return { ok: false, message: "请输入不小于 " + it.min + " 的数值。" };
    }
    if ((it.kind === "number" || it.kind === "timer") && it.max != null && Number(text) > it.max) {
      return { ok: false, message: "请输入不大于 " + it.max + " 的数值。" };
    }
    if (it.id === "birth") {
      var year = Number(text), now = new Date().getFullYear();
      if (year < now - 120 || year > now - 1) return { ok: false, message: "出生年份应在 " + (now - 120) + " 到 " + (now - 1) + " 年之间。" };
    }
    return { ok: true };
  }
  function setNumberError(node, message) {
    node.textContent = message; node.classList.add("show");
  }
  function numberBlock(it, cb) {
    var wrap = el("div", "numwrap");
    var input = el("input", "textin");
    var error = el("div", "input-error");
    input.type = "number";
    if (it.min != null) input.min = it.min;
    if (it.max != null) input.max = it.max;
    if (it.hint) input.placeholder = it.hint;
    var ok = bigBtn("确认", function () {
      var v = parseFloat(input.value);
      var validation = validateValue(it, input.value);
      if (!validation.ok) { setNumberError(error, validation.message); input.focus(); return; }
      if (isNaN(v) || v < 0) { setNumberError(error, "请输入不小于 0 的数字。"); input.focus(); return; }
      if (it.min != null && v < it.min) { setNumberError(error, "请输入不小于 " + it.min + " 的数值。"); input.focus(); return; }
      if (it.max != null && v > it.max) { setNumberError(error, "请输入不大于 " + it.max + " 的数值。"); input.focus(); return; }
      cb(v);
    });
    wrap.appendChild(input); wrap.appendChild(ok); wrap.appendChild(error);
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

  /* 主试专用词表面板：仅主试可见，受试者全程看不到（防泄题核心） */
  function revealPanel(reveal) {
    var wrap = el("div", "reveal-panel");
    var head = el("div", "reveal-head");
    head.appendChild(el("span", "reveal-title", "🔒 " + (reveal.title || "主试专用词表")));
    var body = el("div", "reveal-body");
    body.style.display = "none";
    var toggle = bigBtn("显示词表", function () {
      if (body.style.display === "none") { body.style.display = "block"; toggle.textContent = "隐藏词表"; }
      else { body.style.display = "none"; toggle.textContent = "显示词表"; }
    }, "secondary");
    (reveal.words || []).forEach(function (w, i) {
      body.appendChild(el("span", "reveal-word", (i + 1) + ". " + w));
    });
    head.appendChild(toggle);
    wrap.appendChild(head); wrap.appendChild(body);
    return wrap;
  }

  /* 主试评分锚点：结构化追问的评分依据 */
  function anchorPanel(anchors) {
    var wrap = el("div", "anchor-panel");
    wrap.appendChild(el("div", "anchor-title", "评分锚点（主试参考）"));
    Object.keys(anchors).map(Number).sort(function (a, b) { return a - b; }).forEach(function (k) {
      var row = el("div", "anchor-row");
      row.appendChild(el("span", "anchor-score", k + " 分"));
      row.appendChild(el("span", "anchor-desc", anchors[k]));
      wrap.appendChild(row);
    });
    return wrap;
  }

  /* 延迟回忆倒计时节点：临床约 20 分钟，演示用短倒计时代替；到点自动进入下一项 */
  function delayBlock(it) {
    var wrap = el("div", "delay-wrap");
    var demo = it.demoSeconds || it.seconds;
    var disp = el("div", "timerdisp", demo + "s");
    var note = el("div", "hint", "延迟回忆前等待（临床约 " + Math.round(it.seconds / 60) +
      " 分钟）。演示倒计时 " + demo + " 秒代替临床等待；期间可完成非言语任务（如画钟测验）。");
    var start = bigBtn("▶ 开始等待计时", function () {
      start.disabled = true; skip.disabled = true;
      var left = demo;
      disp.textContent = left + "s";
      state._timer = setInterval(function () {
        left--;
        disp.textContent = left + "s";
        if (left <= 10) disp.classList.add("warn");
        if (left <= 0) {
          clearInterval(state._timer); state._timer = null;
          disp.textContent = "时间到！";
          answer(it, 1, "等待结束·进入延迟回忆");
        }
      }, 1000);
    });
    var skip = bigBtn("⏭ 跳过等待（演示用）", function () {
      if (state._timer) { clearInterval(state._timer); state._timer = null; }
      answer(it, 1, "已跳过等待（演示）");
    }, "secondary");
    wrap.appendChild(disp); wrap.appendChild(note); wrap.appendChild(start); wrap.appendChild(skip);
    return wrap;
  }

  /* 再认九宫格：目标词 + 干扰词混排，点选后统计正确数与假阳性 */
  function recogBlock(it) {
    var wrap = el("div", "recog-wrap");
    var words = (it.targets || []).concat(it.distractors || []);
    for (var i = words.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = words[i]; words[i] = words[j]; words[j] = tmp;
    }
    var selected = {};
    var grid = el("div", "recog-grid");
    var count = el("div", "hint", "已选 0 个");
    words.forEach(function (w) {
      var b = el("button", "recog-word", w);
      b.type = "button";
      b.onclick = function () {
        if (selected[w]) { delete selected[w]; b.classList.remove("sel"); }
        else { selected[w] = true; b.classList.add("sel"); }
        count.textContent = "已选 " + Object.keys(selected).length + " 个";
      };
      grid.appendChild(b);
    });
    var confirm = bigBtn("✅ 确认再认", function () {
      var hits = 0, fp = 0;
      Object.keys(selected).forEach(function (w) {
        if ((it.targets || []).indexOf(w) >= 0) hits++;
        else if ((it.distractors || []).indexOf(w) >= 0) fp++;
      });
      answer(it, hits, "再认正确 " + hits + "/12（假阳性 " + fp + "）");
    });
    wrap.appendChild(count); wrap.appendChild(grid); wrap.appendChild(confirm);
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
  function startIntake(actorRole) {
    // 医生或家属均可录入基础信息；调用方不传角色时默认为医生。
    // DOM onclick 直接传入事件对象时，必须降级为医生角色，避免 role 变成对象导致整页渲染异常。
    state.role = (typeof actorRole === "string" && ROLES[actorRole]) ? actorRole : "rater";
    state.channel = state.role;
    state.patient = null;
    state.intakeTargetCode = null;
    state.intakeCompleted = false;
    state.intakeSource = "manual";
    state.intakeOriginRole = state.role;
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
    if (state.flowType === "intake" && state.idx >= state.flow.items.length && !state.intakeCompleted) {
      var a = state.answers;
      var age = a.birth ? (new Date().getFullYear() - Number(a.birth)) : null;
      var existing = state.intakeTargetCode ? state.patients.filter(function (p) {
        return p.patient.code === state.intakeTargetCode;
      })[0] : null;
      var patient = {
        code: existing ? existing.patient.code : (a.code || genCode()),
        name: a.name, gender: a.gender === 0 ? "男" : (a.gender === 1 ? "女" : a.gender),
        birth: a.birth, age: age, edu: a.edu, height: a.height, weight: a.weight,
        marry: textOf(a.marry), live: textOf(a.live), phone: a.phone, time: nowStr()
      };
      state.patient = patient;
      if (existing) existing.patient = patient;
      else state.patients.push({ patient: patient, results: [] });
      state.intakeCompleted = true;
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
    save();
    switchView();
    renderScaleCards();
  }
  function renderScaleCards() {
    var c = $("composer");
    c.innerHTML = "";
    c.classList.add("composer-actions");
    var visible = Object.keys(window.SCALES).filter(function (k) { return scaleVisibleTo(k, state.role); });
    var hint = el("div", "hint",
      "当前身份【" + ROLES[state.role].name + "】可操作以下量表（点卡片开始）：");
    c.appendChild(hint);
    visible.forEach(function (key) {
      var s = window.SCALES[key];
      var card = el("button", "scaleCard");
      card.type = "button";
      card.innerHTML = "<b>" + s.short + "</b><span>" + s.name + "</span>" +
        "<em class='ctag " + s.role + "'>" + roleTag(s.role) + "</em>";
      card.onclick = function () { startScale(key); };
      c.appendChild(card);
    });
    if (!visible.length) {
      c.appendChild(el("div", "hint", "（当前身份暂无可操作量表）"));
    }
    if (state.role === "self" && visible.indexOf("SCD-Q9") >= 0) {
      c.appendChild(bigBtn("跳过本人自评", function () { skipScale("SCD-Q9"); }, "secondary"));
    }
    c.appendChild(bigBtn("🏠 返回首页", goHome));
  }
  function startScale(key) {
    var s = window.SCALES[key];
    if (!s) return;
    if (!state.patient) {
      if (state.role === "self") startSubjectIntake();
      else startIntake(state.role === "informant" ? "informant" : "rater");
      return;
    }
    state.flow = s; state.flowType = "scale";
    state.scaleCompleted = false;
    state.idx = 0; state.answers = {};
    state.messages = [];
    state.view = "chat";
    botSay(applyPronoun(s.intro));
    botSay(applyPronoun(s.items[0].q));
    switchView();
  }

  // 量表结束时计分
  function finishScaleIfNeeded() {
    if (state.flowType === "scale" && state.idx >= state.flow.items.length && !state.scaleCompleted) {
      var r = compute(state.flow, state.answers);
      var who = state.role === "self" ? "（患者自评）" : (state.role === "informant" ? "（家属提供）" : "（主试评定）");
      // 主试/导出视图显示分数与灯；患者侧仅泛化鼓励
      if (state.role === "self") {
        botSay("测验完成啦，您很棒！结果建议由医生进一步评估～", "green");
      } else {
        var extra = "";
        if (r.details) {
          if (r.details.learning) {
            var L = r.details.learning;
            extra += " 学习曲线 " + L.t1 + "→" + L.t2 + "→" + L.t3 + "（累计 " + L.sum + "）词";
          }
          if (r.details.recog != null) extra += "；再认正确 " + r.details.recog + "/12";
          if (r.details.segments) {
            var S = r.details.segments;
            extra += "；60秒总词数 " + r.details.total + "（分段 0-15:" + S[0] + "/16-30:" + S[1] + "/31-45:" + S[2] + "/46-60:" + S[3] + "）";
          }
          if (r.details.global != null) extra += "；CDR-SB " + r.details.sb + "，Global " + r.details.global + "（" + r.details.globalName + "）";
        }
        if (r.dimensions && Object.keys(r.dimensions).length) {
          var dimText = Object.keys(r.dimensions).map(function (k) {
            var d = r.dimensions[k];
            return d.name + " " + d.score + "/" + d.max;
          }).join(" · ");
          extra += "\n【维度得分】" + dimText;
        }
        botSay(s_title(state.flow) + who + " 总分 " + fmt(r.total) +
               "。" + LIGHT[r.level] + " " + r.label + extra, r.level);
      }
      // 记录结果
      if (state.patient) {
        var rec = state.patients.filter(function (p) { return p.patient.code === state.patient.code; })[0];
        if (rec) {
          rec.results = rec.results.filter(function (x) { return x.scale !== state.flow.short; });
          rec.results.push({
            scale: state.flow.short, name: state.flow.name, score: r.total, level: r.level,
            label: r.label, time: nowStr(),
            global: (r.details && r.details.global != null) ? r.details.global : null,
            dimensions: r.dimensions
          });
        }
      }
      state.scaleCompleted = true;
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
    if (hasActiveFlow()) {
      if (!state.drafts || typeof state.drafts !== "object") state.drafts = {};
      state.drafts[state.role] = {
        flow: state.flow, flowType: state.flowType, idx: state.idx,
        answers: state.answers, messages: state.messages,
        patientCode: state.patient && state.patient.code
      };
    }
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
        var meta = CHANNEL_META[r] || { icon: "•", tone: "blue", action: "进入" };
        var card = el("button", "chCard ch-" + r + " tone-" + meta.tone);
        card.type = "button";
        var scalesTxt = ch.scales
          ? ch.scales.map(function (k) { return window.SCALES[k].short; }).join(" · ")
          : "全部量表 + 建档 + 报告 + 导出";
        card.innerHTML = "<span class='ch-icon' aria-hidden='true'>" + meta.icon + "</span>" +
          "<span class='ch-copy'><b>" + ch.name + "</b><span class='chen'>" + ch.en +
          "</span><p>" + ch.desc + "</p><span class='citems'>包含测评：" + scalesTxt +
          "</span></span><span class='ch-arrow' aria-hidden='true'>→</span>";
        card.onclick = function () { enterChannel(r); };
        h.appendChild(card);
      });
      return;
    }

    // 已选通道：操作面板
    var ch = CHANNELS[state.channel];
    h.appendChild(el("div", "hrole", "当前通道：" + ch.name + "（" + ROLES[state.channel].name + "）"));
    h.appendChild(bigBtn("↩ 返回通道选择", function () {
      state.channel = null; save(); renderHome(); switchView();
    }, "secondary"));

    var resume = (state.flow && state.flow.items && state.idx < state.flow.items.length);
    if (resume) {
      var resumeName = state.patient && state.patient.name ? state.patient.name : (state.flow.name || "未完成流程");
      h.appendChild(bigBtn("↩ 继续上次（" + resumeName + "）", function () {
        state.view = "chat"; switchView();
      }, "primary guide"));
    }

    if (state.channel === "rater") {
      h.appendChild(bigBtn("➕ 录入患者基础信息", function () { startIntake("rater"); }, "primary guide"));
      h.appendChild(bigBtn("⇧ 上传表格自动填充", choosePatientFile, "secondary"));
      if (state.patient) h.appendChild(bigBtn("📋 选择量表评估", showScaleMenu, "secondary"));
      h.appendChild(bigBtn("🩺 综合诊断报告", showReport, "secondary"));
      if (state.patients.length) h.appendChild(bigBtn("📤 导出 Excel", showExportMenu, "secondary"));
      if (state.patients.length) h.appendChild(bigBtn("🗂 患者列表（管理）", showPatientList, "secondary"));
    } else if (state.channel === "self") {
      if (!state.patient) {
        h.appendChild(bigBtn("开始填写基础信息", startSubjectIntake, "primary guide"));
        h.appendChild(el("div", "hint", "完成基础信息后，可继续本人自评；也可以随时返回。"));
      } else {
        h.appendChild(bigBtn("开始本人自评", function () { startScale("SCD-Q9"); }, "primary guide"));
      }
      h.appendChild(bigBtn("跳过本人自评", function () { skipScale("SCD-Q9"); }, "secondary"));
    } else {
      h.appendChild(bigBtn("➕ 录入患者基础信息", function () { startIntake("informant"); }, "primary guide"));
      h.appendChild(bigBtn("⇧ 上传表格自动填充", choosePatientFile, "secondary"));
      if (state.patient) {
        ch.scales.forEach(function (key) {
          var s = window.SCALES[key];
          var card = el("button", "scaleCard");
          card.type = "button";
          card.innerHTML = "<b>" + s.short + "</b><span>" + s.name + "</span>";
          card.onclick = function () { startScale(key); };
          h.appendChild(card);
        });
      } else {
        h.appendChild(el("div", "hint", "请先录入或导入患者基础信息，再开始家属评定。"));
      }
    }
  }

  function enterChannel(role) {
    state.role = role;
    state.channel = role;
    state.view = "home";
    state.flow = null;
    state.flowType = null;
    state.idx = 0;
    state.answers = {};
    state.messages = [];
    restoreDraftForRole(role);
    save();
    renderTop();
    renderHome();
    switchView();
  }

  function startSubjectIntake() {
    // 受试者通道的基础信息仍使用同一套对话引擎，但保留自评身份。
    state.role = "self";
    state.channel = "self";
    state.patient = null;
    state.intakeTargetCode = null;
    state.intakeCompleted = false;
    state.intakeSource = "manual";
    state.intakeOriginRole = "self";
    state.flow = window.INTAKE;
    state.flowType = "intake";
    state.idx = 0; state.answers = {};
    state.messages = [];
    state.view = "chat";
    botSay("您好，先花几分钟填写基本信息，内容会自动保存。您可以随时暂停。 ");
    askCurrent();
    save();
    switchView();
  }

  function skipScale(key) {
    var s = window.SCALES[key];
    if (!s) return;
    if (!state.skippedScales || typeof state.skippedScales !== "object") state.skippedScales = {};
    state.skippedScales[key] = { status: "skipped", time: nowStr() };
    state.view = "chat";
    state.flow = null;
    state.flowType = "scaleSkipped";
    state.idx = 0;
    state.answers = {};
    state.messages = [];
    botSay("已跳过「" + s.name + "」。没有自测者时可以稍后由患者本人补做，跳过不会计入 0 分。", "yellow", true);
    save();
    switchView();
  }

  /* ---------- 本地表格导入 ---------- */
  function choosePatientFile() {
    var input = $("patientFileInput");
    input.value = "";
    input.click();
  }

  function normalizeHeader(value) {
    return String(value == null ? "" : value).trim().toLowerCase()
      .replace(/[\s_\-（）()：:]/g, "");
  }

  function parseDelimited(text, delimiter) {
    var rows = [], row = [], field = "", quoted = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === '"') {
        if (quoted && text[i + 1] === '"') { field += '"'; i++; }
        else quoted = !quoted;
      } else if (ch === delimiter && !quoted) {
        row.push(field); field = "";
      } else if ((ch === "\n" || ch === "\r") && !quoted) {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(field); field = "";
        if (row.some(function (v) { return String(v).trim() !== ""; })) rows.push(row);
        row = [];
      } else field += ch;
    }
    row.push(field);
    if (row.some(function (v) { return String(v).trim() !== ""; })) rows.push(row);
    return rows;
  }

  function tableRowsFromText(text, fileName) {
    if (/<table[\s>]/i.test(text)) {
      var doc = new DOMParser().parseFromString(text, "text/html");
      return Array.prototype.map.call(doc.querySelectorAll("table tr"), function (tr) {
        return Array.prototype.map.call(tr.querySelectorAll("th,td"), function (cell) {
          return cell.textContent.trim();
        });
      }).filter(function (row) { return row.length; });
    }
    var delimiter = /\.tsv$/i.test(fileName) || text.indexOf("\t") >= 0 ? "\t" : ",";
    return parseDelimited(text.replace(/^\uFEFF/, ""), delimiter);
  }

  function rowsToObjects(rows) {
    if (rows.length < 2) return [];
    var headers = rows[0].map(normalizeHeader);
    return rows.slice(1).map(function (row) {
      var obj = {};
      headers.forEach(function (header, i) { if (header) obj[header] = row[i] == null ? "" : row[i]; });
      return obj;
    }).filter(function (row) {
      return Object.keys(row).some(function (key) { return String(row[key]).trim() !== ""; });
    });
  }

  function readAliasedField(row, field) {
    var aliases = PATIENT_FIELD_ALIASES[field] || [];
    for (var i = 0; i < aliases.length; i++) {
      var key = normalizeHeader(aliases[i]);
      if (row[key] != null && String(row[key]).trim() !== "") return String(row[key]).trim();
    }
    return "";
  }

  function numberFromCell(value) {
    var match = String(value || "").replace(/,/g, "").match(/\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  }

  function rowToAnswers(row) {
    var a = {}, code = readAliasedField(row, "code");
    if (code) a.code = code;
    var name = readAliasedField(row, "name");
    if (name) a.name = name;
    var gender = readAliasedField(row, "gender").toLowerCase();
    if (/女|female|^f$/.test(gender)) a.gender = 1;
    else if (/男|male|^m$/.test(gender)) a.gender = 0;
    var birthText = readAliasedField(row, "birth");
    var birthMatch = birthText.match(/(?:19|20)\d{2}/);
    if (birthMatch) a.birth = Number(birthMatch[0]);
    else {
      var age = numberFromCell(readAliasedField(row, "age"));
      if (age != null) a.birth = new Date().getFullYear() - age;
    }
    ["edu", "height", "weight"].forEach(function (field) {
      var n = numberFromCell(readAliasedField(row, field));
      if (n != null) a[field] = n;
    });
    ["marry", "live", "phone"].forEach(function (field) {
      var value = readAliasedField(row, field);
      if (value) a[field] = value;
    });
    window.INTAKE.items.forEach(function (it) {
      if (a[it.id] == null || !validateValue(it, a[it.id]).ok) delete a[it.id];
    });
    return a;
  }

  function patientToAnswers(patient) {
    if (!patient) return {};
    var answers = {
      code: patient.code, name: patient.name, birth: patient.birth,
      edu: patient.edu, height: patient.height, weight: patient.weight,
      marry: patient.marry, live: patient.live, phone: patient.phone
    };
    if (patient.gender === "女") answers.gender = 1;
    else if (patient.gender === "男") answers.gender = 0;
    return answers;
  }

  function showImportError(message) {
    state.view = "chat"; state.flow = null; state.flowType = "import";
    state.messages = [];
    botSay(message, null, true);
    switchView();
    var c = $("composer");
    c.classList.add("composer-actions");
    c.appendChild(bigBtn("重新选择表格", choosePatientFile, "primary guide"));
    c.appendChild(bigBtn("返回首页", goHome, "secondary"));
  }

  function handoffMissingToPatient() {
    if (state.flowType !== "intake" || state.intakeSource !== "table_import" || state.idx >= state.flow.items.length) return;
    var missingCount = state.flow.items.length - state.idx;
    state.drafts[state.role] = {
      flow: state.flow, flowType: state.flowType, idx: state.idx,
      answers: state.answers, messages: state.messages,
      patientCode: state.patient && state.patient.code,
      handoff: "self"
    };
    state.role = "self";
    state.channel = "self";
    botSay("已为患者准备好补填环节，还需要完成 " + missingCount + " 项。请将设备交给患者本人。", null, true);
    askCurrent();
    save();
    renderTop(); renderChat(); renderComposer();
  }

  function beginImportedIntake(rows) {
    var objects = rowsToObjects(rows);
    if (!objects.length) { showImportError("没有找到可读取的患者记录，请确认第一行为表头、第二行开始为数据。"); return; }
    var mapped = objects.map(function (row) { return { row: row, answers: rowToAnswers(row) }; });
    var currentCode = state.patient && state.patient.code;
    var currentName = state.patient && state.patient.name;
    var selected = mapped.filter(function (item) {
      return (currentCode && item.answers.code === currentCode) ||
        (currentName && item.answers.name === currentName);
    })[0] || mapped[0];
    var target = state.patient && ((selected.answers.code && selected.answers.code === currentCode) ||
      (selected.answers.name && selected.answers.name === currentName)) ? state.patient : null;
    var answers = patientToAnswers(target);
    Object.keys(selected.answers).forEach(function (key) { answers[key] = selected.answers[key]; });
    var missing = window.INTAKE.items.filter(function (it) { return answers[it.id] == null || answers[it.id] === ""; });
    var recognized = window.INTAKE.items.length - missing.length;
    state.intakeTargetCode = target && target.code;
    state.intakeCompleted = false;
    state.intakeSource = "table_import";
    state.intakeOriginRole = state.role;
    state.patient = target;
    state.flow = {
      id: "intake-import", name: "表格导入补充信息", role: state.role,
      intro: "", items: missing
    };
    state.flowType = "intake";
    state.idx = 0;
    state.answers = answers;
    state.messages = [];
    state.view = "chat";
    botSay("表格读取成功：共找到 " + mapped.length + " 条记录，已匹配并识别 " + recognized + " 项基础信息。", null, true);
    if (missing.length) {
      botSay("还有 " + missing.length + " 项缺失或不合理，请继续补充。", null, true);
      askCurrent();
    } else botSay("基础信息完整，正在生成患者档案。", null, true);
    save();
    switchView();
  }

  function handlePatientFile(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!/\.(csv|tsv|xls)$/i.test(file.name)) {
      showImportError("暂不支持该文件格式。请选择 CSV、TSV 或本系统导出的 .xls 文件。");
      return;
    }
    var reader = new FileReader();
    reader.onerror = function () { showImportError("文件读取失败，请确认文件未损坏后重试。"); };
    reader.onload = function () {
      var text = String(reader.result || "");
      if (!text || text.indexOf("\u0000") >= 0) {
        showImportError("该 .xls 可能是二进制工作簿。本演示版支持 CSV、TSV 和本系统导出的 HTML 格式 .xls。");
        return;
      }
      try { beginImportedIntake(tableRowsFromText(text, file.name)); }
      catch (e) { showImportError("表格解析失败，请检查表头和文件编码后重试。"); }
    };
    reader.readAsText(file, "utf-8");
  }

  /* ---------- 导出 ---------- */
  function showExportMenu() {
    state.view = "chat"; state.flow = null; state.flowType = "export";
    state.messages = []; state.idx = 0; state.answers = {};
    botSay("导出数据：选择范围后生成 Excel（.xls，Excel 可直接打开）。");
    switchView();
    var c = $("composer"); c.innerHTML = ""; c.classList.add("composer-actions");
    if (currentRec()) c.appendChild(bigBtn("📤 导出【当前患者】", function () { doExport([currentRec()]); }));
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
    keys.forEach(function (k) {
      head += "<th>" + window.SCALES[k].short + "(分)</th><th>" + window.SCALES[k].short + "(灯)</th>";
      if (k === "CDR") head += "<th>CDR-Global</th>";
    });
    head += "<th>评估时间</th></tr>";
    var rows = records.map(function (rec) {
      var p = rec.patient;
      var map = {}; (rec.results || []).forEach(function (r) { map[r.scale] = r; });
      var t = "<tr>" +
        "<td>" + escapeHtml(p.code || "") + "</td>" +
        "<td>" + escapeHtml(anonym ? "匿名" : (p.name || "")) + "</td>" +
        "<td>" + escapeHtml(p.gender || "") + "</td>" +
        "<td>" + escapeHtml(p.age != null ? p.age : "") + "</td>" +
        "<td>" + escapeHtml(p.edu != null ? p.edu : "") + "</td>" +
        "<td>" + escapeHtml(p.height != null ? p.height : "") + "</td>" +
        "<td>" + escapeHtml(p.weight != null ? p.weight : "") + "</td>" +
        "<td>" + escapeHtml(p.marry || "") + "</td>" +
        "<td>" + escapeHtml(p.live || "") + "</td>";
      keys.forEach(function (k) {
        var r = map[k];
        t += "<td>" + escapeHtml(r ? r.score : "") + "</td><td>" + escapeHtml(r ? LIGHT[r.level] : "") + "</td>";
        if (k === "CDR") t += "<td>" + escapeHtml(r && r.global != null ? r.global : "") + "</td>";
      });
      t += "<td>" + escapeHtml(p.time || "") + "</td></tr>";
      return t;
    }).join("");
    return "<html><head><meta charset='utf-8'></head><body>" +
      "<table border='1' cellspacing='0'>" + head + rows + "</table></body></html>";
  }

  /* ---------- 角色切换 ---------- */
  function hasActiveFlow() {
    return state.view === "chat" && state.flow &&
      (state.flowType === "intake" || state.flowType === "scale") &&
      state.idx < state.flow.items.length;
  }

  function leaveCurrentFlow(role) {
    if (!state.drafts || typeof state.drafts !== "object") state.drafts = {};
    state.drafts[role] = {
      flow: state.flow,
      flowType: state.flowType,
      idx: state.idx,
      answers: state.answers,
      messages: state.messages,
      patientCode: state.patient && state.patient.code
    };
    if (state._timer) { clearInterval(state._timer); state._timer = null; }
    state.view = "home";
    state.flow = null;
    state.flowType = null;
    state.idx = 0;
    state.answers = {};
    state.messages = [];
  }

  function restoreDraftForRole(role) {
    var d = state.drafts && state.drafts[role];
    if (!d || !d.flow || d.idx >= d.flow.items.length) return;
    if (d.patientCode && (!state.patient || d.patientCode !== state.patient.code)) {
      var linked = (state.patients || []).filter(function (p) { return p.patient && p.patient.code === d.patientCode; })[0];
      if (!linked) return;
      state.patient = linked.patient;
    }
    state.flow = d.flow;
    state.flowType = d.flowType;
    state.idx = d.idx;
    state.answers = d.answers || {};
    state.messages = d.messages || [];
  }

  function onRoleChange() {
    var nr = $("roleSelect").value;
    if (nr === state.role) return;
    var previousRole = state.role;
    if (hasActiveFlow()) {
      // 先持久化当前草稿；取消切换时继续留在原流程。
      save();
      var leave = confirm("当前流程已保存，是否离开？\n确定：进入新角色首页\n取消：继续当前流程");
      if (!leave) {
        $("roleSelect").value = previousRole;
        return;
      }
      leaveCurrentFlow(previousRole);
    }
    state.role = nr;
    state.channel = nr; // 同步通道，保持首页与下拉一致
    // 无论旧页面是已完成量表、量表菜单还是导出页，切换角色都从新角色首页开始。
    state.view = "home";
    state.flow = null;
    state.flowType = null;
    state.idx = 0;
    state.answers = {};
    state.messages = [];
    restoreDraftForRole(nr);
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
      item.innerHTML = "<span class='ri-name'>" + escapeHtml(r.name) + "</span>" +
        "<span class='ri-score'>" + escapeHtml(LIGHT[r.level]) + " 总分 " + escapeHtml(r.score) + "</span>" +
        "<span class='ri-label'>" + escapeHtml(r.label) + "</span>";
      if (r.dimensions && Object.keys(r.dimensions).length) {
        var dimLine = Object.keys(r.dimensions).map(function (k) {
          var d = r.dimensions[k];
          return escapeHtml(d.name) + " " + d.score + "/" + d.max;
        }).join(" · ");
        var dimNode = el("div", "ri-dims", "维度：" + dimLine);
        item.appendChild(dimNode);
      }
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

  /* ---------- 患者列表 / 管理者页 ---------- */
  function showPatientList() {
    var box = $("report");
    box.innerHTML = "";
    var hd = el("div", "rep-hd", "🗂 患者列表");
    var close = el("button", "rep-close", "✕");
    close.onclick = function () { box.style.display = "none"; };
    hd.appendChild(close);
    box.appendChild(hd);

    var body = el("div", "rep-body");
    if (!state.patients.length) {
      body.appendChild(el("div", "rep-p", "暂无患者。请先在首页录入或导入患者档案。"));
      box.appendChild(body);
      box.style.display = "flex";
      return;
    }

    var list = el("div", "patient-list");
    state.patients.forEach(function (rec, i) {
      var p = rec.patient;
      var item = el("div", "patient-item");
      var top = el("div", "patient-top");
      top.appendChild(el("span", "patient-name", (p.name || "—") + "（" + (p.code || "—") + "）"));
      top.appendChild(el("span", "patient-meta", "年龄 " + (p.age != null ? p.age : "—") + " · 教育 " + (p.edu != null ? p.edu + " 年" : "—")));
      item.appendChild(top);

      var counts = { red: 0, yellow: 0, green: 0 };
      (rec.results || []).forEach(function (r) { counts[r.level] = (counts[r.level] || 0) + 1; });
      var tags = el("div", "patient-tags");
      tags.appendChild(el("span", "tag-scales", "已完成 " + (rec.results || []).length + " 个量表"));
      if (counts.red) tags.appendChild(el("span", "tag-red", "🔴 异常 " + counts.red));
      if (counts.yellow) tags.appendChild(el("span", "tag-yellow", "🟡 临界 " + counts.yellow));
      if (!counts.red && !counts.yellow) tags.appendChild(el("span", "tag-green", "🟢 未见异常"));
      item.appendChild(tags);

      var actions = el("div", "patient-actions");
      var sel = el("button", "", "选择管理");
      sel.type = "button";
      sel.onclick = function () {
        state.patient = p;
        save();
        box.style.display = "none";
        goHome();
      };
      var rep = el("button", "", "查看报告");
      rep.type = "button";
      rep.onclick = function () {
        state.patient = p;
        save();
        showReport();
      };
      var exp = el("button", "", "导出该患者");
      exp.type = "button";
      exp.onclick = function () {
        state.patient = p;
        save();
        doExport([rec]);
      };
      var del = el("button", "danger", "删除");
      del.type = "button";
      del.onclick = function () {
        if (!confirm("确定删除「" + (p.name || p.code) + "」的全部记录？此操作不可撤销。")) return;
        state.patients.splice(i, 1);
        if (state.patient && state.patient.code === p.code) state.patient = null;
        save();
        showPatientList();
      };
      actions.appendChild(sel); actions.appendChild(rep); actions.appendChild(exp); actions.appendChild(del);
      item.appendChild(actions);
      list.appendChild(item);
    });

    body.appendChild(el("div", "rep-p", "共 " + state.patients.length + " 位受试者。点击下方「选择管理」可将某位设为当前患者，回到首页继续评估或导出。"));
    body.appendChild(list);
    box.appendChild(body);
    box.style.display = "flex";
  }

  /* ---------- 初始化 ---------- */
  function init() {
    $("roleSelect").onchange = onRoleChange;
    $("btnHome").onclick = goHome;
    $("patientFileInput").onchange = handlePatientFile;
    load();
    normalizeState();
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
