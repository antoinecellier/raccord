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
    ["stops", stationId, after, {from, length}, ["station", "direction", "route"], "label"],
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
    route { label }
    time
  }
  ```

# Je veux que la liste des arrêts affichent les lignes qui passent à chaque arrêt

- REST
  - Écran des arrêts : + `GET /routes/{routeId}`

- RPC
  - Écran des arrêts : même requête mais modification du serveur pour envoyer plus de données

- Falcor
  - Écran des arrêts
  ```js
  [
    ["stations", {from, length}, ["code", "label"]],
    ["stations", {from, length}, "routes", {length: 20}, "label"],
  ]
  ```

- GraphQL
  - Écran des arrêts
  ```graphql
  stations(stationId, from, length) {
    code
    label
    routes { label }
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
    ["stations", "search", query, "routes", {length: 20}, "label"],
  ]
  ```

- GraphQL
  - Recherche d'arrêts
  ```graphql
  stations(search: query) {
    code
    label
    routes { label }
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
    ["stations", {from, length}, "routes", {length: 20}, "label"],
    ["stations", "favorites", {from, length}, ["code", "label"]],
    ["stations", "favorites", {from, length}, "routes", {length: 20}, "label"],
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
    routes { label }
  }
  stations(search, from, length) {
    code
    label
    routes { label }
  }
  ```

# Je veux afficher les 3 prochains passages aux arrêts favoris directement dans la liste des arrêts

- REST
  - Écran des arrêts : + `GET /stops?stationId&after&from=0&length=3`, `GET /stops/{stopId}`

- RPC
  - Écran des arrêts : même requête mais modification du serveur pour envoyer plus de données

- Falcor
  - Écran des arrêts
  ```js
  [
    ["stations", {from, length}, ["code", "label"]],
    ["stations", {from, length}, "routes", {length: 20}, "label"],
    ["stations", "favorites", {from, length}, ["code", "label"]],
    ["stations", "favorites", {from, length}, "routes", {length: 20}, "label"],
    ["stations", "favorites", {from, length}, "stops", after, {from: 0, length: 3}, "route", "label"],
    ["stations", "favorites", {from, length}, "stops", after, {from: 0, length: 3}, "time"],
  ]
  ```

- GraphQL
  - Écran des arrêts
  ```graphql
  favoriteStations(from, length) {
    code
    label
    routes { label }
    stops(after, from: 0, length: 3) {
      route { label }
      time
    }
  }
  stations(search, from, length) {
    code
    label
    routes { label }
  }
  ```

# Je veux avoir un accès rapide aux arrêts les plus proches de moi

- REST
  - Écran des arrêts : +`GET /stations?latitude&longitude&from&length`

- Falcor
  - Écran des arrêts
  ```js
  [
    ["stations", {from, length}, ["code", "label"]],
    ["stations", {from, length}, "routes", {length: 20}, "label"],
    ["stations", "favorites", {from, length}, ["code", "label"]],
    ["stations", "favorites", {from, length}, "routes", {length: 20}, "label"],
    ["stations", "close", 47.213663, -1.556547, {from, length}, ["code", "label", "distance"]],
    ["stations", "close", 47.213663, -1.556547, {from, length}, "routes", {length: 20}, "label"],
  ]
  ```

- GraphQL
  - Écran des arrêts
  ```graphql
  closeStations(latitude, longitude, from, length) {
    code
    label
    routes { label },
    distance
  }
  favoriteStations(from, length) {
    code
    label
    routes { label }
  }
  stations(search, from, length) {
    code
    label
    routes { label }
  }
  ```

# Pour un arrêt et un passage donné, je veux voir quand est-ce que j’arriverais à ma destination qui se trouve plus loin sur la même ligne (un écran liste les prochains arrêts avec l’heure d’arrivée)

- REST
  - Écran de la ligne : `GET /stations/{stationId}`, `GET /stops?following=stopId&from&length`, `GET /stops/{stopId}`

- Falcor
  - Écran de la ligne
  ```js
  [
    ["stops", "following", stopId, {from, length}, ["station", "direction"], "label"],
    ["stops", "following", stopId, {from, length}, "time"],
  ]
  ```

- GraphQL
  - Écran de la ligne
  ```graphql
  stops(following: stopId, from, length) {
    station { label }
    direction { label }
    time
  }
  ```

# Correspondances (lignes et heures)

- Falcor
  - Écran de la ligne
  ```js
  [
    ["stops", "following", stopId, {from, length}, ["station", "direction"], "label"],
    ["stops", "following", stopId, {from, length}, "time"],
    ["stops", "following", stopId, {from, length}, "transfers", {from, length}, "route", "label"],
    ["stops", "following", stopId, {from, length}, "transfers", {from, length}, "time"],
  ]
  ```

- GraphQL
  - Écran de la ligne
  ```graphql
  stops(following: stopId, from, length) {
    time
    direction { label }
    transfers(from, length) {
      route { label }
      time
    }
  }
  ```
