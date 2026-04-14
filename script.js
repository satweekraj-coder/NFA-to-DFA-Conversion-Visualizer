/**
 * NFA → DFA Conversion Visualizer
 * Subset Construction Algorithm — Full Implementation
 */

// ══════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════

let nfa = null;         // parsed NFA object
let dfaResult = null;   // result of subset construction
let steps = [];         // step-by-step trace
let currentStep = -1;   // which step is highlighted
let autoPlayTimer = null;
let cyNFA = null;       // Cytoscape instance (NFA)
let cyDFA = null;       // Cytoscape instance (DFA)

// ══════════════════════════════════════════════════════════
// DOM REFS
// ══════════════════════════════════════════════════════════
const $ = id => document.getElementById(id);

const dom = {
  states:      () => $('states').value.trim(),
  alphabet:    () => $('alphabet').value.trim(),
  startState:  () => $('startState').value.trim(),
  finalStates: () => $('finalStates').value.trim(),
  tHeader:     $('tHeader'),
  tRows:       $('tRows'),
  errorBox:    $('errorBox'),
  stepDisplay: $('stepDisplay'),
  stepCounter: $('stepCounter'),
  dfaTableWrapper: $('dfaTableWrapper'),
  prevBtn:     $('prevBtn'),
  nextBtn:     $('nextBtn'),
  autoPlayBtn: $('autoPlayBtn'),
  resetBtn:    $('resetBtn'),
};

// ══════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════

