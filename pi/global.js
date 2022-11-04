function updateGlobalSettings() {
  var settings = {};
  settings.host = document.getElementById('host').value;
  settings.port = document.getElementById('port').value;

  const json = {
    'event': 'setGlobalSettings',
    'context': uuid,
    'payload': settings
  };
  websocket.send(JSON.stringify(json));
}

function processGlobalSettings(settings) {
  document.getElementById('host').placeholder = DEFAULT_HOST;
  document.getElementById('host').value = settings.host || "";

  document.getElementById('port').placeholder = DEFAULT_PORT;
  document.getElementById('port').value = settings.port || "";
}