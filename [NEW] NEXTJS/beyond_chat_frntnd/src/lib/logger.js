let clients = [];

export function addClient(res) {
  clients.push(res);
}

export function removeClient(res) {
  clients = clients.filter(c => c !== res);
}

export function sendLog(message, type = "info") {
  const payload = {
    message,
    type,
    time: new Date().toISOString()
  };

  const data = `data: ${JSON.stringify(payload)}\n\n`;

  clients.forEach(res => res.write(data));
}
