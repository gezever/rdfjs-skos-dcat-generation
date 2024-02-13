import N3 from 'n3';
import fs from "fs";
import { RdfStore } from 'rdf-stores';
import { QueryEngine } from '@comunica/query-sparql';
import rdfDataset from "@rdfjs/dataset";
import validate from './shacl/shacl_validation.js';
import jsonld from "jsonld";
import request from "request";
import {
    sortLines,
    spdx_rules,
    rdf_rules,
    void_rules,
    foaf_rules,
    dcterms_rules,
    dcat_rules,
    skos_rules,
    dcat_dataset_jsonld,
    dcat_dataset_turtle,
    dcat_catalog_jsonld,
    dcat_catalog_turtle,
    pom_context,
    groupId,
    artifactId,
    next_release_version,
    name,
    dcat_prefixes,
    frame_catalog,
    shapes_dcat,
    config
} from './var/variables.js';
import {RoxiReasoner} from "roxi-js";
import toNT from '@rdfjs/to-ntriples'


async function get_version_urls() {
    console.log('1. get previous versions');
    let url = 'https://repo.omgeving.vlaanderen.be/artifactory/api/search/gavc?g=' +
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
            let my_uris = new Array();
            var re = new RegExp("^.*pom$");
            for (const result of body.results) {
                if (re.test(result.uri)){
                    my_uris.push(result.uri);
                }
            }
            get_versions(my_uris)
        };
    });
}

async function get_versions(uris) {
    let my_versions = new Array();
    for (const url of uris) {
        const object = {};
        const response = await fetch(url);
        const data = await response.json();
        object[version_from_uri(url)] = data.lastModified
        my_versions.push(object)
    }
    var date_time = new Date();
    let version = {}
    version[next_release_version] = date_time.toISOString()
    my_versions.push(version)
    construct_metadata([version], dcat_dataset_turtle, dcat_dataset_jsonld)
    construct_metadata(my_versions, dcat_catalog_turtle, dcat_catalog_jsonld)
}

async function construct_metadata(versions, turtle, json_ld){
    console.log('2. construct metadata');
    const store = RdfStore.createDefault();
    for (const version of versions) {
        for (const [key, value] of Object.entries(version)) {
            var metadata = {}
            metadata['@context'] = pom_context;
            metadata['@id'] = "https://data.omgeving.vlaanderen.be/id/metadata/template/" + key;
            metadata['groupId'] = groupId
            metadata['artifactId'] = artifactId
            metadata['version'] = key
            metadata['date_time'] = value
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
    }
    construct_dcat(store, turtle, json_ld);
}

async function construct_dcat(store, turtle, json_ld){
    console.log('3. construct dcat');
    const myConstructEngine = new QueryEngine();
    const query = fs.readFileSync(config.sparql.construct_dataset, 'utf8');
    const dataset = rdfDataset.dataset()
    const quadStream = await myConstructEngine.queryQuads(query, { sources: [ store ] });
    quadStream.on('data', (quad) => {
        dataset.add(quad);
    });
    quadStream.on('end', () => {
        (async () => {
            n3_reasoning(toNT(dataset), turtle, json_ld);
        })()
    });
    quadStream.on('error', (error) => {
        console.error(error);
    });
}

async function n3_reasoning(rdf, turtle, json_ld) {
    console.log("4: n3 reasoning ");
    const reasoner = RoxiReasoner.new();
    reasoner.add_abox(rdf);
    reasoner.add_rules(dcat_rules);
    reasoner.add_rules(dcterms_rules);
    reasoner.add_rules(skos_rules);
    reasoner.add_rules(foaf_rules);
    reasoner.add_rules(void_rules);
    reasoner.add_rules(rdf_rules);
    reasoner.add_rules(spdx_rules);
    reasoner.materialize();
    output(sortLines(reasoner.get_abox_dump()), turtle, json_ld);
}


function output(rdf, turtle, json_ld) {
    console.log("5: output");
    const ttl_writer = new N3.Writer({ format: 'text/turtle' , prefixes: dcat_prefixes });
    const nt_writer = new N3.Writer({ format: 'N-Triples' });
    const dataset = rdfDataset.dataset()
    const parser = new N3.Parser();
    parser.parse(
        rdf,
        (error, quad) => {
            if (quad)
                ttl_writer.addQuad(quad),
                    nt_writer.addQuad(quad),
                    dataset.add(quad);
            else
                (async () => {
                   if (await validate(shapes_dcat, dataset)) {
                        ttl_writer.end((error, result) => fs.writeFileSync(turtle, result));
                        rdf_to_jsonld(dataset, json_ld);
                   }
                })()
        });
}

async function rdf_to_jsonld(rdf_dataset, filename) {
    console.log("6 rdf to jsonld");
    let my_json = await jsonld.fromRDF(rdf_dataset);
    console.log("Extract Catalog as a tree using a frame.");
    let framed = await jsonld.frame(my_json, frame_catalog);
    fs.writeFileSync(filename, JSON.stringify(framed, null, 4));
}

function version_from_uri(uri) {
    return uri.replace(/.*-(.*).pom$/, "$1")
}

get_version_urls()


