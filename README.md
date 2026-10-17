# Quadro de Lotação (QL) · Molicenter — app web

App estático (HTML/CSS/JS) servido pelo GitHub Pages a partir da pasta `docs/`.
Os dados ficam no Supabase e só são acessados pelas funções `ql_web_*`, que exigem login.

**Este repositório não guarda dados de colaboradores.** O Excel do Senior é enviado pela tela
“Atualizar banco (Excel)” e lido no navegador; só as colunas do quadro vão para o banco
(CPF, Nascimento, Cadastro etc. são descartados). Nunca suba o `Banco QL.xlsx` nem arquivos
`.sql` com senhas para cá.