/** Parse comma-separated string into clean array */
function parseCSV(str) {
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

/** Canonical string key for a set of states */
function setKey(stateSet) {
  return [...stateSet].sort().join(',');
}

/** Get transition targets for a given state+symbol from NFA transition map */
function getTargets(nfaTransitions, state, symbol) {
  const key = `${state},${symbol}`;
  return nfaTransitions[key] ? [...nfaTransitions[key]] : [];
}

/** Show / hide error */
function showError(msg) {
  dom.errorBox.textContent = msg;
  dom.errorBox.classList.remove('hidden');
}
function clearError() {
  dom.errorBox.classList.add('hidden');
  dom.errorBox.textContent = '';
}

// ══════════════════════════════════════════════════════════
// ε-CLOSURE
// ══════════════════════════════════════════════════════════

/**
 * Compute ε-closure of a set of states.
 * Returns a sorted array of states reachable via ε-transitions only.
 */
function epsilonClosure(stateSet, nfaTransitions) {
  const closure = new Set(stateSet);
  const stack   = [...stateSet];

  while (stack.length > 0) {
    const s = stack.pop();
    const epsilonTargets = getTargets(nfaTransitions, s, 'ε');
    for (const t of epsilonTargets) {
      if (!closure.has(t)) {
        closure.add(t);
        stack.push(t);
      }
    }
  }
  return [...closure].sort();
}

// ══════════════════════════════════════════════════════════
// MOVE FUNCTION
// ══════════════════════════════════════════════════════════

/**
 * Compute move(T, a) = union of δ(s, a) for all s in T
 */
function move(stateSet, symbol, nfaTransitions) {
  const result = new Set();
  for (const s of stateSet) {
    const targets = getTargets(nfaTransitions, s, symbol);
    for (const t of targets) result.add(t);
  }
  return [...result].sort();
}

// ══════════════════════════════════════════════════════════
// SUBSET CONSTRUCTION ALGORITHM
// ══════════════════════════════════════════════════════════

/**
 * Convert NFA to DFA using subset construction.
 * Returns DFA definition + step-by-step trace.
 */
function subsetConstruction(nfaObj) {
  const { alphabet, finalStates, transitions } = nfaObj;
  const stepsLog = [];

  // Step 0: Initial ε-closure of start state
  const startClosure = epsilonClosure([nfaObj.startState], transitions);
  stepsLog.push({
    title: 'Initial State',
    detail: `ε-closure({${nfaObj.startState}}) = {${startClosure.join(', ')}}`,
    highlight: setKey(startClosure),
    type: 'init',
  });

  const dfaStates = new Map();   // key → { states[], isFinal, transitions{} }
  const queue    = [];
  const visited  = new Set();

  const startKey = setKey(startClosure);
  dfaStates.set(startKey, {
    states:      startClosure,
    isFinal:     startClosure.some(s => finalStates.includes(s)),
    transitions: {},
  });
  queue.push(startClosure);
  visited.add(startKey);

  // Process each DFA state
  while (queue.length > 0) {
    const currentSet = queue.shift();
    const currentKey = setKey(currentSet);

    stepsLog.push({
      title: `Processing DFA state {${currentSet.join(', ')}}`,
      detail: `Computing transitions for each symbol in alphabet: ${alphabet.join(', ')}`,
      highlight: currentKey,
      type: 'process',
    });

    for (const sym of alphabet) {
      // move
      const moved      = move(currentSet, sym, transitions);
      // ε-closure of moved set
      const closure    = epsilonClosure(moved, transitions);
      const closureKey = setKey(closure);

      stepsLog.push({
        title: `  δ({${currentSet.join(',')}}, ${sym})`,
        detail: `move = {${moved.join(', ') || '∅'}} → ε-closure = {${closure.join(', ') || '∅'}}  →  DFA state: {${closure.join(', ') || '∅'}}`,
        highlight: closureKey,
        type: 'transition',
        from: currentKey,
        symbol: sym,
        to: closureKey,
      });

      if (closure.length === 0) {
        // Dead state (∅)
        dfaStates.get(currentKey).transitions[sym] = '∅';
        continue;
      }

      dfaStates.get(currentKey).transitions[sym] = closureKey;

      if (!visited.has(closureKey)) {
        visited.add(closureKey);
        dfaStates.set(closureKey, {
          states:  closure,
          isFinal: closure.some(s => finalStates.includes(s)),
          transitions: {},
        });
        queue.push(closure);

        stepsLog.push({
          title: `  New DFA state discovered: {${closure.join(', ')}}`,
          detail: `Added to queue for processing.${closure.some(s => finalStates.includes(s)) ? ' ★ This is a FINAL state.' : ''}`,
          highlight: closureKey,
          type: 'new-state',
        });
      }
    }
  }

  stepsLog.push({
    title: 'Conversion Complete',
    detail: `DFA has ${dfaStates.size} state(s) across ${alphabet.length} symbol(s).`,
    type: 'done',
  });

  return { dfaStates, startKey, stepsLog };
}

// ══════════════════════════════════════════════════════════
// INPUT PARSING & VALIDATION
// ══════════════════════════════════════════════════════════

function parseNFA() {
  const stateList  = parseCSV(dom.states());
  const alphabetList = parseCSV(dom.alphabet());
  const start      = dom.startState().trim();
  const finals     = parseCSV(dom.finalStates());

  if (stateList.length === 0)     throw new Error('Enter at least one state.');
  if (alphabetList.length === 0)  throw new Error('Enter at least one alphabet symbol.');
  if (!start)                     throw new Error('Enter a start state.');
  if (!stateList.includes(start)) throw new Error(`Start state "${start}" is not in the state list.`);
  for (const f of finals) {
    if (!stateList.includes(f)) throw new Error(`Final state "${f}" is not in the state list.`);
  }

  // Read transitions from the input table
  const transitions = {};
  const rows = document.querySelectorAll('.t-row');
  rows.forEach(row => {
    const cells = row.querySelectorAll('input');
    const state = row.dataset.state;
    const cols   = ['ε', ...alphabetList]; // first column is epsilon

    cols.forEach((sym, i) => {
      const val = cells[i] ? cells[i].value.trim() : '';
      if (val) {
        const targets = parseCSV(val);
        for (const t of targets) {
          if (!stateList.includes(t)) {
            throw new Error(`Transition target "${t}" for (${state}, ${sym}) is not a valid state.`);
          }
        }
        transitions[`${state},${sym}`] = targets;
      }
    });
  });

  return { states: stateList, alphabet: alphabetList, startState: start, finalStates: finals, transitions };
}

// ══════════════════════════════════════════════════════════
// BUILD TRANSITION INPUT TABLE
// ══════════════════════════════════════════════════════════

function buildTransitionTable() {
  clearError();
  const stateList    = parseCSV(dom.states());
  const alphabetList = parseCSV(dom.alphabet());

  if (stateList.length === 0 || alphabetList.length === 0) {
    showError('Enter states and alphabet first.');
    return;
  }

  // Header row: State | ε | a | b | ...
  dom.tHeader.innerHTML = '';
  const headerCols = ['State', 'ε (epsilon)', ...alphabetList];
  headerCols.forEach(col => {
    const cell = document.createElement('div');
    cell.className = 't-cell header-cell';
    cell.textContent = col;
    dom.tHeader.appendChild(cell);
  });

  // Data rows
  dom.tRows.innerHTML = '';
  stateList.forEach(state => {
    const row = document.createElement('div');
    row.className = 't-row';
    row.dataset.state = state;

    // State label
    const labelCell = document.createElement('div');
    labelCell.className = 't-cell';
    labelCell.textContent = state;
    row.appendChild(labelCell);

    // Input cells: ε + each symbol
    ['ε', ...alphabetList].forEach(() => {
      const cell = document.createElement('div');
      cell.className = 't-cell';
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = '—';
      cell.appendChild(input);
      row.appendChild(cell);
    });

    dom.tRows.appendChild(row);
  });
}

// ══════════════════════════════════════════════════════════
// RENDER STEP-BY-STEP DISPLAY
// ══════════════════════════════════════════════════════════

function renderSteps() {
  dom.stepDisplay.innerHTML = '';
  steps.forEach((step, i) => {
    const card = document.createElement('div');
    card.className = 'step-card';
    card.id = `step-card-${i}`;
    if (i < currentStep) card.classList.add('done');
    if (i === currentStep) card.classList.add('active');

    const typeColors = {
      'init':       'tag-green',
      'process':    'tag-blue',
      'transition': 'tag-yellow',
      'new-state':  'tag-purple',
      'done':       'tag-green',
    };
    const badge = `<span class="tag ${typeColors[step.type] || 'tag-blue'}">${step.type}</span>`;

    card.innerHTML = `
      <div class="step-num">#${i + 1}</div>
      <div class="step-title">${badge} ${escapeHtml(step.title)}</div>
      <div class="step-detail">${escapeHtml(step.detail)}</div>
    `;
    dom.stepDisplay.appendChild(card);
  });

  updateStepCounter();
  scrollActiveStep();
  highlightDFATableRow();
  highlightDFAGraph();
}

function scrollActiveStep() {
  const active = document.getElementById(`step-card-${currentStep}`);
  if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function updateStepCounter() {
  dom.stepCounter.textContent = steps.length > 0
    ? `${currentStep + 1} / ${steps.length}`
    : '';
}

// ══════════════════════════════════════════════════════════
// STEP CONTROLS
// ══════════════════════════════════════════════════════════

function enableControls() {
  dom.prevBtn.disabled     = false;
  dom.nextBtn.disabled     = false;
  dom.autoPlayBtn.disabled = false;
}

function gotoStep(i) {
  currentStep = Math.max(-1, Math.min(steps.length - 1, i));
  renderSteps();
  dom.prevBtn.disabled = currentStep <= 0;
  dom.nextBtn.disabled = currentStep >= steps.length - 1;
}

$('prevBtn').addEventListener('click', () => gotoStep(currentStep - 1));
$('nextBtn').addEventListener('click', () => gotoStep(currentStep + 1));

$('autoPlayBtn').addEventListener('click', () => {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer);
    autoPlayTimer = null;
    dom.autoPlayBtn.textContent = '▶ Auto Play';
    dom.autoPlayBtn.classList.remove('active');
  } else {
    dom.autoPlayBtn.textContent = '⏸ Pause';
    dom.autoPlayBtn.classList.add('active');
    autoPlayTimer = setInterval(() => {
      if (currentStep < steps.length - 1) {
        gotoStep(currentStep + 1);
      } else {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
        dom.autoPlayBtn.textContent = '▶ Auto Play';
        dom.autoPlayBtn.classList.remove('active');
      }
    }, 900);
  }
});

