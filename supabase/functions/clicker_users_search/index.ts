// 유저 검색 (친구 찾기용)
//   body: { q? }  — 비어있으면 전체, 있으면 slug/nickname prefix 검색
//   header: Authorization: Bearer <user JWT>  (자신 + 이미 친구 제외)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { q } = await req.json().catch(() => ({}));

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
    const { data: userData } = await admin.auth.getUser(token);
    const me = userData?.user;
    if (!me) return json({ error: "login required" }, 401);

    // 이미 친구 관계인 유저 ID 목록
    const { data: fships } = await admin
      .from("clicker_friendships")
      .select("requester_id, addressee_id")
      .or(`requester_id.eq.${me.id},addressee_id.eq.${me.id}`)
      .eq("status", "accepted");

    const friendIds = new Set((fships ?? []).map((f) =>
      f.requester_id === me.id ? f.addressee_id : f.requester_id
    ));

    // 유저 검색
    let query = admin
      .from("clicker_profiles")
      .select("id, nickname, slug")
      .neq("id", me.id)
      .limit(40);

    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      query = query.or(`slug.ilike.${term}%,nickname.ilike.${term}%`);
    }

    const { data: users, error } = await query;
    if (error) return json({ error: error.message }, 500);

    const result = (users ?? []).map((u) => ({
      ...u,
      isFriend: friendIds.has(u.id),
    }));

    return json({ users: result });
  } catch (e) {
    console.error("[users_search] uncaught:", e);
    return json({ error: String(e) }, 500);
  }
});
