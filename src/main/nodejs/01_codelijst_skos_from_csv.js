import fs from "fs";
import jsonld from 'jsonld';
import {readFileSync} from 'fs';
import csv from 'csvtojson';
import N3 from 'n3';
import { RdfStore } from 'rdf-stores';
import { QueryEngine } from '@comunica/query-sparql';
import rdfDataset from '@rdfjs/dataset';
import yaml from 'js-yaml';
import validate from './shacl/shacl_validation.js';
import rdf from '@zazuko/env-node'

// VARIABLES
const config = yaml.load(fs.readFileSync('../resources/source/config.yml', 'utf8'));

const context = JSON.parse(readFileSync(config.skos.jsonld_context));

const shapes = await rdf.dataset().import(rdf.fromFile(config.ap.constraint))

const prefixen = {xsd: "http://www.w3.org/2001/XMLSchema#",
    skos: "http://www.w3.org/2004/02/skos/core#",
    rdfs: "http://www.w3.org/2000/01/rdf-schema#",
    vlcs: "https://data.omgeving.vlaanderen.be/id/conceptscheme/",
    cm: "https://data.omgeving.vlaanderen.be/id/concept/matrix/",
    com: "https://data.omgeving.vlaanderen.be/id/collection/matrix/",
    dcat: "http://www.w3.org/ns/dcat#",
    dct: "http://purl.org/dc/terms/",
    dc: "http://purl.org/dc/elements/1.1/",
    gemet: "http://www.eionet.europa.eu/gemet/concept/"}

const frame = {
    "@context": context,
    "@type": ["skos:ConceptScheme", "skos:Collection", "skos:Concept"],
    "member": {
        "@type": "skos:Concept",
        "@embed": "@always",
        "@omitDefault": true,
        "inScheme": {
            "@type": "skos:ConceptScheme",
            "@embed": "@never",
            "@omitDefault": true
        },
        "topConceptOf": {
            "@type": "skos:ConceptScheme",
            "@embed": "@never",
            "@omitDefault": true
        }
    },
    "inScheme": {
        "@type": "skos:ConceptScheme",
        "@embed": "@never",
        "@omitDefault": true
    },
    "topConceptOf": {
        "@type": "skos:ConceptScheme",
        "@embed": "@never",
        "@omitDefault": true
    }
}

// FUNCTIONS
function separateString(originalString) {
    if (originalString.includes('|')) {
        return originalString.split('|');
    }
    else {
        return originalString;
    }
}

async function rdf_to_jsonld(dataset) {
    console.log("6 rdf to jsonld");
    let my_json = await jsonld.fromRDF(dataset);
    fs.writeFileSync(config.skos.jsonld, JSON.stringify(my_json, null, 4));
    console.log("Extract a conceptscheme as a tree using a frame.");
    let framed = await jsonld.frame(my_json, frame);
    fs.writeFileSync(config.skos.jsonld_framed, JSON.stringify(framed, null, 4));
}

async function jsonld_to_store(json_ld) {
    //https://github.com/digitalbazaar/jsonld.js/issues/255
    let rdf = await jsonld.toRDF(json_ld, { format: "application/n-quads" })
    console.log("2 Jsonld to Quads in Store.");
    const parser = new N3.Parser();
    const store = RdfStore.createDefault();
    parser.parse(
        rdf,
        (error, quad) => {
            if (quad)
                store.addQuad(quad);
            else
                verrijk(store);
        });
}

async function store_to_csv(store){
    console.log("4 store to csv");
    const myEngine = new QueryEngine();
    const query = readFileSync(config.sparql.select, 'utf8');
    const result = await myEngine.query(query, { sources: [ store ] });
    const { data } = await myEngine.resultToString(result,'text/csv');
    var csv_file = fs.createWriteStream(config.skos.csv, 'utf8') ;
    data.pipe(csv_file);
}

async function store_to_rdf(store){
    console.log("5 store to rdf");
    const myConstructEngine = new QueryEngine();
    const query = readFileSync(config.sparql.construct, 'utf8');
    const quadStream = await myConstructEngine.queryQuads(query, { sources: [ store ] });
    const ttl_writer = new N3.Writer({ format: 'text/turtle' , prefixes: prefixen });
    const nt_writer = new N3.Writer({ format: 'N-Triples' });
    const dataset = rdfDataset.dataset()
    quadStream.on('data', (quad) => {
        ttl_writer.addQuad(quad);
        nt_writer.addQuad(quad);
        dataset.add(quad);
    });
    quadStream.on('end', () => {
        nt_writer.end((error, result) => fs.writeFileSync(config.skos.nt, result));
        ttl_writer.end((error, result) => fs.writeFileSync(config.skos.turtle, result));
        rdf_to_jsonld(dataset);
        validate(shapes, dataset);
    });
    quadStream.on('error', (error) => {
        console.error(error);
    });
}

async function verrijk(store){
    console.log("3 verrijk met construct");
    const myConstructEngine = new QueryEngine();
    const query = readFileSync(config.sparql.verrijking, 'utf8');
    const quadStream = await myConstructEngine.queryQuads(query, { sources: [ store ] });
    quadStream.on('data', (quad) => {
        store.addQuad(quad);
    });
    quadStream.on('end', () => {
        store_to_csv(store);
        store_to_rdf(store);
    });
    quadStream.on('error', (error) => {
        console.error(error);
    });
}

async function csv_to_jsonld() {
    await csv({
        ignoreEmpty:true,
        flatKeys:true
    })
        .fromFile(config.skos.csv_source)
        .then((jsonObj)=>{
            var new_json = new Array();
            for(var i = 0; i < jsonObj.length; i++){
                const object = {};
                Object.keys(jsonObj[i]).forEach(function(key) {
                    //object[update_key(key)] = separateString(jsonObj[i][key]);
                    object[key] = separateString(jsonObj[i][key]);
                })
                new_json.push(object)
            }
            let jsonld = {"@graph": new_json, "@context": context};
            console.log("1 Csv to Jsonld");
            jsonld_to_store(jsonld)
        })
}
csv_to_jsonld();