$('resetBtn').addEventListener('click', resetAll);

function resetAll() {
  if (autoPlayTimer) { clearInterval(autoPlayTimer); autoPlayTimer = null; }
  nfa = null;
  dfaResult = null;
  steps = [];
  currentStep = -1;
  dom.stepDisplay.innerHTML = '<div class="step-placeholder">Run conversion to see step-by-step trace.</div>';
  dom.stepCounter.textContent = '';
  dom.dfaTableWrapper.innerHTML = '<div class="table-placeholder">DFA table appears here after conversion.</div>';
  dom.prevBtn.disabled = dom.nextBtn.disabled = dom.autoPlayBtn.disabled = true;
  dom.autoPlayBtn.textContent = '▶ Auto Play';
  dom.autoPlayBtn.classList.remove('active');
  clearError();
  if (cyNFA) { cyNFA.destroy(); cyNFA = null; }
  if (cyDFA) { cyDFA.destroy(); cyDFA = null; }
  $('nfaGraph').innerHTML = '';
  $('dfaGraph').innerHTML = '';
}

// ══════════════════════════════════════════════════════════
// GRAPH RENDERING (Cytoscape.js)
// ══════════════════════════════════════════════════════════

function cyStyle(isDark) {
  return [
    {
      selector: 'node',
      style: {
        'background-color': isDark ? '#1a1e2a' : '#e6e9f2',
        'border-color':     '#2e3547',
        'border-width':     2,
        'label':            'data(label)',
        'color':            isDark ? '#e2e8f4' : '#1a1f2e',
        'font-size':        11,
        'font-family':      'JetBrains Mono, monospace',
        'text-valign':      'center',
        'text-halign':      'center',
        'width':            42,
        'height':           42,
      }
    },
    {
      selector: 'node.start-node',
      style: {
        'background-color': '#1a4a34',
        'border-color':     '#2ecc7a',
        'border-width':     3,
        'color':            '#2ecc7a',
      }
    },
    {
      selector: 'node.final-node',
      style: {
        'background-color': '#3d1a1a',
        'border-color':     '#e05555',
        'border-width':     3,
        'color':            '#e05555',
      }
    },
    {
      selector: 'node.start-final-node',
      style: {
        'background-color': '#1a3a24',
        'border-color':     '#2ecc7a',
        'border-width':     4,
        'color':            '#2ecc7a',
        'outline-color':    '#e05555',
        'outline-width':    2,
        'outline-offset':   3,
      }
    },
    {
      selector: 'node.dead-node',
      style: {
        'background-color': isDark ? '#111318' : '#e0e0e0',
        'border-color':     '#4a5570',
        'border-style':     'dashed',
        'color':            '#4a5570',
        'font-style':       'italic',
      }
    },
    {
      selector: 'node.active-node',
      style: {
        'background-color': '#3d3210',
        'border-color':     '#f5c842',
        'border-width':     3,
        'color':            '#f5c842',
      }
    },
    {
      selector: 'edge',
      style: {
        'width':                2,
        'line-color':           '#2e3547',
        'target-arrow-color':   '#4a5570',
        'target-arrow-shape':   'triangle',
        'curve-style':          'bezier',
        'label':                'data(label)',
        'font-size':            10,
        'font-family':          'JetBrains Mono, monospace',
        'color':                isDark ? '#8892aa' : '#4a5570',
        'text-background-color': isDark ? '#0d0f14' : '#f0f2f7',
        'text-background-opacity': 0.85,
        'text-background-padding': 2,
      }
    },
    {
      selector: 'edge.active-edge',
      style: {
        'line-color':         '#f5c842',
        'target-arrow-color': '#f5c842',
        'color':              '#f5c842',
        'width':              3,
      }
    }
  ];
}

