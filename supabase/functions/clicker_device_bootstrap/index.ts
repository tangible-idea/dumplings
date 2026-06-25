// ESP32(WiFi/MQTT)가 부팅 시 1회 + 주기적으로 호출: 내 user_id / 표시 이름 / 친구 목록을 받는다.
//   body: { device_code }
//   header: x-device-secret: <device_secret>  (필수)
//
// 반환: { user_id, name, friends: [user_id, ...] }
//   - 기기는 clicker/feed/<friend_id> 들을 subscribe(친구 콕 찌름 수신)
//   - 버튼 누르면 clicker/feed/<user_id> 로 poke publish(친구들이 수신)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";
import { authDevice } from "../_shared/device.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const deviceSecret = req.headers.get("x-device-secret") ?? "";
    const { device_code } = await req.json();

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const device = await authDevice(admin, device_code, deviceSecret);
    if (!device) return json({ error: "unauthorized device" }, 401);

    const me = device.owner_id;

    const [{ data: profile }, { data: fships }] = await Promise.all([
      admin.from("clicker_profiles").select("nickname, slug").eq("id", me).single(),
      admin
        .from("clicker_friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${me},addressee_id.eq.${me}`),
    ]);

    const friends = (fships ?? []).map((f) =>
      f.requester_id === me ? f.addressee_id : f.requester_id
    );

    await admin
      .from("clicker_devices")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", device.id);

    return json({
      user_id: me,
      name: profile?.slug ?? profile?.nickname ?? "친구",
      friends,
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
