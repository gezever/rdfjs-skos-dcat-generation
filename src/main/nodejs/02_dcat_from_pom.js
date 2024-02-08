import N3 from 'n3';
import fs from "fs";
import { RdfStore } from 'rdf-stores';
import { QueryEngine } from '@comunica/query-sparql';
import rdfDataset from "@rdfjs/dataset";
import validate from './shacl/shacl_validation.js';
import jsonld from "jsonld";
import request from "request";
import jp from "jsonpath";
import { dcat_dataset_jsonld, dcat_dataset_turtle, dcat_catalog_jsonld, dcat_catalog_turtle, pom_context, groupId, artifactId, next_release_version, name, dcat_prefixes, frame_catalog, shapes_dcat, config } from './var/variables.js';


async function get_versions() {
    console.log('1. get previous versions');
    let url = 'https://repo.omgeving.vlaanderen.be/artifactory/api/search/versions?g=' +
        groupId +
        '&a=' +
        artifactId +
        '&classifier=sources&repos=release'
    let options = {json: true};
    request(url, options, (error, res, body) => {
        if (error) {
            return  console.log(error)
        };
        if (!error && res.statusCode == 200) {
            let version = [next_release_version]
            let versions = jp.query(body, '$..version');
            versions.push(next_release_version)
            construct_metadata(version, dcat_dataset_turtle, dcat_dataset_jsonld)
            construct_metadata(versions, dcat_catalog_turtle, dcat_catalog_jsonld)
        };
    });
}

async function construct_metadata(versions, turtle, json_ld){
    console.log('2. construct metadata');
    const store = RdfStore.createDefault();
    for (const version of versions) {
        var metadata = {}
        metadata['@context'] = pom_context;
        metadata['@id'] = "https://data.omgeving.vlaanderen.be/id/metadata/template";
        metadata['groupId'] = groupId
        metadata['artifactId'] = artifactId
        metadata['version'] = version
        metadata['name'] = name
        const metadata_rdf = await jsonld.toRDF(metadata, { format: "application/n-quads" })
        const parser = new N3.Parser();
        parser.parse(
            metadata_rdf,
            (error, quad) => {
                if (quad)
                    store.addQuad(quad);
            });
    }
    construct_dcat(store, turtle, json_ld);
}

async function construct_dcat(store, turtle, json_ld){
    console.log('3. construct dcat');
    const myConstructEngine = new QueryEngine();
    const query = fs.readFileSync(config.sparql.dataset_source, 'utf8');
    const ttl_writer = new N3.Writer({ format: 'text/turtle' , prefixes: dcat_prefixes });
    const dataset = rdfDataset.dataset()
    const quadStream = await myConstructEngine.queryQuads(query, { sources: [ store ] });
    quadStream.on('data', (quad) => {
        ttl_writer.addQuad(quad);
        dataset.add(quad);
    });
    quadStream.on('end', () => {
        (async () => {
            if (await validate(shapes_dcat, dataset)) {
                ttl_writer.end((error, result) => fs.writeFileSync(turtle, result));
                rdf_to_jsonld(dataset, json_ld);
            }
        })()
    });
    quadStream.on('error', (error) => {
        console.error(error);
    });
}

async function rdf_to_jsonld(rdf_dataset, filename) {
    console.log("4 rdf to jsonld");
    let my_json = await jsonld.fromRDF(rdf_dataset);
    console.log("Extract Catalog as a tree using a frame.");
    let framed = await jsonld.frame(my_json, frame_catalog);
    fs.writeFileSync(filename, JSON.stringify(framed, null, 4));
}

get_versions()


