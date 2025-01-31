function trackEvent(action, data) {
  if (typeof gtag === 'function') {
    gtag('event', action, data);
  }
}
/**
 * Shuffles the contents of an array.
 * @param {Array} array
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let temp = array[j];
    array[j] = array[i];
    array[i] = temp;
  }
}

/**
 * Stores the state of the board so that it can
 * survive a browser refresh. Because this can happen
 * on iOS when you switch apps and come back to Safari.
 */
function saveBoard() {
  const cells = document.querySelectorAll('.board > div');
  const serialized = Array.from(cells).map((el) => {
    return {
      t: el.innerText,
      m: el.classList.contains('marked')
    }
  });
  localStorage.setItem('saved', JSON.stringify(serialized));
  localStorage.setItem('savedAt', Date.now());
}

/**
 * Make the BINGO heading road by splitting the h1 text.
 * This lets the markup be more semantic.
 */
function buildHeading() {
  const el = document.querySelector('.card h1');
  const text = el.innerText;
  el.innerText = '';
  Array.from(text).forEach((ch) => {
    const span = document.createElement('span');
    span.innerText = ch;
    el.appendChild(span);
  });
}

/**
 * Handle clicking on a cell by toggling the dauber mark.
 * @param {Object} event The click event.
 */
function clickCell(event) {
  const  marked = this.classList.toggle('marked');
  if (marked) {
    trackEvent('mark', {
      event_category: 'user',
      value: event.target.innerText
    });
  }
  const rect = event.target.getBoundingClientRect();
  const offset = (event.clientX - rect.left) / rect.width;
  this.style.backgroundPositionX = (offset * 100)+'%';
}

/**
 * Create an empty bingo card.
 * @param {DomElement} board The container for bingo card.
 */
function buildEmptyBoard(board) {
  for (let i = 0; i < 25; i++) {
    const cell = document.createElement('div');
    const div = document.createElement('div');
    cell.appendChild(div);
    cell.addEventListener('click', clickCell);
    board.appendChild(cell);
  }
}

/**
 * Fill the bingo card with content.
 * @param {Array} content An array of objects with
 *    `t`: Text in the cell
 *    `m`: The state of the dauber mark.
 */
function fillCells(content) {
  const cells = document.querySelectorAll('.board > div');
  cells.forEach((cell, index) => {
    const div = cell.querySelector('div');
    div.innerText = content[index].t;
    cell.classList.toggle('marked', content[index].m);
  })
}

/**
 * Loads content from the specified file to fill the board.
 * @param {String} cluefile URL of the JSON clue file.
 */
function loadBoard(cluefile) {
  req=new XMLHttpRequest();
  req.open("GET", cluefile ,true);
  req.overrideMimeType("application/json");
  req.send();
  req.onload = function onLoad() {
    const clues = JSON.parse(req.responseText);
    shuffle(clues);
    clues[12] = 'FREE';
    trackEvent('load', { value: cluefile });
    fillCells(clues.map((text) => {
      return {
        t: text,
        m: false
      };
    }));
  };
}

/**
 * Pull text into the cells, either from Saved data or from
 * a clue file.
 * @param {String} cluefile URL JSON file to get new clues.
 */
function populateBoard(cluefile) {
  let age = 0;
  const saved = localStorage.getItem('saved');
  if (saved) {
    const savedAt = Number(localStorage.getItem('savedAt'));
    age = Math.floor((Date.now() - savedAt) / 1000);
  }
  if (!saved || (age > 7200)) {
    loadBoard(cluefile);
  } else {
    trackEvent('restore', { value: age });
    fillCells(JSON.parse(saved));
  }
}

/**
 * Handles the Document Ready event.
 */
function ready() {
  const searchParams = new URLSearchParams(window.location.search);
  let cluefile = 'film-tropes.json'
  if (searchParams.has('clues')) {
    cluefile = searchParams.get('clues');
  }
  const board = document.querySelector('.board');
  buildEmptyBoard(board);
  populateBoard(cluefile);
  buildHeading();
  const resetButton = document.querySelector('.controls .reset');
  resetButton.addEventListener('click', (event)=> {
    trackEvent('reset', { event_category: 'user' });
    loadBoard(cluefile);
  })
  window.addEventListener('unload', (event) => {
    saveBoard();
  });
}

if (document.readyState != 'loading') {
  ready();
} else {
  document.addEventListener('DOMContentLoaded', ready);
}
