## Fake Twitter
**Fake Twitter** é uma REST API escrita em Javascript (NodeJS) com o intuito de simular a rede social [Twitter](https://twitter.com) e foi desenvolvida com o objetivo de estudar o framework e a construção de uma aplicação.

### Requisitos do Projeto
Com o objetivo de simular o funcionamento do micro-blog Twitter, o escopo do projeto limitou-se as funcionalidades básicas da rede. Sendo assim, os requisitos mínimos determinados para este projeto foram:
  - O usuário deve ter a capacidade de se cadastrar na plataforma e inserir informações pessoais básicas (nome, _username_, bio e foto), podendo alterá-las futuramente;
    - O _username_ e e-mail do usuário devem ser únicos para cada registro.
  - O usuário, após cadastrado, deve ter a capacidade de realizar o _login_ e  utilizar a API para inserir conteúdo (_Tweets_) e seguir outros usuários;
  - Dar ao usuário a possibilidade de inserir _likes_ nos tweets disponíveis;
  - O usuário deve ser capaz de apagar _tweets_, remover _likes_ e deixar de _seguir_ outros usuários;
  - A API deve ter a capacidade de fornecer os seguintes conjuntos de dados:
    - Lista de _tweets_ de todos os usuários à qual o usuário registrado na sessão esta seguindo, ordenados por data de criação;
    - Informações de cada usuário (nome, _username_, bio, foto, seguidores, seguindo), bem como a lista de _tweets_ destes usuários;
    - Informações detalhadas de tweets (conteúdo, autor, lista de usuários que deram _like_, data de criação);
    
Para atender tais requisitos e manter o projeto simples, a API e Banco de Dados foram baseadas em dois Modelos de Dados: __Tweet__ e __User__; Com as respectivas estruturas diagramadas abaixo:

<p align="center"><img src="https://github.com/asasouza/node-fake-twitter/blob/master/diagram.png"  /></p>

### Tecnologias
Para tornar a aplicação real, as seguintes tecnologias/pacotes/frameworks foram utilizadas:
 - Express JS, para o gerenciamento de rotas, _middlewares_, recebimento e envio de dados, etc;
   - Express Brute, Express Rate Limit, Helmet, Rate Limit Mongo: utilizados para aumentar a segurança geral da aplicação adicionando proteção contra ataques de força bruta, limite de requisições por período de tempo e remoção/adição de _Headers HTTP_ relacionados a segurança;
   - Body Parser e Express Validator: para facilitar o recebimento, tratamento e validação dos dados recebidos pela API;
   - Multer, Sharp e Buffer Image Size: para realizar o upload, redimensionamento e validação de imagens (este projeto pode ser configurado para salvar os arquivos de imagens no sistema de arquivo do Sistema Operacional ou em Base64, diretamente no Banco de Dados);
   - BCryptJS e JWT: para armazenamento seguro de senhas e criação de _tokens_ de acesso à API;
 - MongoDB + Mongoose: banco de dados NoSQL e ODM para comunicação com esta BD; 
   - Durante o desenvolvimento do projeto foi utilizado o serviço [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) para hospedagem do Banco de Dados, por tratar-se de uma solução gratuita, no caso deste projeto de estudo, e rápida sem a necessidade de configurar um ambiente especifico para o banco de dados;

A API encontra-se disponível neste [endpoint](https://node-fake-twitter.herokuapp.com/) atraves do serviço de hospedagem [Heroku](https://heroku.com/). Para uso em ambiente local, ou em outras implementações, é necessário que as variáveis de conexão sejam alteradas no arquivo ```config/constants.js```. 

### Documentação da API
A documentação da API encontra-se disponível [neste link](https://documenter.getpostman.com/view/4738635/TVKEVbm1), que contêm todas as rotas da aplicação, assim como exemplos dos possíveis retornos.

__Veja também__: [Flutter Fake Twitter](https://github.com/asasouza/flutter-fake-twitter), um app escrito com o framework Flutter (Dart), e que utiliza esta API, para replicar a interface e funcionamento do Twitter.
    
    
