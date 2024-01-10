import N3 from 'n3';
import fs from "fs";
import {readFileSync} from "fs";
import {writeFileSync} from 'fs';
import convert from 'xml-js';
import jp from 'jsonpath';
import yaml from "js-yaml";
import jsonld from "jsonld";
import { RdfStore } from 'rdf-stores';
import { QueryEngine } from '@comunica/query-sparql';
import rdfDataset from "@rdfjs/dataset";
import validate from './shacl/shacl_validation.js';
import rdf from "@zazuko/env-node";

const { DataFactory } = N3;
const { namedNode, quad } = DataFactory;
const config = yaml.load(readFileSync('../resources/source/config.yml', 'utf8'));
const shapes = await rdf.dataset().import(rdf.fromFile(config.ap.dcat_constraint))
const context = JSON.parse(readFileSync(config.dcat.jsonld_context));
const xml_file = readFileSync('../../../pom.xml', 'utf8');

const prefixen = {
    access_right: "http://publications.europa.eu/resource/authority/access-right/",
    adms: "http://www.w3.org/ns/adms#",
    assettype: "http://purl.org/adms/assettype/",
    country: "http://publications.europa.eu/resource/authority/country/",
    datasets: "https://datasets.omgeving.vlaanderen.be/",
    datatheme_be: "http://vocab.belgif.be/auth/datatheme/",
    datatheme_eu: "http://publications.europa.eu/resource/authority/data-theme/",
    dcat: "http://www.w3.org/ns/dcat#",
    dc: "http://purl.org/dc/elements/1.1/",
    dcterms: "http://purl.org/dc/terms/",
    eurovoc: "http://eurovoc.europa.eu/",
    file_type: "http://publications.europa.eu/resource/authority/file-type/",
    foaf: "http://xmlns.com/foaf/0.1/",
    formats: "http://www.w3.org/ns/formats/",
    frequency: "http://publications.europa.eu/resource/authority/frequency/",
    gemet: "http://www.eionet.europa.eu/gemet/concept/",
    licence :  "http://data.vlaanderen.be/id/licentie/modellicentie-gratis-hergebruik/",
    metadata: "https://data.omgeving.vlaanderen.be/ns/metadata#",
    omg_catalog: "https://data.omgeving.vlaanderen.be/id/catalog/",
    omg_collection: "https://data.omgeving.vlaanderen.be/id/collection/",
    omg_conceptscheme: "https://data.omgeving.vlaanderen.be/id/conceptscheme/",
    omg_dataservice: "https://data.omgeving.vlaanderen.be/id/dataservice/",
    omg_dataset: "https://data.omgeving.vlaanderen.be/id/dataset/",
    omg_distribution: "https://data.omgeving.vlaanderen.be/id/distribution/",
    omg_distribution_doc:    "https://data.omgeving.vlaanderen.be/doc/distribution/",
    omg_graphcollection: "https://data.omgeving.vlaanderen.be/id/graphcollection/",
    omg_graph: "https://data.omgeving.vlaanderen.be/id/graph/",
    omg_id: "https://data.omgeving.vlaanderen.be/id/",
    omg_named_graph: "https://data.omgeving.vlaanderen.be/id/namedgraph/",
    omg_ontology: "https://data.omgeving.vlaanderen.be/id/ontology/",
    omg_package: "https://data.omgeving.vlaanderen.be/id/package/",
    omg_periodoftime: "https://data.omgeving.vlaanderen.be/id/periodoftime/",
    omg_service: "https://data.omgeving.vlaanderen.be/id/service/",
    omg_vcard: "https://data.omgeving.vlaanderen.be/id/vcard/",
    ovo: "http://data.vlaanderen.be/id/organisatie/",
    owl: "http://www.w3.org/2002/07/owl#",
    rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    rdfs: "http://www.w3.org/2000/01/rdf-schema#",
    sd: "http://www.w3.org/ns/sparql-service-description#",
    skos: "http://www.w3.org/2004/02/skos/core#",
    spdx: "http://spdx.org/rdf/terms#",
    ssd: "http://www.w3.org/ns/sparql-service-description#",
    ts: "http://www.w3.org/ns/formats/",
    vcard: "http://www.w3.org/2006/vcard/ns#",
    void: "http://rdfs.org/ns/void#",
    xsd: "http://www.w3.org/2001/XMLSchema#"

}

const frame = {
    "@context": context,
    "@type": ["dcat:Catalog"],
    "dataset": {
        "@embed": "@always",
        "@omitDefault": true,
        "hasVersion": {
            "@embed": "@always",
            "@omitDefault": true,
            "isVersionOf": {
                "@embed": "@never",
                "@omitDefault": true
            },
            "distribution": {
                "@embed": "@always",
                "@omitDefault": true
            }
        }
    }
}

