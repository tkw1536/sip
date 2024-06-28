# A SIP of WissKI

<!-- spellchecker:words SPARQL -->

WissKI is a system that enables users to represent data about any kind of objects using a formal ontology in an an RDF/SPARQL database.
WissKI does not fix the ontology.
The exact data model can be specified using the so-called Pathbuilder.

A typical WissKI use case is recording of objects in a scientific university collection.
Here the ontology used is the conceptual reference model developed by the international council of museums.

SIP stands for Supreme Inspector For Pathbuilders.
It is a tool adjacent to WissKI to inspect and visualize pathbuilders[^1].

The purpose of this document is three-fold:

1. It is meant as an introduction to Data Modelling in WissKI
2. As a documentation of the SIP tool
3. As a reference of the pathbuilder format


# Modeling Data in WissKI

WissKI stores data about a set of entities.
Ultimately these are stored using RDF triples inside a graph database.

WissKI users can be (broadly) split into two groups: Data Modelers and Data Explorers.
**Data Modelers** model entities using an appropriate ontology and RDF. 
**Data Explorers** explore and update data about entities, being unaware of the exact modeling.

As such, WissKI interacts with entities in two ways:
In a relational way for Data Explorers, and a triple-based way for Data Modelers.
Both of these are related using the Pathbuilder.

We look at these in order.

## WissKIs' relational model

WissKI presents data explorers with a relational model of entities.

Each entity is part of one bundle [^2].
Each bundle has a set of fields.
Each entity has values for each of the fields in its' bundle.

Each entity is identified by a URI.
Each bundle and field have a name.
Each field value is either a literal value (such as a boolean, number or string) or a reference to another entity.

As such the high-level data model behaves similar to a relational database.
In this analogy a bundle corresponds to a table and a field corresponds to a column.
Each entity would correspond to a single row.

## Entities as RDF Triples using Ontologies 

An RDF triple is a 3-tuple consisting of a subject, a predicate, and an object.
The subject and predicates are URIs.
The object can either be another URI, or a literal value, such a boolean, number or string.
RDF triples induce a directed graph, where nodes are labeled either with URIs or literals, and edges are labeled with predicates.
In this graph, a node is labeled with a literal if and only if it is a sink (meaning it has no outgoing edges). 

Such a graph can be queried using SPARQL queries.

In the entity-attribute-value model, an entity is modeled as a set of attributes and their corresponding values.
In RDF, this can be achieved by first assigning the entity a URI.
Then we assign each attribute a unique URI.
To represent that an entity has a certain value for a certain attribute, we use the subject corresponding to the entity, the predicate belonging to the attribute, and the value as an appropriate object.

In this document we will represent triples in the form following:

```
<a_subject> <a_predicate> <an_object>
<other_subject> <other_predicate> "some literal"
```

Typically each of the parts will be a URI, for brevity it may be abbreviated.
Unless stated otherwise, consider all examples in this document simplified.
This means they should not be used in a real modeling scenario. 

In this context, an ontology defines the set of properties and their URIs to use.
Ontologies typically also define 'classes' and a special type attribute.
Type attributes are assigned to an object, to determine its' class.
The ontology also defines which attributes may exist between entities of which classes.
It also defines subclass relations.
One standard for ontologies is OWL - ontology web language.

## Entity Triples in Practice

A naive approach to modeling objects using triples is to directly associate a property of an entity with that entity.
Consider as an example the painting of Mona Lisa.

To represent that it has the title `Mona Lisa` and was painted by someone named `Leonardo da Vinci` the following triples could be used. 

```rdf
<entity:mona_lisa> <onto:has_title> "Mona Lisa"
<entity:mona_lisa> <onto:has_artist_name> "Leonardo da Vinci"
```

In this example:

- `entity:mona_lisa` is the URI assigned to the `Mona Lisa` Entity;
- `onto:has_title` is the URI of a predicate meaning "subject has the following title"; and
- `onto:has_artist_name` is the URI of a predicate meaning "subject was painted by an artist with the following title".

This approach does accurately represent the facts, however it makes  


## The Pathbuilder

# 2. The SIP tool

## Loading a Pathbuilder

## The Namespace and Color Maps

## Editing Model

## The Bundle Graph

# 3. Pathbuilder Reference

( ... to be written ... )

[^1]: A future version of SIP may allow editing of Pathbuilders; in such a case this document will be updated.
[^2]: Technically speaking an entity is identified only by it's URI and as such may be seen as part of more than a single bundle.
We omit this detail for now. 