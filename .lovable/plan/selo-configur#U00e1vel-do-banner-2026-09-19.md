# Selo configurável do banner

## Resultado
No painel do banner, o selo atualmente exibido como “Lançamento” terá um seletor com duas opções: **Texto** ou **Imagem**.

## Implementação
- Ampliar a configuração do banner com o tipo do selo, texto, tamanho da fonte, cor do texto, cor de fundo e URL da imagem.
- Manter os valores atuais como padrão para configurações já salvas.
- Adicionar ao painel os controles de texto, tamanho e cores quando “Texto” estiver selecionado.
- Adicionar URL, envio de arquivo e prévia quando “Imagem” estiver selecionado.
- Atualizar a vitrine e a pré-visualização do painel imediatamente conforme a opção escolhida.
- Preservar alinhamento e comportamento responsivo do banner.

## Validação
- Conferir as duas opções no painel e na página inicial em celular e computador.
- Confirmar que salvar e recarregar mantém a escolha e os valores.
- Verificar que o projeto continua sem erros.

## Detalhes técnicos
A configuração continuará armazenada no registro JSON existente do banner, sem exigir nova tabela ou alteração estrutural do banco.
