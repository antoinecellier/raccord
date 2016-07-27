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

# Je veux pouvoir rechercher les arrêts textuellement

- REST
  - Recherche d'arrêts : `GET /stations?search=query`
- Falcor
  - Recherche d'arrêts
  ```js
  [
    ["stations", "search", query, ["code", "label"]],
    ["stations", "search", query, "lines", {length: 20}, "label"],
  ]
  ```
- GraphQL
  - Recherche d'arrêts
  ```graphql
  stations(search: query) {
    code
    label
    lines { label }
  }
  ```

# Je veux pouvoir mettre des arrêts en favoris pour un accès rapide

- REST
  - Mettre un arrêt en favoris : `PATCH /stations/{stationId} {favorite: true}`
  - Retirer un arrêt des favoris : `PATCH /stations/{stationId} {favorite: false}`
  - Écran des arrêts : `GET /stations`, `GET /stations?favorites`
- Falcor
  - Mettre un arrêt en favoris: `setValue(["stations", stationId, "favorite"], true)`
  - Retirer un arrêt en favoris: `setValue(["stations", stationId, "favorite"], false)`
  - Écran des arrêts
    ```js
    [
      ["stations", {length: 1000}, ["code", "label"]],
      ["stations", {length: 1000}, "lines", {length: 20}, "label"],
      ["stations", "favorites", {length: 1000}, ["code", "label"]],
      ["stations", "favorites", {length: 1000}, "lines", {length: 20}, "label"],
    ]
    ```
- GraphQL
  - TODO

# Je veux avoir les arrêts les plus proches de moi en premier

- REST
  - Écran des arrêts : `GET /stations`, `GET /stations?favorites`, `GET /stations?latitude&longitude`
- Falcor
  - Écran des arrêts
    ```js
    [
      ["stations", {length: 1000}, ["code", "label"]],
      ["stations", {length: 1000}, "lines", {length: 20}, "label"],
      ["stations", "favorites", {length: 1000}, ["code", "label"]],
      ["stations", "favorites", {length: 1000}, "lines", {length: 20}, "label"],
      ["stations", "close", 47.213663, -1.556547, {length: 1000}, ["code", "label"]],
      ["stations", "close", 47.213663, -1.556547, {length: 1000}, "lines", {length: 20}, "label"],
    ]
    ```
- GraphQL
  - TODO
