// 최초 등록: 로그인한 유저가 device_code를 자기 계정에 클레임
//   body: { device_code, label? }
//   header: Authorization: Bearer <user JWT>  (필수)
//
// device_secret은 "이 응답에서 단 한 번" 반환됨 → ESP32 펌웨어(Poke용)에 주입할 것.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { device_code, label } = body;
    console.log("[device_register] device_code:", device_code);
    if (!device_code) return json({ error: "device_code required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
    console.log("[device_register] token present:", !!token);
    const { data: userData, error: authErr } = await admin.auth.getUser(token);
    if (authErr) console.warn("[device_register] getUser error:", authErr.message);
    const user = userData?.user;
    if (!user) { console.warn("[device_register] no user"); return json({ error: "login required" }, 401); }
    console.log("[device_register] user:", user.id);

    // 프로필/게임상태가 없으면 여기서 생성 (트리거 미적용 대비)
    const nickname = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "클리커";
    const { error: profErr } = await admin.from("clicker_profiles").upsert(
      { id: user.id, nickname },
      { onConflict: "id", ignoreDuplicates: true }
    );
    if (profErr) console.warn("[device_register] profile upsert:", profErr.message);

    const { error: gsErr } = await admin.from("clicker_game_states").upsert(
      { owner_id: user.id },
      { onConflict: "owner_id", ignoreDuplicates: true }
    );
    if (gsErr) console.warn("[device_register] game_state upsert:", gsErr.message);

    const { data: existing, error: selErr } = await admin
      .from("clicker_devices")
      .select("id, owner_id")
      .eq("device_code", device_code)
      .maybeSingle();
    if (selErr) { console.error("[device_register] select error:", selErr.message); return json({ error: selErr.message }, 500); }
    console.log("[device_register] existing:", existing);

    // 이미 다른 사람 소유면 거부
    if (existing?.owner_id && existing.owner_id !== user.id) {
      return json({ error: "이 기기는 이미 다른 계정에 등록되어 있습니다." }, 409);
    }

    let device;
    if (existing) {
      const { data, error } = await admin
        .from("clicker_devices")
        .update({ owner_id: user.id, label: label ?? null, registered: true })
        .eq("id", existing.id)
        .select("id, device_code, device_secret, label")
        .single();
      if (error) { console.error("[device_register] update error:", error.message); throw error; }
      device = data;
    } else {
      const { data, error } = await admin
        .from("clicker_devices")
        .insert({ device_code, owner_id: user.id, label: label ?? null, registered: true })
        .select("id, device_code, device_secret, label")
        .single();
      if (error) { console.error("[device_register] insert error:", error.message); throw error; }
      device = data;
    }

    console.log("[device_register] OK device:", device?.id);
    return json({ ok: true, device }); // device.device_secret 포함 (한 번만 노출 → 펌웨어에 주입)
  } catch (e) {
    console.error("[device_register] uncaught:", e);
    return json({ error: String(e) }, 500);
  }
});
