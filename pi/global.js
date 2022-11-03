function updateGlobalSettings() {
  console.log('updateGlobalSettings');
  var settings = {};
  settings.host = document.getElementById('host').value;
  settings.port = document.getElementById('port').value;
  console.log(settings);

  const json = {
    'event': 'setGlobalSettings',
    'context': uuid,
    'payload': settings
  };
  websocket.send(JSON.stringify(json));
}

function processGlobalSettings(settings) {
  console.log('processGlobalSettings');
  console.log(settings);
  if (settings.host)
    document.getElementById('host').value = settings.host;
  if (settings.port)
    document.getElementById('port').value = settings.port;
}