function buildNFAGraph(nfaObj) {
  const isDark = !document.body.classList.contains('light');
  if (cyNFA) cyNFA.destroy();

  const elements = [];

  // Nodes
  for (const s of nfaObj.states) {
    const isStart = s === nfaObj.startState;
    const isFinal = nfaObj.finalStates.includes(s);
    let cls = '';
    if (isStart && isFinal) cls = 'start-final-node';
    else if (isStart) cls = 'start-node';
    else if (isFinal) cls = 'final-node';
    elements.push({ data: { id: s, label: s }, classes: cls });
  }

  // Edges (group by from+to to merge labels)
  const edgeMap = {};
  for (const [key, targets] of Object.entries(nfaObj.transitions)) {
    const [from, sym] = key.split(',');
    for (const to of targets) {
      const eKey = `${from}__${to}`;
      if (!edgeMap[eKey]) edgeMap[eKey] = { from, to, labels: [] };
      edgeMap[eKey].labels.push(sym === 'ε' ? 'ε' : sym);
    }
  }

  Object.values(edgeMap).forEach(({ from, to, labels }, i) => {
    elements.push({
      data: {
        id:     `e-nfa-${i}`,
        source: from,
        target: to,
        label:  labels.join(', '),
      }
    });
  });

  cyNFA = cytoscape({
    container: $('nfaGraph'),
    elements,
    style: cyStyle(isDark),
    layout: { name: 'dagre', rankDir: 'LR', nodeSep: 50, edgeSep: 20, rankSep: 80 },
    userZoomingEnabled:    true,
    userPanningEnabled:    true,
    boxSelectionEnabled:   false,
    autoungrabify:         true,
  });
}

