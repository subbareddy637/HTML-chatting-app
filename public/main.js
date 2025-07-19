const socket = io();
const pc = new RTCPeerConnection({
  iceServers: [{urls: 'stun:stun.l.google.com:19302'}]
});
let dc;

const msgs = document.getElementById('messages');
const input = document.getElementById('messageInput');
const btn = document.getElementById('send');
btn.disabled = true;

function addMessage(sender, text) {
  const el = document.createElement('div');
  el.className = 'message ' + (sender === 'you' ? 'you' : 'they');
  el.textContent = (sender === 'you' ? 'You: ' : 'Them: ') + text;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
  // auto‑delete after 5 min (300000 ms)
  setTimeout(() => el.remove(), 300000);
}

btn.onclick = () => {
  const text = input.value.trim();
  if (!text || dc.readyState !== 'open') return;
  dc.send(text);
  addMessage('you', text);
  input.value = '';
};

pc.onicecandidate = e => {
  if (e.candidate) socket.emit('signal', { candidate: e.candidate });
};

pc.ondatachannel = e => {
  dc = e.channel;
  setupDC();
};

socket.on('signal', async msg => {
  if (msg.sdp) {
    await pc.setRemoteDescription(msg.sdp);
    if (msg.sdp.type === 'offer') {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('signal', { sdp: pc.localDescription });
    }
  } else if (msg.candidate) {
    await pc.addIceCandidate(msg.candidate);
  }
});

async function start() {
  dc = pc.createDataChannel('chat');
  setupDC();
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  socket.emit('signal', { sdp: pc.localDescription });
}
function setupDC() {
  dc.onopen = () => btn.disabled = false;
  dc.onmessage = e => addMessage('they', e.data);
}
start();
