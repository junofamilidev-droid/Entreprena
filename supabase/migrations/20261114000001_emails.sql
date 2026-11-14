-- Emails automatiques : on note chaque envoi pour ne jamais envoyer deux fois le même email.
alter table public.diagnostics_metier add column if not exists j0_sent_at timestamptz; -- « Votre plan d'action »
alter table public.notifications_metier add column if not exists annonce_envoyee_at timestamptz; -- annonce d'ouverture
alter table public.acces add column if not exists confirmation_envoyee_at timestamptz; -- confirmation de commande / accès offert
create index if not exists diagnostics_metier_relances on public.diagnostics_metier (created_at) where consentement_emails and desinscrit_at is null;
