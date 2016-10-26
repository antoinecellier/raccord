# Source
 [Spécification GTFS](https://developers.google.com/transit/gtfs/reference/)

# Je veux la liste des prochains passages pour un arrêt donné

- REST
  - Écran des arrêts : `GET /stations?from&length`, `GET /stations/{stationId}`
  - Écran des passages : `GET /stations/{stationId}`, `GET /stops?stationId&after&from&length`, `GET /stops/{stopId}`

- RPC
  - Écran des arrêts : `GET /stations?from&length`
  - Écran des passages : `GET /stops?stationId&after&from&length`

- AQL
  - Écran des arrêts
  
    ```aql
    FOR t IN stops
    SORT t.stop_name ASC
    LIMIT {from}, {length}
    RETURN t
    ```
  - Écran des passages
  
    ```aql
    FOR st IN stop_times
    FILTER st.stop_id == '{stationId}'
    LIMIT {from}, {length}
    RETURN st
    ```

- Falcor
  - Écran des arrêts
  ```js
  [
    ["stations", {from, length}, ["id", "label"]],
  ]
  ```
  - Écran des passages
  ```js
  [
    ["stops", stationId, after, {from, length}, ["station", "direction", "route"], "label"],
    ["stops", stationId, after, {from, length}, ["id", "time"]],
  ]
  ```

- GraphQL
  - Écran des arrêts
  ```graphql
  query {
    stations(from: 0, length: 10) {
      id
      label
    }
  }
  ```
  - Écran des passages
  ```graphql
  query {
    stops(
        stationId: "COMM", 
        after: "2016-11-09T10:30:00", 
        from: 0, 
        length: 10) {
      id
      station { label }
      direction
      route { label }
      time
    }
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
    ["stations", {from, length}, ["id", "label"]],
    ["stations", {from, length}, "routes", {length: 20}, "label"],
  ]
  ```

- GraphQL
  - Écran des arrêts
  ```graphql
  query {
    stations(from: 0, length: 10) {
      id
      label
      routes { label }
    }
  }
  ```

# Je veux pouvoir rechercher les arrêts textuellement

- REST / RPC
  - Recherche d'arrêts : `GET /stations?search&from&length`

- Falcor
  - Recherche d'arrêts
  ```js
  [
    ["stations", "search", query, ["id", "label"]],
    ["stations", "search", query, "routes", {length: 20}, "label"],
  ]
  ```

- GraphQL
  - Recherche d'arrêts
  ```graphql
  query {
    stations(search: "Comm", from: 0, length: 10) {
      id
      label
      routes { label }
    }
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
    ["stations", {from, length}, ["id", "label"]],
    ["stations", {from, length}, "routes", {length: 20}, "label"],
    ["stations", "favorites", {from, length}, ["id", "label"]],
    ["stations", "favorites", {from, length}, "routes", {length: 20}, "label"],
  ]
  ```

- GraphQL
  - Mettre un arrêt en favoris
  ```graphql
  addFavorite(stationId) {
    id
    label
  }
  ```
  - Retirer un arrêt des favoris
  ```graphql
  removeFavorite(stationId) {
    id
    label
  }
  ```
  - Écran des arrêts
  ```graphql
  query {
    favoriteStations(from: 0, length: 10) {
      id
      label
      routes { label }
    }
    stations(search: "Comm", from: 0, length: 10) {
      id
      label
      routes { label }
    }
  }
  ```

# Sur tablette seulement, je veux afficher les 3 prochains passages aux arrêts favoris directement dans la liste des arrêts

- REST
  - Écran des arrêts : + `GET /stops?stationId&after&from=0&length=3`, `GET /stops/{stopId}`

- RPC
  - Écran des arrêts : même requête mais modification du serveur pour envoyer plus de données

- Falcor
  - Écran des arrêts
  ```js
  [
    ["stations", {from, length}, ["id", "label"]],
    ["stations", {from, length}, "routes", {length: 20}, "label"],
    ["stations", "favorites", {from, length}, ["id", "label"]],
    ["stations", "favorites", {from, length}, "routes", {length: 20}, "label"],
    ["stations", "favorites", {from, length}, "stops", after, {from: 0, length: 3}, "route", "label"],
    ["stations", "favorites", {from, length}, "stops", after, {from: 0, length: 3}, "time"],
  ]
  ```

- GraphQL
  - Écran des arrêts
  ```graphql
  favoriteStations(from, length) {
    id
    label
    routes { label }
    stops(after, from: 0, length: 3) {
      route { label }
      time
    }
  }
  stations(search, from, length) {
    id
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
    ["stations", {from, length}, ["id", "label"]],
    ["stations", {from, length}, "routes", {length: 20}, "label"],
    ["stations", "favorites", {from, length}, ["id", "label"]],
    ["stations", "favorites", {from, length}, "routes", {length: 20}, "label"],
    ["stations", "close", 47.213663, -1.556547, {from, length}, ["id", "label", "distance"]],
    ["stations", "close", 47.213663, -1.556547, {from, length}, "routes", {length: 20}, "label"],
  ]
  ```

- GraphQL
  - Écran des arrêts
  ```graphql
  closeStations(latitude, longitude, from, length) {
    id
    label
    routes { label },
    distance
  }
  favoriteStations(from, length) {
    id
    label
    routes { label }
  }
  stations(search, from, length) {
    id
    label
    routes { label }
  }
  ```

# Quand je clique sur un passage, je veux voir quand j’arriverais à ma destination qui se trouve plus loin sur la même ligne (un écran liste les prochains arrêts avec l’heure d’arrivée)

- REST
  - Écran de la ligne : `GET /stations/{stationId}`, `GET /stops?following=stopId&from&length`, `GET /stops/{stopId}`

- Falcor
  - Écran de la ligne
  ```js
  [
    ["stops", stopId, "station", "label"],
    ["stops", stopId, "route", "label"],
    ["stops", stopId, "time"],
    ["stops", "following", stopId, {from, length}, "station", "label"],
    ["stops", "following", stopId, {from, length}, "time"],
  ]
  ```

- GraphQL
  - Écran de la ligne
  ```graphql
  stops(id: stopId) {
    station { label }
    route { label }
    time
  }
  stops(following: stopId, from, length) {
    station { label }
    time
  }
  ```

# Sur tablette seulement, je veux voir les prochaines correspondances en plus de l'heure d'arrivée

- REST
  - Écran de la ligne : + `GET /stops/{stopId}/transfers?from&length`, `GET /stops/{stopId}`

- Falcor
  - Écran de la ligne
  ```js
  [
    ["stops", stopId, "station", "label"],
    ["stops", stopId, "route", "label"],
    ["stops", stopId, "time"],
    ["stops", "following", stopId, {from, length}, "station", "label"],
    ["stops", "following", stopId, {from, length}, "time"],
    ["stops", "following", stopId, {from, length}, "transfers", {from, length}, "route", "label"],
    ["stops", "following", stopId, {from, length}, "transfers", {from, length}, "time"],
  ]
  ```

- GraphQL
  - Écran de la ligne
  ```graphql
  stops(id: stopId) {
    station { label }
    route { label }
    time
  }
  stops(following: stopId, from, length) {
    station { label }
    time
    transfers(from, length) {
      route { label }
      time
    }
  }
  ```
