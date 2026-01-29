-- ============================================
-- BACKUP SQL - Nova Era MTDS
-- Exportado em: 2026-01-29
-- ============================================

-- IMPORTANTE: Execute na ordem correta para respeitar foreign keys

-- ============================================
-- 1. EXPENSE CATEGORIES (Categorias de Despesas)
-- ============================================
INSERT INTO public.expense_categories (id, name, color, created_at) VALUES
('a7a09027-a222-4dc6-8504-b421b79d0f28', 'Alimentação', '#EF4444', '2025-12-30T23:02:56.022149+00'),
('2aa9f5b9-ab3d-42ea-ade0-9858831aefb4', 'Transporte', '#3B82F6', '2025-12-30T23:02:56.022149+00'),
('d949ec55-0e36-4fa4-9f76-0dd5c9156073', 'Moradia', '#10B981', '2025-12-30T23:02:56.022149+00'),
('f8435dc7-1d5c-47f9-bc29-d6c9ae44fcda', 'Lazer', '#8B5CF6', '2025-12-30T23:02:56.022149+00'),
('d7d1c468-0ac8-4534-9534-5e5b1094c0e6', 'Saúde', '#F59E0B', '2025-12-30T23:02:56.022149+00'),
('f531b9aa-dfe3-43ce-ad0f-aae6dca95e06', 'Educação', '#EC4899', '2025-12-30T23:02:56.022149+00'),
('48662322-2b88-4907-aebc-dc961c017326', 'Outros', '#6B7280', '2025-12-30T23:02:56.022149+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. OPERATION METHODS (Métodos de Operação)
-- ============================================
INSERT INTO public.operation_methods (id, name, color, created_by, created_at) VALUES
('2a5cca68-3420-423b-a1ee-bfbe2f1e689d', 'CPA', '#3B82F6', NULL, '2025-12-30T23:02:56.022149+00'),
('9217fc41-3879-400f-8980-003d8a1c81fb', 'Delay', '#10B981', NULL, '2025-12-30T23:02:56.022149+00'),
('8fb6a613-a34c-4bdf-99d0-928ee9689d5f', 'Cooperação', '#8B5CF6', NULL, '2025-12-30T23:02:56.022149+00'),
('cc8659e2-d6f9-4725-b1b5-44a82172ae0c', 'Revshare', '#F59E0B', NULL, '2025-12-30T23:02:56.022149+00'),
('b6033e57-ddbe-4a07-a98f-4ce300ff5edf', 'Hybrid', '#EC4899', NULL, '2025-12-30T23:02:56.022149+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. METHOD CATEGORIES (Categorias VIP)
-- ============================================
INSERT INTO public.method_categories (id, name, color, created_by, created_at) VALUES
('e8797ccf-4324-4574-b311-a5385df86266', 'CPA', '#3B82F6', '6bb7a42f-dabf-43ff-bb30-cfa76eca6a31', '2026-01-29T04:56:40.959608+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. TUTORIALS
-- ============================================
INSERT INTO public.tutorials (id, title, description, category, video_url, thumbnail_url, duration_minutes, created_by, created_at, updated_at) VALUES
('a127d2f8-c5d6-4ebc-b401-e229113d72cc', 'CPA BASICO PARA INICIANTES!', 'CPA Básico para Iniciantes
Aprenda do zero como funciona o CPA de forma simples e prática.
Neste conteúdo você vai entender o passo a passo, o método correto, os cuidados essenciais e como evitar erros comuns de quem está começando.

Sem enrolação, sem termos complicados.
Conteúdo direto ao ponto para quem nunca fez CPA e quer começar do jeito certo. 🚀', 'CPA', 'https://udieurduvwvtwrzgxmmw.supabase.co/storage/v1/object/public/tutorials/videos/1769651145490.mp4', 'https://udieurduvwvtwrzgxmmw.supabase.co/storage/v1/object/public/tutorials/thumbnails/1769650610723.png', 8, '6bb7a42f-dabf-43ff-bb30-cfa76eca6a31', '2026-01-29T01:46:41.902753+00', '2026-01-29T01:53:55.095583+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. TUTORIAL LINKS
-- ============================================
INSERT INTO public.tutorial_links (id, tutorial_id, title, url, display_order, created_at) VALUES
('cf8cb208-e849-4ec8-9f86-a480c09d90e9', 'a127d2f8-c5d6-4ebc-b401-e229113d72cc', 'Site para comprar proxys:', 'https://novaeramtdsloja.lovable.app/', 0, '2026-01-29T01:53:55.531028+00'),
('34743680-7e60-4ba2-8409-b1db33e5f24f', 'a127d2f8-c5d6-4ebc-b401-e229113d72cc', 'Site para comprar números temporarios', 'https://smsrush.com.br/cadastro?ref=ROGER43398', 1, '2026-01-29T01:53:55.531028+00'),
('2494bf2c-ccb6-4e14-b709-54c83a9cd18d', 'a127d2f8-c5d6-4ebc-b401-e229113d72cc', 'Site para geração de email temporario', 'https://dropmail.me', 2, '2026-01-29T01:53:55.531028+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. GOALS (Metas)
-- ============================================
INSERT INTO public.goals (id, user_id, title, target_amount, current_amount, goal_type, start_date, deadline, created_at) VALUES
('8ea0b3e6-3696-4b2c-b8dd-942b29fa9f1d', 'fe104fcb-5138-4fcc-9413-5842b0390881', 'Meta Diaria de lucro', 1000.00, 0.00, 'daily', '2025-12-31', NULL, '2025-12-31T02:12:03.793769+00'),
('02f51bd4-a04d-4f3d-9d19-056054fa3218', 'b8762fda-6a5f-44fe-876b-1d44557979fd', 'CARRO', 150000.00, 0.00, 'monthly', '2026-01-04', '2026-12-31', '2026-01-04T00:30:55.012482+00'),
('c47c403b-9616-4f4e-a133-550417eca900', 'a5bd3b79-73d1-4d8c-b1d7-228ce49adf3a', 'Meta Com Cooperação', 500.00, 0.00, 'daily', '2026-01-16', NULL, '2026-01-16T11:58:21.178912+00'),
('0578847f-5920-49fb-a381-b86ebdc04a50', 'ae173a8d-9f43-4006-b28e-0fbacafde2dc', 'mensal janeiro', 10000.00, 0.00, 'monthly', '2026-01-20', NULL, '2026-01-20T23:28:32.748789+00'),
('cae44116-df6f-4dcd-a6d2-b1b0a0904e9a', '6bb7a42f-dabf-43ff-bb30-cfa76eca6a31', 'Méta diaria', 500.00, 0.00, 'daily', '2026-01-01', NULL, '2026-01-01T18:26:30.185992+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 7. DUTCHING HISTORY
-- ============================================
INSERT INTO public.dutching_history (id, user_id, total_invested, odds, stakes, guaranteed_return, profit, roi, observation, created_at) VALUES
('0ad3c415-5073-4957-af6a-fdc41bd178b2', '6bb7a42f-dabf-43ff-bb30-cfa76eca6a31', 83.33, ARRAY[3, 2], ARRAY[33.332, 49.998], 99.996, 16.666, 20.0, NULL, '2026-01-29T07:23:11.559382+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 
-- As tabelas abaixo contêm dados sensíveis e extensos (50+ usuários):
-- - profiles (requer usuários no auth.users primeiro)
-- - user_roles (requer profiles)
-- - user_memberships (requer profiles)
-- - operations (100+ registros)
-- - expenses (100+ registros)
--
-- Para exportar esses dados completos, execute no Cloud:
-- SELECT * FROM public.profiles;
-- SELECT * FROM public.user_roles;
-- SELECT * FROM public.user_memberships;
-- SELECT * FROM public.operations;
-- SELECT * FROM public.expenses;
--
-- ARQUIVOS DE MÍDIA:
-- Os vídeos e thumbnails estão nos buckets 'tutorials' e 'methods'.
-- Você precisará fazer download manual desses arquivos.
-- ============================================
