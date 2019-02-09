$(function () {

  const DEBUG = true;
  var currentLevel = 0;

  // ################################
  // 

  function showMainScene() {
    $('#scene-main').show();
    $('#pane-info, #info-inst').show();

    // Done!
    $('#scene-preload').hide();
    currentLevel = 1;
  }

  $('#pane-info button').click(function () {

    $('#pane-info').hide();
  });

  // ################################
  // READY!!

  function preload() {
    // TODO
    $('#pane-loading')
      .empty()
      .append($('<button>').text('เริ่มเล่น!').click(showMainScene));
  }

  // Handle screen resizing to 800 x 500
  // https://stackoverflow.com/q/8735457
  function resizeScreen() {
    var sW = Math.min(window.screen.width, $(window).width());
    var sH = Math.min(window.screen.height, $(window).height()) - 25;
    var ratio = Math.min(sW / 800, sH / 500);
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
