# Je veux la liste des prochains passages pour un arrêt donné

- REST
  - Écran des arrêts : `GET /stations`
  - Écran des passages : `GET /stops/{stationId}`

- Falcor
  - Écran des arrêts
  ```js
  [
    ["stations", {length: 1000}, ["code", "label"]],
  ]
  ```
  - Écran des passages
  ```js
  [
    ["stops", stationId, {length: 1000}, ["station", "direction", "line"], "label"],
    ["stops", stationId, {length: 1000}, "time"],
  ]
  ```

- GraphQL
  - Écran des arrêts
  ```graphql
  stations {
    code
    label
  }
  ```
  - Écran des passages
  ```graphql
  stops(stationId: stationId) {
    station { label }
    direction { label }
    line { label }
    time
  }
  ```

# Je veux que la liste des arrêts affichent les lignes qui passent à chaque arrêt

- Falcor
  - Écran des arrêts
  ```js
  [
    ["stations", {length: 1000}, ["code", "label"]],
    ["stations", {length: 1000}, "lines", {length: 20}, "label"],
  ]
  ```
- GraphQL
  - Écran des arrêts
  ```graphql
  stations {
    code
    label
    lines { label }
  }
  ```
