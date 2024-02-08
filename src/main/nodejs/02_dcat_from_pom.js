import N3 from 'n3';
import fs from "fs";
import { RdfStore } from 'rdf-stores';
import { QueryEngine } from '@comunica/query-sparql';
import rdfDataset from "@rdfjs/dataset";
import validate from './shacl/shacl_validation.js';
import jsonld from "jsonld";
import { groupId, artifactId, version, next_release_version, name, dcat_prefixes, frame_catalog, shapes_dcat, config } from './var/variables.js';


async function rdf_to_jsonld(rdf_dataset, filename) {
    console.log("6 rdf to jsonld");
    let my_json = await jsonld.fromRDF(rdf_dataset);
    console.log("Extract a conceptscheme as a tree using a frame.");
    let framed = await jsonld.frame(my_json, frame_catalog);
    fs.writeFileSync(filename, JSON.stringify(framed, null, 4));
}

async function serialize_catalog(store) {
    console.log("5. serialize catalog");
    const myConstructEngine = new QueryEngine();
    const query = fs.readFileSync(config.sparql.construct, 'utf8');
    const quadStream = await myConstructEngine.queryQuads(query, { sources: [ store] });
    const catalog_ttl_writer = new N3.Writer({ format: 'text/turtle' , prefixes: dcat_prefixes });
    const catalog = rdfDataset.dataset()
    quadStream.on('data', (quad) => {
        catalog_ttl_writer.addQuad(quad);
        catalog.add(quad);
    });
    quadStream.on('end', () => {
        (async () => {
            if (await validate(shapes_dcat, catalog)) {
                catalog_ttl_writer.end((error, result) => fs.writeFileSync(config.dcat.path_catalog + config.dcat.name + '/' + config.dcat.catalog_turtle, result));
                rdf_to_jsonld(catalog, config.dcat.path_catalog + config.dcat.name + '/' + config.dcat.catalog_jsonld);
            }
        })()
    });
    quadStream.on('error', (error) => {
        console.error(error);
    });
}

async function add_dcat_dataset_to_catalog(dcat_dataset_store) {
    console.log("4. add dcat dataset to catalog");
    let catalog_old = fs.readFileSync(config.dcat.path_catalog + config.dcat.name + '/' + config.dcat.catalog_turtle, 'utf8');
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
    const query = fs.readFileSync(config.sparql.construct, 'utf8');
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
    const query = fs.readFileSync(config.sparql.construct, 'utf8');
    const quadStream = await myConstructEngine.queryQuads(query, { sources: [ store ] });
    const ttl_writer = new N3.Writer({ format: 'text/turtle' , prefixes: dcat_prefixes });
    const dataset = rdfDataset.dataset()
    quadStream.on('data', (quad) => {
        ttl_writer.addQuad(quad);
        dataset.add(quad);
    });
    quadStream.on('end', () => {
        (async () => {
            if (await validate(shapes_dcat, dataset)) {
                ttl_writer.end((error, result) => fs.writeFileSync(config.dcat.path_dataset + config.dcat.name + '/' + config.dcat.dataset_turtle, result));
                rdf_to_jsonld(dataset, config.dcat.path_dataset + name + '/' + config.dcat.dataset_jsonld );
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
    const query = fs.readFileSync(config.sparql.dataset_source, 'utf8');
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
    var metadata = {}
    metadata['@context'] = JSON.parse(fs.readFileSync(config.source.path + config.source.pom_context));
    metadata['@id'] = "https://data.omgeving.vlaanderen.be/id/metadata/template";
    metadata['groupId'] = groupId
    metadata['artifactId'] = artifactId
    metadata['version'] = version
    metadata['next_release_version'] = next_release_version
    metadata['name'] = name
    const metadata_rdf = await jsonld.toRDF(metadata, { format: "application/n-quads" })
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

