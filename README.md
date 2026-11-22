# ParentWatch — Backend

Servidor do **ParentWatch**, um app para responsáveis acompanharem a localização dos filhos em tempo real.

## Para que serve

- Cadastro e login de responsáveis (`parent`) e crianças (`child`) com **CPF e senha**.
- Vínculo entre responsável e criança por um **código de família** que pertence à criança.
- Localização **em tempo real**, enviada pelo celular da criança e recebida pelo responsável.
- **Histórico** das últimas 3 posições (uma por hora), com endereço.

## Como funciona

1. A criança se cadastra e recebe um código de família (ex.: `ABCD-EFGH`). O responsável se cadastra sem código.
2. O responsável faz login e informa o código da criança para vinculá-la.
3. A criança faz login, e o aparelho dela envia a posição pelo Socket.io.
4. O responsável recebe a posição de cada filho vinculado, atualizada a cada movimento.

## Tecnologias

Node.js, Express 5, Socket.io, MongoDB Atlas (Mongoose), bcrypt, JWT em cookie HttpOnly e Nominatim (OpenStreetMap) para os endereços.

## API HTTP

O login usa o cookie `token`. Nas chamadas de um navegador, envie com `credentials: "include"`.

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/auth/register` | público | Cria uma conta |
| POST | `/auth/login` | público | Faz login e grava o cookie (válido por 1 dia) |
| POST | `/auth/logout` | público | Apaga o cookie |
| GET | `/auth/me` | logado | Devolve o usuário logado |
| POST | `/family/children` | responsável | Vincula uma criança pelo código |
| GET | `/family/children` | responsável | Lista as crianças vinculadas |
| GET | `/locations/:userId` | conforme a permissão | Posição atual e histórico |

Cadastro:

```json
{
  "firstName": "Nome",
  "lastName": "Sobrenome",
  "cpf": "529.982.247-25",
  "email": "email@mail.com",
  "password": "sua-senha",
  "role": "child"
}
```

Login: `{ "cpf": "529.982.247-25", "password": "sua-senha" }`. Vincular filho: `{ "familyCode": "ABCD-EFGH" }`.

Resposta de `GET /locations/:userId`:

```json
{
  "userId": "665f1a2b3c4d5e6f7a8b9c0d",
  "online": true,
  "current": { "lat": -23.5505, "lng": -46.6333, "accuracy": 10, "at": "2026-11-21T14:00:00.000Z" },
  "lastLocations": [
    { "lat": -23.5505, "lng": -46.6333, "address": "Rua Exemplo, 100, Centro, São Paulo", "city": "São Paulo", "at": "2026-11-21T14:00:00.000Z" }
  ]
}
```

`current` é `null` (e `online` é `false`) quando a pessoa não está compartilhando. O histórico vem da posição mais recente para a mais antiga.

## Tempo real (Socket.io)

A conexão é autenticada pelo cookie de login: faça o login antes e abra o socket com `withCredentials: true`. O servidor recusa quem não está logado ou vem de outra origem.

| Evento | Sentido | Dados | Descrição |
|---|---|---|---|
| `location:update` | cliente → servidor | `{ lat, lng, accuracy }` | Informa a posição de quem está logado |
| `location:watch` | cliente → servidor | id do usuário | Passa a acompanhar uma pessoa |
| `location:unwatch` | cliente → servidor | id do usuário | Para de acompanhar |
| `location:stop` | cliente → servidor | — | Para de compartilhar |
| `location:current` | servidor → cliente | `{ userId, position }` | Posição de agora, logo após o `watch` |
| `location:changed` | servidor → cliente | `{ userId, lat, lng, accuracy, at }` | Nova posição de quem está sendo acompanhado |
| `location:offline` | servidor → cliente | `{ userId }` | A pessoa parou de compartilhar |
| `location:error` | servidor → cliente | `{ message }` | Pedido inválido ou sem permissão |

App da criança:

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:8080", { withCredentials: true });

navigator.geolocation.watchPosition((position) => {
  socket.emit("location:update", {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
  });
});
```

App do responsável:

```javascript
const socket = io("http://localhost:8080", { withCredentials: true });

socket.on("connect", () => {
  children.forEach((child) => socket.emit("location:watch", child.id));
});

socket.on("location:changed", (position) => console.log(position));
```

## Regras de negócio

- Cada pessoa vê a própria localização. O responsável vê só as crianças vinculadas a ele. A criança não vê ninguém além dela.
- A posição atual fica só na memória do servidor, enquanto a pessoa está conectada.
- O histórico guarda no máximo 3 posições, gravadas a cada 1 hora, com endereço. Leituras com precisão pior que 100 m não entram.
- A senha é guardada com hash bcrypt. O CPF não é guardado: só um hash HMAC-SHA256 gerado com o `CPF_PEPPER`.
- O app lida com a localização de crianças e deve ser usado com o conhecimento e o consentimento dos envolvidos.

## Estrutura do projeto

```
src/
  server.js        entrada do servidor
  lib/             conexão com o banco, CPF e permissões
  models/          modelo do usuário
  routes/          rotas de auth, família e localização
  middlewares/     proteção das rotas e do socket
  controllers/     lógica de cadastro e login
  services/        posição atual e histórico
  socket/          eventos em tempo real
  utils/           código da família e geocodificação
```

## Alunos

- Darllan Cabral Sousa
- Gustavo Travassos Barbosa
- José Alison Barbosa da Silva
- Renan dos Reis Pimentel
- Rodrigo Silveira Silva
