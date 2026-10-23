(function () {
  const vscode = acquireVsCodeApi();
  const el = (id) => document.getElementById(id);

  const mainModel = el('mainModel');
  const savings = el('savings');
  const noKey = el('noKey');
  const main = el('main');
  const messagesEl = el('messages');
  const placeholder = el('placeholder');
  const proposal = el('proposal');
  const subtasksEl = el('subtasks');
  const planMode = el('planMode');
  const workers = el('workers');
  const taskBox = el('task');
  const routeBtn = el('routeBtn');
  const toast = el('toast');

  let modelOptions = [];
  let currentPlan = null;
  let currentTask = '';

  el('savingsToggle').addEventListener('click', () => {
    const c = savings.classList.toggle('collapsed');
    el('savingsToggle').setAttribute('aria-expanded', String(!c));
  });
  el('connectBtn').addEventListener('click', () => vscode.postMessage({ type: 'setApiKey' }));
  el('clearKeyBtn').addEventListener('click', () => vscode.postMessage({ type: 'clearApiKey' }));

  routeBtn.addEventListener('click', () => {
    const task = taskBox.value.trim();
    if (!task) return;
    currentTask = task;
    vscode.postMessage({ type: 'route', task });
  });
  taskBox.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); routeBtn.click(); }
  });

  el('addSubtask').addEventListener('click', () => {
    currentPlan.subtasks.push({
      id: 'local_' + Date.now(),
      title: 'New subtask',
      prompt: '',
      suggestedModel: modelOptions[modelOptions.length - 1]?.id || '',
      splittable: true
    });
    renderPlan(currentPlan);
  });
  el('runPlan').addEventListener('click', () => {
    syncPlanFromUI();
    vscode.postMessage({ type: 'runPlan', plan: { ...currentPlan, mode: planMode.value, task: currentTask } });
  });
  el('rejectPlan').addEventListener('click', () => {
    // One subtask on the main model = "send to main instead".
    const plan = {
      mode: 'inject',
      source: currentPlan ? currentPlan.source : 'heuristic',
      subtasks: [{
        id: 'main_' + Date.now(), title: 'Main model', prompt: currentTask,
        suggestedModel: mainModel.value, splittable: false
      }],
      task: currentTask
    };
    vscode.postMessage({ type: 'runPlan', plan });
  });

  function renderMessages(messages) {
    messagesEl.querySelectorAll('.msg').forEach((n) => n.remove());
    placeholder.classList.toggle('hidden', messages.length > 0);
    for (const m of messages) {
      const node = document.createElement('div');
      node.className = `msg ${m.role}`;
      const head = document.createElement('div');
      head.className = 'msg-head';
      const role = document.createElement('span');
      role.className = 'role'; role.textContent = m.role;
      head.appendChild(role);
      const body = document.createElement('div');
      body.className = 'msg-body'; body.textContent = m.content;
      node.appendChild(head); node.appendChild(body);
      messagesEl.appendChild(node);
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function renderPlan(plan) {
    currentPlan = plan;
    proposal.classList.remove('hidden');
    planMode.value = plan.mode;
    el('planSource').textContent = plan.source === 'ollama' ? '(local Ollama)' : '(heuristic fallback)';
    subtasksEl.innerHTML = '';
    plan.subtasks.forEach((s, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'subtask'; wrap.dataset.idx = String(i);

      const titleRow = document.createElement('div');
      titleRow.className = 'subtask-row';
      const title = document.createElement('input');
      title.className = 'title-in'; title.value = s.title; title.dataset.k = 'title';
      const modelSel = document.createElement('select');
      modelSel.dataset.k = 'suggestedModel';
      for (const m of modelOptions) {
        const opt = document.createElement('option');
        opt.value = m.id; opt.textContent = m.displayName;
        if (m.id === s.suggestedModel) opt.selected = true;
        modelSel.appendChild(opt);
      }
      const del = document.createElement('button');
      del.className = 'icon-btn'; del.textContent = '🗑'; del.title = 'Remove';
      del.addEventListener('click', () => { currentPlan.subtasks.splice(i, 1); renderPlan(currentPlan); });
      titleRow.append(title, modelSel, del);

      const prompt = document.createElement('textarea');
      prompt.rows = 2; prompt.value = s.prompt; prompt.dataset.k = 'prompt';
      prompt.placeholder = 'Subtask prompt…';

      wrap.append(titleRow, prompt);
      subtasksEl.appendChild(wrap);
    });
  }

  function syncPlanFromUI() {
    const rows = subtasksEl.querySelectorAll('.subtask');
    const subs = [];
    rows.forEach((row, i) => {
      const base = currentPlan.subtasks[i] || { id: 'local_' + i, splittable: true };
      const get = (k) => row.querySelector(`[data-k="${k}"]`)?.value ?? '';
      subs.push({
        id: base.id,
        title: get('title') || 'Subtask',
        prompt: get('prompt'),
        suggestedModel: get('suggestedModel'),
        splittable: base.splittable
      });
    });
    currentPlan.subtasks = subs.filter((s) => s.prompt.trim() !== '');
    currentPlan.mode = planMode.value;
  }

  function addChip(id, title, model, running) {
    const chip = document.createElement('div');
    chip.className = 'chip ' + (running ? 'running' : 'done');
    chip.id = 'chip_' + id;
    chip.textContent = `${title} · ${short(model)}`;
    workers.appendChild(chip);
  }
  function short(id) { return (id || '').replace('claude-', '').split('-')[0]; }

  function showToast(m) { toast.textContent = m; toast.classList.remove('hidden'); setTimeout(() => toast.classList.add('hidden'), 4000); }

  window.addEventListener('message', (event) => {
    const msg = event.data;
    switch (msg.type) {
      case 'init':
        modelOptions = msg.models;
        mainModel.innerHTML = '';
        for (const m of msg.models) {
          const o = document.createElement('option');
          o.value = m.id; o.textContent = m.displayName;
          if (m.id === msg.mainModelId) o.selected = true;
          mainModel.appendChild(o);
        }
        el('ollamaBadge').classList.toggle('hidden', msg.ollamaReachable);
        break;
      case 'keyState':
        noKey.classList.toggle('hidden', msg.hasKey);
        main.classList.toggle('hidden', !msg.hasKey);
        break;
      case 'messages':
        renderMessages(msg.messages);
        break;
      case 'routing':
        routeBtn.disabled = msg.routing;
        el('statusLine').textContent = msg.routing ? 'Routing locally…' : 'Ready';
        break;
      case 'plan':
        currentTask = msg.task || currentTask;
        renderPlan(msg.plan);
        break;
      case 'planCleared':
        proposal.classList.add('hidden');
        workers.classList.add('hidden');
        workers.innerHTML = '';
        taskBox.value = '';
        break;
      case 'workersStart':
        proposal.classList.add('hidden');
        workers.classList.remove('hidden');
        workers.innerHTML = '';
        msg.subtasks.forEach((s) => addChip(s.id, s.title, s.model, true));
        break;
      case 'workerDone': {
        const chip = el('chip_' + msg.id);
        if (chip) { chip.className = 'chip done'; chip.textContent += ` · saved ${msg.saving}`; }
        break;
      }
      case 'synthesizing':
        el('statusLine').textContent = msg.synthesizing ? 'Main model synthesizing…' : 'Ready';
        break;
      case 'savings':
        el('savedTotal').textContent = msg.totalAllTime;
        el('savedSession').textContent = msg.totalSession;
        el('savedDownshift').textContent = msg.downshiftTotal;
        el('savedCache').textContent = msg.cacheTotal;
        el('savedRouter').textContent = msg.routerTotal;
        break;
      case 'needKey':
        showToast('Set your API key first (Snippy: Set API Key).');
        break;
      case 'error':
        showToast(msg.message || 'Something went wrong.');
        break;
    }
  });

  vscode.postMessage({ type: 'ready' });
})();