function buildDFAGraph(dfaStatesMap, startKey, nfaFinalStates) {
  const isDark = !document.body.classList.contains('light');
  if (cyDFA) cyDFA.destroy();

  const elements = [];
  const dfaLabels = {};  // key → short label

  let labelIdx = 0;
  dfaStatesMap.forEach((_, key) => {
    dfaLabels[key] = key === '∅' ? '∅' : `D${labelIdx++}`;
  });

  // Nodes
  dfaStatesMap.forEach((dfaState, key) => {
    const isStart = key === startKey;
    const isFinal = dfaState.isFinal;
    const isDead  = key === '∅';
    let cls = '';
    if (isDead) cls = 'dead-node';
    else if (isStart && isFinal) cls = 'start-final-node';
    else if (isStart) cls = 'start-node';
    else if (isFinal) cls = 'final-node';
    const tooltip = `{${dfaState.states.join(', ')}}`;
    elements.push({ data: { id: key, label: dfaLabels[key], tooltip }, classes: cls });
  });

  // Add dead state node if referenced
  let deadNeeded = false;
  dfaStatesMap.forEach(dfaState => {
    Object.values(dfaState.transitions).forEach(to => { if (to === '∅') deadNeeded = true; });
  });
  if (deadNeeded && !dfaStatesMap.has('∅')) {
    elements.push({ data: { id: '∅', label: '∅' }, classes: 'dead-node' });
  }

  // Edges
  const edgeMap = {};
  dfaStatesMap.forEach((dfaState, from) => {
    Object.entries(dfaState.transitions).forEach(([sym, to]) => {
      const eKey = `${from}__${to}`;
      if (!edgeMap[eKey]) edgeMap[eKey] = { from, to, labels: [] };
      edgeMap[eKey].labels.push(sym);
    });
  });

  Object.values(edgeMap).forEach(({ from, to, labels }, i) => {
    elements.push({
      data: {
        id:     `e-dfa-${i}`,
        source: from,
        target: to,
        label:  labels.join(', '),
      }
    });
  });

  cyDFA = cytoscape({
    container: $('dfaGraph'),
    elements,
    style: cyStyle(isDark),
    layout: { name: 'dagre', rankDir: 'LR', nodeSep: 50, edgeSep: 20, rankSep: 90 },
    userZoomingEnabled:  true,
    userPanningEnabled:  true,
    boxSelectionEnabled: false,
    autoungrabify:       true,
  });

  // Tooltip on hover
  cyDFA.on('mouseover', 'node', e => {
    const nd = e.target;
    nd.style('label', nd.data('tooltip') || nd.data('label'));
  });
  cyDFA.on('mouseout', 'node', e => {
    const nd = e.target;
    nd.style('label', nd.data('label'));
  });
}

// ══════════════════════════════════════════════════════════
// HIGHLIGHT ACTIVE DFA STATE IN GRAPH
// ══════════════════════════════════════════════════════════

function highlightDFAGraph() {
  if (!cyDFA || currentStep < 0) return;
  const step = steps[currentStep];

  // Reset all
  cyDFA.nodes().removeClass('active-node');
  cyDFA.edges().removeClass('active-edge');

  if (!step || !step.highlight) return;

  if (step.type === 'transition' && step.from && step.to) {
    // Highlight edge
    cyDFA.edges().filter(e => e.data('source') === step.from && e.data('target') === step.to)
         .addClass('active-edge');
  }

  if (step.highlight) {
    cyDFA.nodes(`#${CSS.escape(step.highlight)}`).addClass('active-node');
  }
}

