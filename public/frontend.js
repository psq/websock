$(function () {
  "use strict";

  var content = $('#content');
  var input = $('#input');
  var status = $('#status');

  var states = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
  var myColor = false;
  var myName = false;

  window.WebSocket = window.WebSocket || window.MozWebSocket;

  if (!window.WebSocket) {
    content.html($('<p>', { text: 'Sorry, but your browser doesn\'t support WebSockets.'} ));
    input.hide();
    $('span').hide();
    return;
  }

  var url = (document.location.host.indexOf("cfapps.io") !== -1) ? ("wss://" + document.location.hostname + ":4443") : ("ws://" + document.location.host);
  console.log("using url", url);
  var connection = new WebSocket(url);

  connection.onopen = function () {
    console.log("onopen");
    input.removeAttr('disabled');
    status.text('Choose name:');
  };

  connection.onerror = function (error) {
    console.log("onerror", states[connection.readyState]);
    content.html($('<p>', { text: 'Sorry, but there\'s some problem with your connection or the server is down.' } ));
  };

  connection.onmessage = function (message) {
    var json;
    try {
      json = JSON.parse(message.data);
    } catch (e) {
      console.log('This doesn\'t look like a valid JSON: ', message.data);
      return;
    }

    if (json.type === 'color') {
      myColor = json.data;
      status.text(myName + ': ').css('color', myColor);
      input.removeAttr('disabled').focus();
    } else if (json.type === 'history') {
      for (var i=0; i < json.data.length; i++) {
        addMessage(json.data[i].author, json.data[i].text, json.data[i].color, new Date(json.data[i].time));
      }
    } else if (json.type === 'message') {
      console.log("message", json.data.text);
      input.removeAttr('disabled');
      addMessage(json.data.author, json.data.text, json.data.color, new Date(json.data.time));
    } else {
      console.log('Hmm..., I\'ve never seen JSON like this: ', json);
    }
  };

  connection.onerror = function() {
    console.log("onerror", states[connection.readyState], connection.bufferedAmount);

  };

  connection.onclose = function() {
    console.log("onclose", states[connection.readyState], connection.bufferedAmount);
  };

  input.keydown(function(e) {
    if (e.keyCode === 13) {
      var msg = $(this).val();
      if (!msg) {
        return;
      }
      connection.send(msg);
      $(this).val('');
      input.attr('disabled', 'disabled');
      if (myName === false) {
        myName = msg;
      }
    }
  });

  setInterval(function() {
    console.log("connection.readyState", states[connection.readyState], connection.bufferedAmount, connection);
    if (connection.readyState !== 1) {
      status.text('Error');
      input.attr('disabled', 'disabled').val('Unable to communicate with the WebSocket server.');
    }
  }, 10000);

  function addMessage(author, message, color, dt) {
    content.prepend('<p><span style="color:' + color + '">' + author + '</span> @ ' +
       (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':' + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes()) + ': ' + message + '</p>');
  }
});
