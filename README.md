# Raccord

The application used in the talk "GraphQL vs Falcor" by @antoinecellier and @hgwood.

## Abstract

L’hégémonie de l’architecture REST est ébranlée par de nouveaux venus : GraphQL de Facebook et Falcor de Netflix. Comment ces deux technologies peuvent-elles nous aider à développer des applications web plus rapidement ?

Nous commencerons par une brève introduction de GraphQL et Falcor : le concept qui se cache derrière, leurs objectifs, ainsi que leur place dans nos architectures client-serveur.

Nous vous proposerons ensuite de développer une application mobile de transport en commun avec REST, GraphQL et Falcor afin de comparer l’impact de ces technologies sur les propriétés du code et les coûts de développement. Cette comparaison sera assistée par un outil de traduction de requêtes, conçu par nos soins.

## The Long Story

Toutes les applications business modernes se basent sur une forme d'API HTTP. Alors que les API REST-ish sont encore en cours de maturation (Hypermedia, Swagger...), voilà que Facebook et Netflix choisissent de tout reprendre à zéro et de proposer une architecture neuve pour la communication de données entre un serveur et un client. Il nous semble primordial de suivre ce courant et d'évaluer les avantages que ses propositions peuvent apporter à nos applications.

Nous sommes 2 speakers Nantais travaillant chez Zenika, et nous avons déjà, chacun de notre côté, présenté GraphQL et Falcor à différentes occasions : Nantes JUG, Breizhcamp, BDX/IO, Devoxx. Pour ce talk nous allions nos connaissances pour comparer ces deux technologies.

L’objectif est double. D’une part, il s’agit de montrer comment GraphQL et Falcor permettent d’avoir une base de code plus stable face aux nouveaux besoins métiers, et de meilleures performances, par rapport aux API HTTP classiques. D’autre part, il s’agit de montrer en quoi GraphQL et Falcor sont similaires et en quoi ils diffèrent.

Nous accomplissons le premier objectif en simulant le développement d’une application mobile de transport en commun dont les besoins utilisateurs changent. Par “simuler” nous entendons que nous n’avons pas codé cette application dans son entier, mais seulement ce qui nous intéresse pour ce talk : le côté serveur, et les requêtes REST/GraphQL/Falcor que le client doit envoyer pour répondre aux besoins.

La simulation se déroule ainsi :

- Un nouveau besoin est introduit.
- Pour chacune des technologies, on établit les nouvelles requêtes du client, et on les exécute.
- Pour chacune des technologies, on discute des impacts sur le serveur.
- Faut-il supprimer/ajouter du code et en quelle quantité ?
- Les performances sont-elles optimales ?
- On attribue un score à chaque technologie.

La simulation est conclu par le classement et un résumé de la force de chaque approche en fonction du type de projet.

Le second objectif est rempli grâce à une rapide introduction à GraphQL et Falcor en début de talk, puis par un outil que nous avons codé spécialement pour l’occasion. Cet outil traduit les requêtes Falcor en requêtes GraphQL et inversement. Nous l’utiliserons en live pendant le talk pour illustrer les différences et ressemblances (l’existence de l’outil étant en elle-même une preuve de ressemblance).

Nous espérons que le spectateur sorte de cette conférence avec une bonne idée de la pertinence de Falcor et GraphQL pour les applications qu'il développe en ce moment ou qu’il développera dans le futur.
