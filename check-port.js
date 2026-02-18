const net = require('net');
const port = process.argv[2] || 3000;
const client = new net.Socket();
client.connect(port, '127.0.0.1', () => {
  console.log('OPEN');
  client.destroy();
});
client.on('error', () => {
  console.log('CLOSED');
});
