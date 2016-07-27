# Je veux la liste des prochains passages pour un arrêt donné

- REST

`GET /stations`

`GET /stops/{stationId}`

- Falcor

```js
[
  ["stations", {length: 1000}, ["code", "label"]],
]
```

```js
[
  ["stops", stationId, {length: 1000}, ["station", "direction", "line"], "label"],
  ["stops", stationId, {length: 1000}, "time"],
]
```

- GraphQL

```graphql
stations {
  code
  label
}
```

```graphql
stops(stationId: stationId) {
  station { label }
  direction { label }
  line { label }
  time
}
```
