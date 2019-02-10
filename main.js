$(function () {
  "use strict";

  const DEBUG = true;
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
      lives: 8,
      bg: "M",
    },
    {
      name: 3,
      cards: [
        "B", "B", "I", "I", "L", "L", "P", "P", "R", "R",
        "C", "C", "W", "W", "X", "X", "X", "X", "X", "X", "X",
      ],
      layout: [7, 7, 7],
      lives: 12,
      bg: "Z",
    },
  ];
  const CARD_WIDTH = 60,
    CARD_HEIGHT = 80,
    TIMEOUT = 1000;
  let currentLevel = 0,
    pairsLeft = 0,
    oddsLeft = 0,
    livesLeft = 0,
    open1 = null,
    open2 = null,
    cardCloseTimeout = null;

  function toggleCard(card, flag) {
    let name = flag ? card.data('name') : LEVEL_DATA[currentLevel].bg;
    let offset = (65 - name.charCodeAt(0)) * CARD_WIDTH;
    card.css('background-position-x', '' + offset + 'px');
  }

  // ################################
  // 

  $('#pane-info button').click(function () {
    genCards();
    livesLeft = LEVEL_DATA[currentLevel].lives;
    updateHud();
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
    $('#pane-area').empty();
    let rowId = 0, rowLimit = 0, rowDiv;
    for (let k = 0; k < cards.length; k++) {
      if (k == rowLimit) {
        rowDiv = $('<div class=card-row>').appendTo('#pane-area');
        rowLimit += LEVEL_DATA[currentLevel].layout[rowId++];
      }
      let cardDiv = $('<div class=card>').appendTo(rowDiv)
        .data({index: k, name: cards[k]});
      toggleCard(cardDiv, false);
      if (cards[k] != 'X') {
        pairsLeft += 0.5;
      } else {
        oddsLeft += 1;
      }
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
    // Don't open removed card
    if (thisCard.hasClass('removed')) return;
    // Don't open the same card
    if (open1 !== null && open2 === null &&
        open1.data('index') == thisCard.data('index')) {
      return;
    }
    // Speed mode: interrupt the timeout
    if (open1 !== null && open2 !== null) {
      if (validatePair()) return;
    }
    toggleCard(thisCard, true);
    // If it's X, reduce life and maybe show the game over screen
    if (thisCard.data('name') == 'X') {
      livesLeft--;
      updateHud();
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
      } else {
        pairsLeft -= 1;
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
  // READY!!

  function preload() {
    // TODO
    $('#pane-loading')
      .empty()
      .append($('<button>').text('เริ่มเล่น!').click(function () {
        $('#scene-main').show();
        $('#pane-info, #info-inst').show();
        $('#scene-preload').hide();
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
