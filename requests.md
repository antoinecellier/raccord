# Je veux la liste des prochains passages pour un arrêt donné

- REST
  - Écran des arrêts : `GET /stations?from&length`, `GET /stations/{stationId}`
  - Écran des passages : `GET /stations/{stationId}`, `GET /stops?stationId&after&from&length`, `GET /stops/{stopId}`

- RPC
  - Écran des arrêts : `GET /stations?from&length`
  - Écran des passages : `GET /stops?stationId&after&from&length`

- Falcor
  - Écran des arrêts
  ```js
  [
    ["stations", {from, length}, ["code", "label"]],
  ]
  ```
  - Écran des passages
  ```js
  [
    ["stops", stationId, after, {from, length}, ["station", "direction", "line"], "label"],
    ["stops", stationId, after, {from, length}, "time"],
  ]
  ```

- GraphQL
  - Écran des arrêts
  ```graphql
  stations(from, length) {
    code
    label
  }
  ```
  - Écran des passages
  ```graphql
  stops(stationId, after, from, length) {
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
    ["stations", {from, length}, ["code", "label"]],
    ["stations", {from, length}, "lines", {length: 20}, "label"],
  ]
  ```
- GraphQL
  - Écran des arrêts
  ```graphql
  stations(stationId, from, length) {
    code
    label
    lines { label }
  }
  ```

# Je veux pouvoir rechercher les arrêts textuellement

- REST / RPC
  - Recherche d'arrêts : `GET /stations?search&from&length`

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
  - Mettre un arrêt en favoris : `PATCH /stations/favorites {add: stationId}`
  - Retirer un arrêt des favoris : `PATCH /stations/favorites {remove: stationId}`
  - Écran des arrêts : +`GET /stations/favorites`

- Falcor
  - Mettre un arrêt en favoris: `setValue(["stations", stationId, "favorite"], true)`
  - Retirer un arrêt en favoris: `setValue(["stations", stationId, "favorite"], false)`
  - Écran des arrêts
  ```js
  [
    ["stations", {from, length}, ["code", "label"]],
    ["stations", {from, length}, "lines", {length: 20}, "label"],
    ["stations", "favorites", {from, length}, ["code", "label"]],
    ["stations", "favorites", {from, length}, "lines", {length: 20}, "label"],
  ]
  ```

- GraphQL
  - Mettre un arrêt en favoris
  ```graphql
  addFavorite(stationId)
  ```
  - Retirer un arrêt des favoris
  ```graphql
  removeFavorite(stationId)
  ```
  - Écran des arrêts
  ```graphql
  favoriteStations(from, length) {
    code
    label
    lines { label }
  }
  stations(search, from, length) {
    code
    label
    lines { label }
  }
  ```

# Je veux avoir les arrêts les plus proches de moi en premier

- REST
  - Écran des arrêts : +`GET /stations?latitude&longitude&from&length`

- Falcor
  - Écran des arrêts
  ```js
  [
    ["stations", {from, length}, ["code", "label"]],
    ["stations", {from, length}, "lines", {length: 20}, "label"],
    ["stations", "favorites", {from, length}, ["code", "label"]],
    ["stations", "favorites", {from, length}, "lines", {length: 20}, "label"],
    ["stations", "close", 47.213663, -1.556547, {from, length}, ["code", "label", "distance"]],
    ["stations", "close", 47.213663, -1.556547, {from, length}, "lines", {length: 20}, "label"],
  ]
  ```

- GraphQL
  - Écran des arrêts
  ```graphql
  closeStations(latitude, longitude, from, length) {
    code
    label
    lines { label },
    distance
  }
  favoriteStations(from, length) {
    code
    label
    lines { label }
  }
  stations(search, from, length) {
    code
    label
    lines { label }
  }
  ```

# Je veux pouvoir filtrer les prochaines passages par ligne

- REST
  - Écran des passages : `GET /stops?stationId&line&after&from&length`

- Falcor TODO
- GraphQL TODO

# Pour un arrêt et un passage donné, je veux voir quand est-ce que j’arriverais à ma destination qui se trouve plus loin sur la même ligne (un écran liste les prochains arrêts avec l’heure d’arrivée)

- REST
  - Écran de la ligne : `GET /stations/{stationId}`, `GET /stops?following=stopId&line&from&length`, `GET /stops/{stopId}`

- Falcor
  - Écran des passages
  ```js
  [
    ["stops", "following", stopId, line, {from, length}, ["station", "direction", "line"], "label"],
    ["stops", "following", stopId, line, {from, length}, "time"],
  ]
  ```
- GraphQL
  - Écran de la ligne
  ```graphql
  stops(following, line, from, length) {
    station { label }
    direction { label }
    line { label }
    time
  }
  ```
