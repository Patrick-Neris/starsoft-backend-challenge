# Teste para Desenvolvedor(a) Back-End Node.js/NestJS - Sistemas Distribuídos

## Visão Geral

Esta é uma solução para um sistema de venda de ingressos para uma rede de cinemas. Utilizando Docker e NestJS para lidar com os desafios dessa solução, este sistema permite a criação e consulta de sessões além da reserva, confirmação de pagamento e consulta de histórico de vendas.

## Tecnologias

- **PostgreSQL**
  Escolhido pela facilidade de implementação e manutenção.

- **RabbitMQ**
  Escolhido por não precisar salvar as mensagens após o consumo.

- **Redis**
  Escolhido pela familiaridade com a tecnologia, já tive experiência em utilizar ele, e para utilizar o sistema de lock para lidar com a Race Condition.

## Como Executar

- **Pré-Requisitos**
  Somente ter o Docker instalado em sua máquina, o sistema está configurado para subir com um único comando "docker compose up"

- **Comandos**
  Basta rodar "docker compose up" que o sistema sobe e já popula as tabelas com alguns dados fakes para facilitar os testes, também tirei o arquivo .env do gitignore para facilitar os testes, essa não é a melhor prática mas todos logins e senhas são genéricos somente para teste.
  Para os testes unitários é necessário instalar as bibliotecas node com "npm i" e depois é só rodar o comando "npm run test", para ter a cobertura dos testes basta rodar "npm run test:cov". Após subir o ambiente basta seguir a lista de APIs com exemplos de uso para testar a solução.

- **Estratégias**
  Para resolver a race condition utilizei o sistema de lock do Redis, travando a reserva por sessão, sei que esta solução travaria muito as vendas caso muitas pessoas desejassem comprar assentos para a mesma sessão e essa é uma melhoria a ser feita futuramente. Ao utilizar o cache do Redis eu também garanto que todas as instâncias estão utilizando consultando a mesma fonte de informação, então caso uma dê o lock na sessão as outras não reservarão os mesmos assentos.

## Endpoints

São 5 no total, segue a lista deles:

- **/sessoes/consulta GET**
  Endpoint para consulta de informações de sessões, podendo pesquisar por id da sessão ou nome do filme.
  Parâmetros:
  id? number
  filme? string

  retorno:
  {
  "id": number,
  "filme": string,
  "data": date,
  "horario": time,
  "sala": number,
  "preco": string,
  "assentosdisponiveis": number[]
  }

  Apesar de ambos parâmetros serem opcionais, ao pesquisar sem nenhuma delas o retorno é:
  {
  "message": "Informe ao menos um filtro válido: id, filme, data ou horario",
  "error": "Bad Request",
  "statusCode": 400
  }

- **/sessoes/criar-sessao POST**
  Endpoint para criar sessões.
  Parâmetros:
  {
  "filme": string,
  "data": date,
  "horario": time,
  "sala": number,
  "preco": float,
  "assentos": number
  }

  Retorno:
  {
  "id": number,
  "filme": string,
  "data": date,
  "horario": time,
  "sala": number,
  "preco": float,
  "assentos": number
  }

- **/vendas/reservar POST**
  Endpoint para reserva de assentos.
  Parâmetros:
  {
  "sessaoId": number,
  "assentos": number[],
  "usuario": string
  }

  Retorno:
  {
  "reservaId": uuid,
  "sessaoId": number,
  "assentos": number[],
  "usuario": string,
  "expiresAt": timestamp
  }

- **/vendas/pagamento POST**
  Endpoint para confirmar pagamento e convertar reserva em venda.
  Parâmetro:
  {
  "reservaId": uuid
  }

  Retorno:
  {
  "status": "VENDA_CONFIRMADA",
  "reservaId": uuid
  }

- **/vendas/historico GET**
  Endpoint para pesquisa de histórico de vendas.
  Parâmetros:
  sessaoId?: number,
  usuario?: string

  Retorno:
  "data": [
  {
  "v_id": uuid,
  "v_usuario": string,
  "v_assentos": number[],
  "sessao_id": number
  },
  ]

## Limitações e Melhorias

Há muitas limitações e melhorias a se fazer, então vou listar elas e usar elas como um TODO para continuar trabalhando nesse projeto.

- **Arquitetura**
  O ideal seria separar em diversos workers para cada um ter sua responsabilidade e facilitar a administração de responsabilidades entre eles, por exemplo ter um só para validações e outro só para operações de escrita no banco de dados, dessa forma fica mais fácil de controlar quantos workers teriam de cada um deles na nuvem para ter mais processamento dinamicamente.

- **Mensageria**
  Junto com a modularização da solução vem o sistema de mensageria para conversas entre os diferentes módulos da solução.

- **Logs**
  Os logs devem ter mais informações para ter um rastreio melhor de cada transação, não tenho um transactionId para rastrear toda a operação e facilitar possíveis debugs no sistema.

- **Cache**
  O sistema de cache precisa de uma melhoria no seu design, da forma que está é necessário fazer muitos resets na memória que não deveriam ser necessários.

- **Tipagem do Redis e RabbitMQ**
  Os dois estão com tipos genéricos e gerando avisos no typescript, gastei um bom tempo tentando resolver mas não consegui, ainda.

- **Testes e2e**
  Necessário fazer testes e2e automatizados, apesar de conseguir testar tudo na mão chamando as APIs, é necessário um teste automático testandoo fluxo todo para garantir que futuras alterações no código não quebrem o fluxo.

- **Testes com múltiplas instâncias**
  Assim como os testes e2e é necessário automatizar esse tipo de teste para garantir que a concorrência esteja resolvida.

- **Tratamento de erros**
  Aumentar o tratamento de erros pegando os erros especifícios possíveis e tratá-los ao invés de jogar todos como genéricos.

- **Tipagem e interface de dados internos**
  Necessário forçar a tipagem em tudo para padronização e evitar erros no código.

## Considerações Finais

Infelizmente não consegui codar todos os dias por problemas pessoais, mas foi muito divertido e desafiador fazer esse desafio, pretendo continuar codando ele pois acredito que é um excelente portfólio e caso de estudo, aprendi e reaprendi muita coisa nessa semana e com certeza com mais tempo posso fazer muitas melhorias nesse projeto, tentei ser o mais honesto possível nas limitações e melhorias, mas com certeza tem muitas mais melhorias a se fazer, obrigado pelo desafio e espero que goste da minha solução ou veja potencial nela e especialmente em mim.
