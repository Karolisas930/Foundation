ALTER TABLE public.staff_gps_pings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_hours ENABLE ROW LEVEL SECURITY;

REVOKE EXECUTE ON FUNCTION public.accept_job_bid(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cancel_job_award(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.claim_pending_projects() FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.job_bid_details(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.job_chat_peer(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.my_active_jobs() FROM anon;
REVOKE EXECUTE ON FUNCTION public.my_job_bids() FROM anon;