// ══════════════════════════════════════════════════════════
// DFA TRANSITION TABLE
// ══════════════════════════════════════════════════════════

function buildDFATable(dfaStatesMap, startKey, alphabet) {
  // Assign short labels
  const dfaLabels = {};
  let idx = 0;
  dfaStatesMap.forEach((_, key) => {
    dfaLabels[key] = `D${idx++}`;
  });

  const table = document.createElement('table');

  // Header
  const thead = document.createElement('thead');
  const hrow  = document.createElement('tr');
  ['', 'DFA State', 'NFA States', ...alphabet].forEach(col => {
    const th = document.createElement('th');
    th.textContent = col;
    hrow.appendChild(th);
  });
  thead.appendChild(hrow);
  table.appendChild(thead);

  // Body
  const tbody = document.createElement('tbody');
  dfaStatesMap.forEach((dfaState, key) => {
    const tr = document.createElement('tr');
    tr.dataset.key = key;

    // Marker column (→ for start, * for final)
    const markerTd = document.createElement('td');
    let marker = '';
    if (key === startKey) marker += '→';
    if (dfaState.isFinal) marker += '★';
    markerTd.textContent = marker;
    markerTd.className = 'state-cell';
    if (key === startKey) markerTd.style.color = 'var(--green)';
    if (dfaState.isFinal) markerTd.style.color = 'var(--red)';
    tr.appendChild(markerTd);

    // DFA label
    const labelTd = document.createElement('td');
    const badge = document.createElement('span');
    let badgeCls = 'state-badge is-normal';
    if (key === startKey && dfaState.isFinal) badgeCls = 'state-badge is-both';
    else if (key === startKey) badgeCls = 'state-badge is-start';
    else if (dfaState.isFinal) badgeCls = 'state-badge is-final';
    badge.className = badgeCls;
    badge.textContent = dfaLabels[key];
    labelTd.className = 'state-cell';
    labelTd.appendChild(badge);
    tr.appendChild(labelTd);

    // NFA states
    const nfaTd = document.createElement('td');
    nfaTd.textContent = `{${dfaState.states.join(', ')}}`;
    nfaTd.style.color = 'var(--text2)';
    nfaTd.style.fontSize = '0.72rem';
    tr.appendChild(nfaTd);

    // Transitions for each symbol
    alphabet.forEach(sym => {
      const td = document.createElement('td');
      const target = dfaState.transitions[sym];
      if (!target || target === '∅') {
        td.textContent = '∅';
        td.style.color = 'var(--text3)';
        td.style.fontStyle = 'italic';
      } else {
        const b = document.createElement('span');
        b.className = 'state-badge is-normal';
        b.textContent = dfaLabels[target] || target;
        td.appendChild(b);
      }
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  dom.dfaTableWrapper.innerHTML = '';
  dom.dfaTableWrapper.appendChild(table);
}

// ══════════════════════════════════════════════════════════
// HIGHLIGHT DFA TABLE ROW ON STEP
// ══════════════════════════════════════════════════════════

function highlightDFATableRow() {
  document.querySelectorAll('#dfaTableWrapper tr.active-row')
    .forEach(r => r.classList.remove('active-row'));

  if (currentStep < 0 || !steps[currentStep]) return;
  const key = steps[currentStep].highlight;
  if (!key) return;
  const tr = document.querySelector(`#dfaTableWrapper tr[data-key="${CSS.escape(key)}"]`);
  if (tr) {
    tr.classList.add('active-row');
    tr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// ══════════════════════════════════════════════════════════
// MAIN CONVERT ACTION
// ══════════════════════════════════════════════════════════

$('convertBtn').addEventListener('click', () => {
  clearError();
  resetAll();

  try {
    nfa = parseNFA();
  } catch (e) {
    showError(e.message);
    return;
  }

  // Build NFA graph
  buildNFAGraph(nfa);

  // Run subset construction
  const result = subsetConstruction(nfa);
  dfaResult = result;
  steps = result.stepsLog;

  // Build DFA graph
  buildDFAGraph(result.dfaStates, result.startKey, nfa.finalStates);

  // Build DFA table
  buildDFATable(result.dfaStates, result.startKey, nfa.alphabet);

  // Enable controls and start at step 0
  enableControls();
  gotoStep(0);
});

// ══════════════════════════════════════════════════════════
// BUILD TABLE BUTTON
// ══════════════════════════════════════════════════════════

$('buildTableBtn').addEventListener('click', buildTransitionTable);

// ══════════════════════════════════════════════════════════
// SAMPLE NFA LOADER
// ══════════════════════════════════════════════════════════

$('sampleBtn').addEventListener('click', () => {
  resetAll();

  // Sample: NFA that accepts strings ending in "ab" over {a, b}
  $('states').value   = 'q0, q1, q2';
  $('alphabet').value = 'a, b';
  $('startState').value  = 'q0';
  $('finalStates').value = 'q2';

  buildTransitionTable();

  // Fill in transitions:
  // q0: ε→{}, a→{q0,q1}, b→{q0}
  // q1: ε→{}, a→{},      b→{q2}
  // q2: (accepting)
  const rowData = {
    'q0': { 'ε': '',    'a': 'q0,q1', 'b': 'q0' },
    'q1': { 'ε': '',    'a': '',      'b': 'q2' },
    'q2': { 'ε': '',    'a': '',      'b': '' },
  };

  document.querySelectorAll('.t-row').forEach(row => {
    const state = row.dataset.state;
    const inputs = row.querySelectorAll('input');
    const cols   = ['ε', 'a', 'b'];
    if (rowData[state]) {
      cols.forEach((sym, i) => {
        if (inputs[i]) inputs[i].value = rowData[state][sym] || '';
      });
    }
  });
});

// ══════════════════════════════════════════════════════════
// EXPORT DFA AS JSON
// ══════════════════════════════════════════════════════════

$('exportBtn').addEventListener('click', () => {
  if (!dfaResult) {
    showError('Run conversion first to export the DFA.');
    return;
  }

  const exportData = {
    nfa: {
      states:     nfa.states,
      alphabet:   nfa.alphabet,
      startState: nfa.startState,
      finalStates: nfa.finalStates,
      transitions: nfa.transitions,
    },
    dfa: {
      startState: dfaResult.startKey,
      states: {},
    }
  };

  let idx = 0;
  dfaResult.dfaStates.forEach((dfaState, key) => {
    exportData.dfa.states[`D${idx++}`] = {
      nfaSubset:   dfaState.states,
      isFinal:     dfaState.isFinal,
      isStart:     key === dfaResult.startKey,
      transitions: dfaState.transitions,
    };
  });

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'dfa-export.json';
  a.click();
  URL.revokeObjectURL(url);
});

// ══════════════════════════════════════════════════════════
// DARK MODE TOGGLE
// ══════════════════════════════════════════════════════════

$('darkModeToggle').addEventListener('click', () => {
  document.body.classList.toggle('light');
  $('darkModeToggle').textContent = document.body.classList.contains('light') ? '☾' : '☀';

  // Rebuild graphs with new theme if present
  if (nfa && cyNFA) buildNFAGraph(nfa);
  if (nfa && dfaResult && cyDFA) buildDFAGraph(dfaResult.dfaStates, dfaResult.startKey, nfa.finalStates);
});

// ══════════════════════════════════════════════════════════
// AUTO-BUILD TABLE ON FIELD CHANGE (debounced)
// ══════════════════════════════════════════════════════════

let rebuildTimer = null;
['states', 'alphabet'].forEach(id => {
  $(id).addEventListener('input', () => {
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(() => {
      if (dom.states() && dom.alphabet()) buildTransitionTable();
    }, 600);
  });
});

// ══════════════════════════════════════════════════════════
// INIT: Pre-fill hint
// ══════════════════════════════════════════════════════════
(function init() {
  // Greet with a note in the step panel
  dom.stepDisplay.innerHTML = '<div class="step-placeholder">Enter an NFA or load the sample, then click "Convert to DFA →".</div>';
})();