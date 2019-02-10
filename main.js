$(function () {
  "use strict";

  const DEBUG = true, DEBUG_FINAL = false;
  const LEVEL_DATA = [
    {
      name: 1,
      cards: ["H", "H", "O", "O", "F", "F", "X", "X"],
      layout: [4, 4],
      lives: 3,
      bg: "E",
    },
    {
      name: 2,
      cards: [
        "A", "A", "D", "D", "T", "T", "Y", "Y",
        "S", "S", "X", "X", "X", "X", "X",
      ],
      layout: [5, 5, 5],
      lives: 7,
      bg: "M",
    },
    {
      name: 3,
      cards: [
        "B", "B", "I", "I", "L", "L", "P", "P", "R", "R",
        "C", "C", "W", "W", "X", "X", "X", "X", "X", "X", "X",
      ],
      layout: [7, 7, 7],
      lives: 10,
      bg: "Z",
    },
  ];
  const BAG_ITEMS = ["A", "B", "D", "H", "I", "L", "O", "P", "R", "T", "Y"];
  const FINAL_ANSWER = [
    ["H", "A", "P", "P", "Y"],
    ["B", "I", "R", "T", "H", "D", "A", "Y"],
    ["T", "O", " ", "O", "I", "L"],
  ];
  const EXTRA_ANSWER = ["B", "L", "R", "D"];
  const CARD_WIDTH = 60,
    CARD_HEIGHT = 80,
    TIMEOUT = 1000,
    EXTRA_TIMEOUT = DEBUG_FINAL ? 1000 : 5000;
  let currentLevel = 0;
  if (DEBUG_FINAL) currentLevel = 3;

  // ################################
  // Part 1: Matching game

  let pairsLeft = 0,
    oddsLeft = 0,
    livesLeft = 0,
    open1 = null,
    open2 = null,
    cardCloseTimeout = null;

  function toggleCard(card, flag) {
    let name = card.data('name');
    if (flag === false) {
      name = LEVEL_DATA[currentLevel].bg;
    } else if (flag !== true) {
      name = flag;
    }
    let offset = (65 - name.charCodeAt(0)) * CARD_WIDTH;
    card.css('background-position-x', '' + offset + 'px');
  }

  $('#pane-info button').click(function () {
    if (currentLevel < LEVEL_DATA.length) {
      genCards();
      livesLeft = LEVEL_DATA[currentLevel].lives;
      updateHud();
    } else {
      genFinal();
    }
    $('#pane-info').hide();
  });

  function genCards() {
    let cards = LEVEL_DATA[currentLevel].cards;
    // Shuffle
    for (let i = cards.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      if (j != i) {
        let tmp = cards[i];
        cards[i] = cards[j];
        cards[j] = tmp;
      }
    }
    // Put on board
    pairsLeft = 0;
    oddsLeft = 0;
    $('#pane-area').empty();
    let rowId = 0, rowLimit = 0, rowDiv;
    for (let k = 0; k < cards.length; k++) {
      if (k == rowLimit) {
        rowDiv = $('<div class=card-row>').appendTo('#pane-area');
        rowLimit += LEVEL_DATA[currentLevel].layout[rowId++];
      }
      let cardDiv = $('<div class=card>').appendTo(rowDiv)
        .data({index: k, name: cards[k]});
      if (DEBUG) cardDiv.text(cards[k]);
      toggleCard(cardDiv, false);
      // Update the count
      if (cards[k] != 'X') {
        pairsLeft += 0.5;
      } else {
        oddsLeft += 1;
      }
      // Remove from bag
      incrBagItem(cards[k], -1);
    }
    open1 = open2 = cardCloseTimeout = null;
  };

  function updateHud() {
    $('#hud-pairs').text(pairsLeft);
    $('#hud-odds').text(oddsLeft);
    $('#hud-lives').text(livesLeft);
  }

  $('#pane-area').on("click", ".card", function (e) {
    if (livesLeft <= 0) return;
    let thisCard = $(this);
    // Speed mode: interrupt the timeout
    if (open1 !== null && open2 !== null) {
      if (validatePair()) return;
    }
    // Don't open removed card
    if (thisCard.hasClass('removed')) return;
    // Don't open the same card
    if (open1 !== null && open2 === null &&
        open1.data('index') == thisCard.data('index')) {
      return;
    }
    toggleCard(thisCard, true);
    // If it's X, reduce life and maybe show the game over screen
    if (thisCard.data('name') == 'X') {
      livesLeft--;
      updateHud();
      flashHud('#hud-lives');
      if (livesLeft === 0) {
        showLose();
        return;
      }
    }
    // If it's the 2nd card, check for match
    if (open1 === null) {
      open1 = thisCard;
    } else {
      open2 = thisCard;
      cardCloseTimeout = setTimeout(validatePair, TIMEOUT);
    }
  });

  function validatePair() {
    if (open1.data('name') == open2.data('name')) {
      open1.addClass('removed');
      open2.addClass('removed');
      if (open1.data('name') == 'X') {
        oddsLeft -= 2;
        flashHud('#hud-odds');
      } else {
        pairsLeft -= 1;
        flashHud('#hud-pairs');
        incrBagItem(open1.data('name'), +2);
      }
      updateHud();
      if (pairsLeft === 0) {
        showWin();
        return true;
      }
    }
    toggleCard(open1, false);
    toggleCard(open2, false);
    open1 = null;
    open2 = null;
    if (cardCloseTimeout !== null) {
      clearTimeout(cardCloseTimeout);
      cardCloseTimeout = null;
    }
  }

  function showWin() {
    $('.info').hide();
    $('#pane-info, #info-win').show();
    currentLevel++;
  }

  function showLose() {
    $('.card').each(function (i, card) {
      card = $(card);
      if (!card.hasClass('removed') && card.data('name') == 'X') {
        toggleCard(card, true);
      }
    });
    setTimeout(function () {
      $('.info').hide();
      $('#pane-info, #info-lose').show();
    }, TIMEOUT);
  }

  // ################################
  // Part 2: Inventory

  var bagGroups = {}, bagAmounts = {}, slotDivs = [], currentSlotMark = 0;

  function initBag() {
    BAG_ITEMS.forEach(function (name) {
      let bagGroup = $('<div class=bag-group>')
        .appendTo('#pane-bag').data('name', name)
      let card1 = $('<div class="card bag-card-1">')
        .data('name', name).appendTo(bagGroup);
      toggleCard(card1, true);
      let card2 = $('<div class="card bag-card-2">')
        .data('name', name).appendTo(bagGroup);
      toggleCard(card2, true);
      bagGroups[name] = bagGroup;
      bagAmounts[name] = 0;
      if (DEBUG_FINAL) incrBagItem(name, +2);
    });
  }

  function incrBagItem(name, incr) {
    if (bagGroups[name] === undefined) return; 
    bagAmounts[name] = Math.min(2, Math.max(0, bagAmounts[name] + incr));
    bagGroups[name].find('.bag-card-1').toggle(bagAmounts[name] >= 1);
    bagGroups[name].find('.bag-card-2').toggle(bagAmounts[name] >= 2);
  };

  function genFinal() {
    $('#pane-hud, #pane-area').empty();
    $('#pane-final').show();
    FINAL_ANSWER.forEach(function (row) {
      let rowDiv = $('<div class=card-row>').appendTo('#pane-final');
      row.forEach(function (name) {
        let slotDiv = $('<div class=card-slot>')
          .appendTo(rowDiv).data({name: name});
        if (name == ' ') {
          slotDiv.addClass('empty');
        } else {
          toggleCard(slotDiv, 'J');
          slotDivs.push(slotDiv);
        }
      });
    });
    toggleCard(slotDivs[0], 'K');
  }

  function genExtra() {
    $('#pane-extra').show();
    slotDivs = [];
    currentSlotMark = 0;
    let rowDiv = $('<div class=card-row>').appendTo('#pane-extra');
    rowDiv.append($('<span>ขอให้ไม่</span>'));
    EXTRA_ANSWER.forEach(function (name) {
      let slotDiv = $('<div class=card-slot>')
        .appendTo(rowDiv).data({name: name});
      toggleCard(slotDiv, 'J');
      slotDivs.push(slotDiv);
    });
    toggleCard(slotDivs[0], 'K');
  }

  $('#pane-bag').on('click', '.card', function () {
    if (currentLevel < LEVEL_DATA.length ||
        currentSlotMark >= slotDivs.length) return;
    let thisCard = $(this), name = thisCard.data('name');
    if (name == slotDivs[currentSlotMark].data('name')) {
      incrBagItem(name, -1);
      toggleCard(slotDivs[currentSlotMark], true);
      currentSlotMark++;
      if (currentSlotMark !== slotDivs.length) {
        toggleCard(slotDivs[currentSlotMark], 'K');
      } else {
        // TODO: Show some animation or something
        alert('DONE');
        if (currentLevel == LEVEL_DATA.length) {
          setTimeout(function () {
            currentLevel++;
            genExtra();
          }, EXTRA_TIMEOUT);
        }
      }
    }
  });

  // ################################
  // Special effects

  const FLASH_TIMEOUT = 400;
  const FLASH_COLOR = {
    '#hud-pairs': {'fg': '#0A0', 'bg': '#EFE'},
    '#hud-odds': {'fg': '#A52', 'bg': '#FED'},
    '#hud-lives': {'fg': 'red', 'bg': '#FAA'},
  }

  function flashHud(hudName) {
    let div = $(hudName);
    if (div.data('flash')) clearTimeout(+div.data('flash'));
    let style = {
      'color': FLASH_COLOR[hudName].fg,
      'background-color': FLASH_COLOR[hudName].bg,
      'box-shadow': '0 0 15px 15px ' + FLASH_COLOR[hudName].bg,
    };
    div.css(style);
    div.data('flash', setTimeout(function () {
      div.css({
        'color': '',
        'background-color': '',
        'box-shadow': '',
      });
    }, FLASH_TIMEOUT));
  };

  // ################################
  // READY!!

  function preload() {
    // TODO
    $('#pane-loading')
      .empty()
      .append($('<button>').text('เริ่มเล่น!').click(function () {
        $('#scene-main').show();
        $('#pane-info, #info-inst').show();
        $('#scene-preload').hide();
        initBag();
      }));
  }

  // Handle screen resizing to 800 x 500
  // https://stackoverflow.com/q/8735457
  function resizeScreen() {
    let sW = Math.min(window.screen.width, $(window).width());
    let sH = Math.min(window.screen.height, $(window).height()) - 25;
    let ratio = Math.min(sW / 800, sH / 500);
    $('#viewport').attr('content',
      'width='
      + (ratio >= 1 ? 'device-width' : (ratio * 800))
      + ', initial-scale='
      + (ratio >= 1 ? 1.0 : ratio)
      + ', user-scalable=no');
    window.scroll(0, 1);
  }

  resizeScreen();
  $(window).resize(resizeScreen);
  preload();

});
