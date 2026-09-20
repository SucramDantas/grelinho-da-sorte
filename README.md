# Grelinho da Sorte — versão online

## Antes de publicar

1. No Supabase SQL Editor execute `supabase/01-acesso.sql` uma vez. Não execute scripts de reset. Verifique que as cinco funções anteriores existem.
2. No GitHub, envie **o conteúdo desta pasta** para a raiz do repositório privado `grelinho-da-sorte` (incluindo `app`, `lib`, `public`, `supabase`, `package.json`). Não envie `.env.local` nem qualquer chave secreta.
3. Na Vercel, Add New > Project > Import Git Repository > `grelinho-da-sorte` > Framework Preset Next.js.
4. Em Environment Variables configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET` (aleatório, >=32 caracteres) e `ADMIN_PIN` (6969). Use a **chave service_role legada** do Supabase para compatibilidade com `auth.role() = 'service_role'` nas funções SQL anteriores. Nunca use chave pública nesse campo. Não publique nenhuma dessas variáveis no navegador nem com prefixo `NEXT_PUBLIC_`.
5. Clique Deploy e abra o endereço `.vercel.app` gerado. Faça testes com códigos individuais e conta da organizadora.

## Limitações antes da festa

- A versão online ainda não foi testada contra o seu Supabase real. Teste com participantes fictícias e dados descartáveis antes do evento.
- O PIN de quatro dígitos não oferece proteção forte contra tentativas repetidas; configure rate limiting/WAF na Vercel antes de compartilhar publicamente e prefira um segredo administrativo longo.
- A sessão dura 12 horas; após expirar, faça login novamente.
- O estado é atualizado a cada cinco segundos, não via Supabase Realtime.
- A expiração ocorre em consultas ao servidor (polling a cada 5 segundos de páginas abertas), não via agendamento permanente.
- Esta versão suporta uma rodada ativa por participante, mas a interface da organizadora mostra a primeira rodada ativa. **Não permita rodadas simultâneas** até implementar seleção de rodadas no painel. Para jogar um por vez, espere a organizadora finalizar antes de iniciar o próximo sorteio.
- Se a conexão cair depois que o servidor reservar um prêmio mas antes da animação terminar, o sorteio permanece registrado no Supabase e será recuperado ao atualizar a página.
- As fotos estão em bucket público; quem obtiver URLs poderá acessá-las. O servidor não envia lista completa de imagens para o navegador.
- O código do protótipo anterior foi usado como referência de CSS e layout; o armazenamento local e as fotos embutidas foram removidos. Os prêmios e desafios são lidos do Supabase.
