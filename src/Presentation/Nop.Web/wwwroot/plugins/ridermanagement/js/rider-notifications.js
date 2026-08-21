/**
 * rider-notifications.js
 * Manages the SignalR connection for real-time rider order notifications.
 *
 * Features:
 *  - Connects to the RiderNotificationHub and registers the rider's group
 *  - Plays a sound + shows a visual card on new order
 *  - Prevents duplicate notifications via localStorage
 *  - Exponential-backoff auto-reconnect (works in background via Page Visibility API)
 *  - Requests browser Notification permission for PWA / background alerts
 */

(function () {
    'use strict';

    // ── Constants ────────────────────────────────────────────────────────────
    const MAX_RECONNECT_DELAY_MS = 30_000;
    const SEEN_MAX = 200; // max entries in dedup store

    // ── Deduplication helpers ────────────────────────────────────────────────
    function getSeenIds() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
        catch { return []; }
    }

    function markSeen(id) {
        const seen = getSeenIds();
        if (seen.includes(id)) return false;
        seen.unshift(id);
        if (seen.length > SEEN_MAX) seen.length = SEEN_MAX;
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seen)); } catch {}
        return true;
    }

    // ── Sound (Web Audio API – no external file needed) ──────────────────────
    function playBeep() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.4, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.6);
        } catch (e) {
            console.warn('RiderNotifications: could not play beep', e);
        }
    }

    // ── Visual notification card ─────────────────────────────────────────────
    function showCard(data) {
        const list = document.getElementById('notification-list');
        const empty = document.getElementById('empty-state');
        if (empty) empty.style.display = 'none';

        const time = new Date(data.sentAtUtc + 'Z').toLocaleTimeString();
        const card = document.createElement('div');
        card.className = 'notif-card new pulse';
        card.innerHTML = `
            <h3>🛒 New Order Available #${data.orderId}</h3>
            <p><strong>Total:</strong> ${data.orderTotal || 'N/A'}</p>
            <p><strong>Deliver to:</strong> ${data.shippingAddress || 'N/A'}</p>
            <time>${time}</time>`;
        list.insertBefore(card, list.firstChild);

        // Remove 'new' highlight after animation
        setTimeout(() => card.classList.remove('new', 'pulse'), 5000);
    }

    // ── Browser Push Notification (for background / PWA) ────────────────────
    function sendBrowserNotification(data) {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        try {
            new Notification('New Delivery Order', {
                body: `Order #${data.orderId} — ${data.shippingAddress || ''}`,
                icon: '/plugins/ridermanagement/icon-192.png',
                tag: data.notificationId,   // prevents duplicates in notification tray
                renotify: false
            });
        } catch {}
    }

    // ── Update status badge ──────────────────────────────────────────────────
    function setStatus(text, ok) {
        const badge = document.getElementById('status-badge');
        if (!badge) return;
        badge.textContent = text;
        badge.style.background = ok ? 'rgba(52,168,83,0.8)' : 'rgba(234,67,53,0.8)';
    }

    // ── SignalR connection with exponential backoff ───────────────────────────
    let reconnectDelay = 1000;

    const connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_PATH)
        .withAutomaticReconnect({
            nextRetryDelayInMilliseconds: (ctx) => {
                const delay = Math.min(reconnectDelay, MAX_RECONNECT_DELAY_MS);
                reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
                return delay;
            }
        })
        .configureLogging(signalR.LogLevel.Warning)
        .build();

    // Received new order — available to all riders
    connection.on('NewOrderAvailable', function (data) {
        if (!markSeen(data.notificationId)) {
            console.log('RiderNotifications: duplicate suppressed', data.notificationId);
            return;
        }
        playBeep();
        showCard(data);
        sendBrowserNotification(data);
        reconnectDelay = 1000; // reset backoff on successful message
    });

    connection.onreconnecting(() => setStatus('Reconnecting…', false));
    connection.onreconnected(() => {
        setStatus('Connected ✓', true);
        reconnectDelay = 1000;
        connection.invoke('RegisterRider', CUSTOMER_ID).catch(console.error);
    });
    connection.onclose(() => setStatus('Disconnected', false));

    async function startConnection() {
        try {
            await connection.start();
            await connection.invoke('RegisterRider', CUSTOMER_ID);
            setStatus('Connected ✓', true);
            reconnectDelay = 1000;
        } catch (err) {
            setStatus('Disconnected', false);
            console.warn('RiderNotifications: connection failed, retrying in', reconnectDelay, 'ms', err);
            setTimeout(startConnection, reconnectDelay);
            reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
        }
    }

    // ── Request notification permission on load ───────────────────────────────
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
    }

    // ── Page Visibility API: reconnect when tab becomes visible ──────────────
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden && connection.state === signalR.HubConnectionState.Disconnected) {
            startConnection();
        }
    });

    startConnection();
})();
