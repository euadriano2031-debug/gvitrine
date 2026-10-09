# Backup total da loja

O painel administrativo possui a rota `/admin/backup` com exportação e importação de backups da loja.

Formato do arquivo exportado: `.gvit-backup.zip`, contendo:
- `manifest.json` com versão, data/hora e checksums;
- `backup.json` com a organização, produtos, categorias, configurações e leads;
- `media-references.json` com referências de imagens e vídeos;
- `README.txt` com a descrição do pacote.

A restauração é transacional e aceita somente backups cujo `organization_id` seja igual ao da loja atualmente administrada.

O histórico permite exclusão manual de um backup individual pelo botão **Excluir**, ao lado de **Restaurar**. A exclusão usa uma RPC protegida no Supabase, valida a organização administrada e remove definitivamente o registro e o `payload` JSON do backup da tabela `public.loja_backups`.

No banco, o ciclo automático roda uma checagem diária de baixo custo. O backup de dados é criado a cada 7 dias por organização. Ao completar 60 dias do ciclo, todos os backups daquele ciclo são removidos e um novo backup automático inicia o próximo ciclo.

Durante os últimos 10 dias do ciclo, o painel administrativo mostra um alerta de segurança diário, até o dia 0.

Vídeos hospedados no YouTube e imagens hospedadas em serviços externos são preservados por suas URLs/referências. O backup não redistribui conteúdo de terceiros.
