// Qısa beep səsi (Web Audio API — fayl lazım deyil)
const playBeep = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);

    setTimeout(() => ctx.close(), 1000);
  } catch {
    // AudioContext dəstəklənmirsə keç
  }
};

// Browser push bildirişi
const pushNotification = (roomId: string) => {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    new Notification('Aevic Esports — Room Kodu Hazırdır! 🎮', {
      body: `Room ID: ${roomId} — Panelinizdə şifrəni görə bilərsiniz.`,
      icon: '/favicon.ico',
      tag: 'aevic-room-code',
    });
  }
};

export const notifyRoomCode = (roomId: string) => {
  playBeep();
  pushNotification(roomId);
};

// İlk yükləmədə notification icazəsi istə
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};
