const socket = io();

const roomCodeEl = document.getElementById('roomCode');
const userCountEl = document.getElementById('userCount');
const messagesEl = document.getElementById('messages');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');

// Get room code from URL
const params = new URLSearchParams(window.location.search);
const roomCode = params.get('room');

if (!roomCode) {
  window.location.href = '/';
}

// Display room code
roomCodeEl.textContent = roomCode;

// Join room
socket.emit('join', roomCode);

// Handle user count updates
socket.on('userCount', (count) => {
  userCountEl.textContent = count;
});

// Handle incoming messages
socket.on('message', (msg) => {
  const isOwn = msg.id === socket.id.slice(-4);
  const time = new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const div = document.createElement('div');
  div.className = `message${isOwn ? ' own' : ''}`;

  const meta = document.createElement('div');
  meta.className = 'meta';

  const sender = document.createElement('span');
  sender.textContent = isOwn ? 'You' : msg.id;

  const timeSpan = document.createElement('span');
  timeSpan.textContent = time;

  meta.appendChild(sender);
  meta.appendChild(timeSpan);

  const text = document.createElement('div');
  text.className = 'text';
  text.textContent = msg.text;

  div.appendChild(meta);
  div.appendChild(text);

  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
});

// Handle system messages
socket.on('system', (text) => {
  const div = document.createElement('div');
  div.className = 'system-message';
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
});

// Send message
messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  socket.emit('message', text);
  messageInput.value = '';
});

// Focus input on load
messageInput.focus();
