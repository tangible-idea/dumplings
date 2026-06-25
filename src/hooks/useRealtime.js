import { useCallback, useEffect, useRef } from 'react';
import { getMqtt, feedTopic, userIdFromTopic } from '../lib/mqtt';

// MQTT(HiveMQ) 기반 실시간 신호.
//  - 내 피드(clicker/feed/<myId>)로 click/poke publish
//  - 친구 피드(clicker/feed/<friendId>) subscribe 해서 click/poke 수신
// ESP32 기기도 같은 토픽 규약을 공유한다(친구가 콕 찌르면 기기가 하트 표시).
export function useRealtime({ myId, myName, friends, onSignal }) {
  const clientRef = useRef(null);
  const lastClick = useRef(0);
  const lastPoke = useRef(0);
  const onSignalRef = useRef(onSignal);
  onSignalRef.current = onSignal;
  const friendMap = useRef(new Map());
  const myNameRef = useRef(myName);
  myNameRef.current = myName;

  useEffect(() => {
    friendMap.current = new Map((friends || []).map((f) => [String(f.id), f]));
  }, [friends]);

  useEffect(() => {
    if (!myId) return undefined;
    const client = getMqtt();
    clientRef.current = client;

    const handler = (topic, payload) => {
      const f = friendMap.current.get(userIdFromTopic(topic));
      if (!f) return;
      let msg = {};
      try { msg = JSON.parse(payload.toString()); } catch { return; }
      const type = msg.e === 'poke' ? 'poke' : msg.e === 'click' ? 'click' : null;
      if (type) onSignalRef.current(f, type);
    };
    client.on('message', handler);

    const topics = (friends || []).map((f) => feedTopic(f.id));
    if (topics.length) client.subscribe(topics, { qos: 0 });

    return () => {
      client.off('message', handler);
      if (topics.length) client.unsubscribe(topics);
    };
  }, [myId, friends]);

  const publish = useCallback((payload) => {
    const c = clientRef.current;
    if (!c || !myId) return;
    c.publish(feedTopic(myId), JSON.stringify(payload), { qos: 0 });
  }, [myId]);

  const broadcastClick = useCallback(() => {
    const now = Date.now();
    if (now - lastClick.current < 150) return;
    lastClick.current = now;
    publish({ e: 'click', t: now });
  }, [publish]);

  const broadcastPoke = useCallback(() => {
    const now = Date.now();
    if (now - lastPoke.current < 10000) return false; // 10초 쿨다운
    lastPoke.current = now;
    publish({ e: 'poke', t: now, n: myNameRef.current || '친구' });
    return true;
  }, [publish]);

  return { broadcastClick, broadcastPoke };
}
