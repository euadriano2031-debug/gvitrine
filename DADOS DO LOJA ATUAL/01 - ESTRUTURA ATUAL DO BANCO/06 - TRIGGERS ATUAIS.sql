-- Triggers atuais do schema public capturados em 2026-11-12.
-- Exige que as funções chamadas já estejam criadas.

CREATE TRIGGER categorias_updated_at BEFORE UPDATE ON categorias FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER configuracoes_updated_at BEFORE UPDATE ON configuracoes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER crm_activities_mesma_loja BEFORE INSERT OR UPDATE OF lead_id, organization_id ON crm_activities FOR EACH ROW EXECUTE FUNCTION validar_atividade_crm_mesma_loja();

CREATE TRIGGER leads_crm_auto_preco BEFORE INSERT OR UPDATE OF produto_id, organization_id, crm_estimated_value ON leads FOR EACH ROW EXECUTE FUNCTION crm_preencher_valores_lead();

CREATE TRIGGER leads_normalizar_campos_crm BEFORE INSERT OR UPDATE OF crm_stage, crm_priority, crm_notes, crm_follow_up_at, crm_estimated_value, crm_final_value ON leads FOR EACH ROW EXECUTE FUNCTION normalizar_campos_crm_lead();

CREATE TRIGGER leads_produto_mesma_loja BEFORE INSERT OR UPDATE OF organization_id, produto_id ON leads FOR EACH ROW EXECUTE FUNCTION validar_produto_do_lead_mesma_loja();

CREATE TRIGGER organization_subscriptions_updated_at BEFORE UPDATE ON organization_subscriptions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER organizations_after_insert AFTER INSERT ON organizations FOR EACH ROW EXECUTE FUNCTION organizations_after_insert();

CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER produtos_categoria_mesma_loja BEFORE INSERT OR UPDATE OF organization_id, categoria_id ON produtos FOR EACH ROW EXECUTE FUNCTION validar_categoria_da_mesma_loja();

CREATE TRIGGER produtos_slug_trigger BEFORE INSERT OR UPDATE ON produtos FOR EACH ROW EXECUTE FUNCTION produtos_set_slug();

CREATE TRIGGER produtos_updated_at BEFORE UPDATE ON produtos FOR EACH ROW EXECUTE FUNCTION set_updated_at();