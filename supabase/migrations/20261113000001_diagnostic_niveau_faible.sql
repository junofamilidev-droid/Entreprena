-- Diagnostic : nouveau niveau « Exposition faible » (score sous 30). Le score va désormais de 10 à 100.
alter table public.diagnostics_metier drop constraint if exists diagnostics_metier_niveau_check;
alter table public.diagnostics_metier add constraint diagnostics_metier_niveau_check check (niveau in ('faible', 'moderee', 'marquee', 'forte'));
