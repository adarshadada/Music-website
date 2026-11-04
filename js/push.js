/* wave.radio · js/push.js · Firebase Cloud Messaging: alerts that reach the phone even when the app is closed.
   Needs FIREBASE_CONFIG and FCM_VAPID_KEY in js/config.js. Tokens are saved in Supabase (push_tokens). */
const PUSH = {on:!!(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.appId && FCM_VAPID_KEY), token:ls.get('wr_push', null), msg:null};
const pushLoad = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
async function pushInit(){
  if (PUSH.msg) return PUSH.msg;
  if (!('serviceWorker' in navigator) || !('Notification' in window)) throw new Error('This browser does not support push alerts.');
  const v = '10.12.2';
  await pushLoad(`https://www.gstatic.com/firebasejs/${v}/firebase-app-compat.js`);
  await pushLoad(`https://www.gstatic.com/firebasejs/${v}/firebase-messaging-compat.js`);
  if (!firebase.messaging.isSupported()) throw new Error('Push alerts are not available in this browser.');
  firebase.initializeApp(FIREBASE_CONFIG); PUSH.msg = firebase.messaging();
  return PUSH.msg;
}
async function pushEnable(silent){
  try {
    if (!PUSH.on) throw new Error('Push alerts are not set up yet.');
    if (!sb || !user || user.id === 'demo') throw new Error('Sign in first.');
    if (Notification.permission === 'default' && !silent){ if (await Notification.requestPermission() !== 'granted') throw new Error('Alerts were not allowed.'); }
    if (Notification.permission !== 'granted') return false;
    const m = await pushInit();
    const reg = await navigator.serviceWorker.register('firebase-messaging-sw.js?cfg=' + encodeURIComponent(JSON.stringify(FIREBASE_CONFIG)));
    await navigator.serviceWorker.ready;
    const token = await m.getToken({vapidKey:FCM_VAPID_KEY, serviceWorkerRegistration:reg});
    if (!token) throw new Error('Could not get a device token.');
    const r = await sb.rpc('register_push_token', {p_token:token, p_ua:navigator.userAgent});
    if (r.error) throw r.error;
    PUSH.token = token; ls.set('wr_push', token); if (!silent) toast('Push alerts are on for this device.');
    return true;
  } catch(e){ if (!silent) toast(e.message || 'Could not turn on push alerts.'); return false; }
}
async function pushForget(){
  const t = PUSH.token; PUSH.token = null; ls.set('wr_push', null);
  if (t && sb) try { await sb.from('push_tokens').delete().eq('token', t); } catch(e){}
}