async function rdf_to_jsonld(rdf_dataset, filename) {
    console.log("6 rdf to jsonld");
    let my_json = await jsonld.fromRDF(rdf_dataset);
    //writeFileSync(config.dcat.dataset_jsonld, JSON.stringify(my_json, null, 4));
    console.log("Extract a conceptscheme as a tree using a frame.");
    let framed = await jsonld.frame(my_json, frame);
    writeFileSync(filename, JSON.stringify(framed, null, 4));
}

async function serialize_catalog(store) {
    console.log("5. serialize catalog");
    const myConstructEngine = new QueryEngine();
    const query = readFileSync(config.sparql.construct, 'utf8');
    const quadStream = await myConstructEngine.queryQuads(query, { sources: [ store] });
    const catalog_ttl_writer = new N3.Writer({ format: 'text/turtle' , prefixes: prefixen });
    const catalog = rdfDataset.dataset()
    quadStream.on('data', (quad) => {
        catalog_ttl_writer.addQuad(quad);
        catalog.add(quad);
    });
    quadStream.on('end', () => {
        (async () => {
            if (await validate(shapes, catalog)) {
                catalog_ttl_writer.end((error, result) => fs.writeFileSync(config.dcat.catalog_turtle, result));
                rdf_to_jsonld(catalog, config.dcat.catalog_jsonld);
            }
        })()
    });
    quadStream.on('error', (error) => {
        console.error(error);
    });
}

async function add_dcat_dataset_to_catalog(dcat_dataset_store) {
    console.log("4. add dcat dataset to catalog");
    let catalog_old =readFileSync(config.dcat.catalog_turtle, 'utf8');
    const catalog_parser = new N3.Parser();
    const catalog_store = RdfStore.createDefault();
    catalog_parser.parse(
        catalog_old,
        (error, quad) => {
            if (quad)
                catalog_store.addQuad(quad);
            else
                console.log('catalog store loaded');});
    const myConstructEngine = new QueryEngine();
    const query = readFileSync(config.sparql.construct, 'utf8');
    const quadStream = await myConstructEngine.queryQuads(query, { sources: [ dcat_dataset_store, catalog_store ] });
    const final_store = RdfStore.createDefault();
    quadStream.on('data', (quad) => {
        final_store.addQuad(quad);
    });
    quadStream.on('end', () => {
        serialize_catalog(final_store);
    });
}


async function serialize_dcat_dataset(store){
    console.log("3. serialize dcat dataset");
    const myConstructEngine = new QueryEngine();
    const query = readFileSync(config.sparql.construct, 'utf8');
    const quadStream = await myConstructEngine.queryQuads(query, { sources: [ store ] });
    const ttl_writer = new N3.Writer({ format: 'text/turtle' , prefixes: prefixen });
    const dataset = rdfDataset.dataset()
    quadStream.on('data', (quad) => {
        ttl_writer.addQuad(quad);
        dataset.add(quad);
    });
    quadStream.on('end', () => {
        (async () => {
            if (await validate(shapes, dataset)) {
                ttl_writer.end((error, result) => fs.writeFileSync(config.dcat.dataset_turtle, result));
                rdf_to_jsonld(dataset, config.dcat.dataset_jsonld);
            }
        })()
    });
    quadStream.on('error', (error) => {
    });
}

async function construct_dcat_dataset(pom_metadata_store){
    console.log("2. construct dcat dataset");
    const myConstructEngine = new QueryEngine();
    const store = RdfStore.createDefault();
    const query = readFileSync(config.sparql.dataset_source, 'utf8');
    const quadStream = await myConstructEngine.queryQuads(query, { sources: [ pom_metadata_store ] });
    quadStream.on('data', (quad) => {
        store.addQuad(quad);
    });
    quadStream.on('end', () => {
        serialize_dcat_dataset(store);
        add_dcat_dataset_to_catalog(store);
    });
    quadStream.on('error', (error) => {
        console.error(error);
    });
}

async function construct_metadata(){
    console.log('1. construct metadata');
    var result = JSON.parse(convert.xml2json(xml_file, {compact: true, spaces: 4}));
    var metadata = {}
    metadata['@context'] = JSON.parse(readFileSync(config.dcat.jsonld_dataset_context));
    metadata['@id'] = "https://data.omgeving.vlaanderen.be/id/metadata/template";
    metadata['groupId'] = jp.query(result, '$.project.groupId._text').toString();
    metadata['artifactId'] = jp.query(result, '$.project.artifactId._text').toString();
    metadata['version'] = jp.query(result, '$.project.version._text').toString();
    metadata['next_release_version'] = jp.query(result, '$.project.version._text').toString().split('-')[0];
    metadata['name'] = jp.query(result, '$.project.name._text').toString();
    let metadata_rdf = await jsonld.toRDF(metadata, { format: "application/n-quads" })
    const parser = new N3.Parser();
    const pom_metadata_store = RdfStore.createDefault();
    parser.parse(
        metadata_rdf,
        (error, quad) => {
            if (quad)
                pom_metadata_store.addQuad(quad);
            else
                construct_dcat_dataset(pom_metadata_store);
        });
}
construct_metadata();

