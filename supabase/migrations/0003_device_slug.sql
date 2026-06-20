-- clicker_devices 에 slug 추가 (profile slug 와 동기화)
alter table public.clicker_devices
  add column if not exists slug text unique;

-- 기기 소유자가 자신의 기기 slug 갱신 가능
create policy "clicker_devices: owner update"
on public.clicker_devices for update to authenticated
using (owner_id = auth.uid()) with check (owner_id = auth.uid());
