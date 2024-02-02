
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
import {RoxiReasoner} from "roxi-js";
import jsoncsv from 'json-csv';
import jsonAggregate from 'json-aggregate';
import jp from 'jsonpath';
import  { json2csv }  from 'json-2-csv';




//


'use strict';
// VARIABLES
const config = yaml.load(fs.readFileSync('../resources/source/config.yml', 'utf8'));

const context = JSON.parse(readFileSync(config.skos.jsonld_context));

const context_csv_result = JSON.parse(readFileSync(config.skos.csv_result_context));

const shapes = await rdf.dataset().import(rdf.fromFile(config.ap.skos_constraint))

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
        "@embed": "@never",
        "@omitDefault": true
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
    },
    "broader": {
        "@type": "skos:Concept",
        "@embed": "@never",
        "@omitDefault": true
    },
    "narrower": {
        "@type": "skos:Concept",
        "@embed": "@never",
        "@omitDefault": true
    },
    "hasTopConcept": {
        "@type": "skos:Concept",
        "@embed": "@never",
        "@omitDefault": true
    }
}

const frame_csv_result = {
    "@context": context_csv_result,
    "@type": ["http://www.w3.org/2004/02/skos/core#ConceptScheme", "http://www.w3.org/2004/02/skos/core#Collection", "http://www.w3.org/2004/02/skos/core#Concept"],
    "member": {
        "@type": "http://www.w3.org/2004/02/skos/core#Concept",
        "@embed": "@never",
        "@omitDefault": true
    },
    "inScheme": {
        "@type": "http://www.w3.org/2004/02/skos/core#ConceptScheme",
        "@embed": "@never",
        "@omitDefault": true
    },
    "topConceptOf": {
        "@type": "http://www.w3.org/2004/02/skos/core#ConceptScheme",
        "@embed": "@never",
        "@omitDefault": true
    },
    "broader": {
        "@type": "http://www.w3.org/2004/02/skos/core#Concept",
        "@embed": "@never",
        "@omitDefault": true
    },
    "narrower": {
        "@type": "http://www.w3.org/2004/02/skos/core#Concept",
        "@embed": "@never",
        "@omitDefault": true
    },
    "hasTopConcept": {
        "@type": "http://www.w3.org/2004/02/skos/core#Concept",
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

function arrayToDelimitedString(arr) {
    if (Array.isArray(arr)) {
        return arr.join('|')
        //return originalString.split('|');
    }
    else {
        return arr;
    }
}

async function n3_reasoning(json_ld) {
    console.log("2: n3 reasoning ");
    //https://github.com/digitalbazaar/jsonld.js/issues/255
    let rdf = await jsonld.toRDF(json_ld, { format: "application/n-quads" })
    const rules = readFileSync(config.n3.skos_rules, 'utf8');
    const reasoner = RoxiReasoner.new();
    reasoner.add_abox(rdf);
    reasoner.add_rules(rules);
    reasoner.materialize();
    output(reasoner.get_abox_dump());
    const query = readFileSync('/home/gehau/git/rdfjs-skos-dcat-generation/src/main/sparql/rdf_to_csv_test.rq', 'utf8');
    const result = reasoner.query(query);
    //const result = reasoner.query('select  ?s ?o where {?s a ?o}');
    //roxy_select_to_csv(result);

    //console.log("3: output");
}

async function roxy_select_to_csv(result){
    const results = [];
    let temp = {};
    for (const row of result){
        temp = {};
        for(const binding of row){
                temp[binding.getVar()] = binding.getValue();
        }
        results.push(temp)
    }
    const collection = jsonAggregate.create(JSON.stringify(results, null, 4))
    //const collection = new Collection(results)
    const c1 = collection.match({ uri : "<https://data.omgeving.vlaanderen.be/id/conceptscheme/matrix>" }).exec()
    const data = collection.group({id: 'uri', type : {$addToSet: 'type'}, hasTC : {$addToSet: 'hasTC'}}).exec()
    var csv_file = fs.createWriteStream(config.skos.csv, 'utf8') ;

    //const readable = some_readable_source //<readable source in object mode>
    results
        .pipe(jsoncsv.stream(options)) //transforms to Utf8 string and emits lines
        //.pipe(csv_file)

}

async function roxy_select_to_json(result){
    const urlRegex = new RegExp(/<?(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*))>?/);
    const results = [];
    let temp = {};
    let headVars = new Map();
    for (const row of result){
        temp = {};
        for(const binding of row){
            headVars.set(binding.getVar(), binding.getVar());
            const regexArray = urlRegex.exec(binding.getValue());
            if (regexArray == null) {
                temp[binding.getVar()] = {type:"literal",value: binding.getValue()};
            }
            else {
                temp[binding.getVar()] = {type:"uri",value: regexArray[1]};
            }
        }
        results.push(temp)
    }
    const data = {head:{vars:Array.from(headVars.keys())},results:{bindings:results}};
    fs.writeFileSync(config.skos.json, JSON.stringify(data, null, 4));




    const out = data.reduce((accumulator, item) => {
        if (accumulator[item.id]) {
            const group = accumulator[item.id];
            if (Array.isArray(group.sport)) {
                group.sport.push(item.sport);
            } else {
                group.sport = [group.sport, item.sport];
            }
            group.medal_count = `${(+group.medal_count) + (+item.medal_count)}`;
        } else {
            accumulator[item.id] = item;
        }
        return accumulator;
    }, {});
    console.log(JSON.stringify(out, null, 2));
}

function output(rdf) {
    console.log("3: output");
    const ttl_writer = new N3.Writer({ format: 'text/turtle' , prefixes: prefixen });
    const nt_writer = new N3.Writer({ format: 'N-Triples' });
    const dataset = rdfDataset.dataset()
    const store = RdfStore.createDefault();
    const parser = new N3.Parser();
    parser.parse(
        rdf,
        (error, quad, prefixen) => {
            if (quad)
                ttl_writer.addQuad(quad),
                    nt_writer.addQuad(quad),
                    store.addQuad(quad),
                    dataset.add(quad);
            else
                (async () => {
                    if (await validate(shapes, dataset)) {
                        nt_writer.end((error, result) => fs.writeFileSync(config.skos.nt, result)),
                            ttl_writer.end((error, result) => fs.writeFileSync(config.skos.turtle, result)),
                            rdf_to_jsonld(dataset),
                            store_to_csv(store);
                    }
                })()
        });
}

async function rdf_to_jsonld(dataset) {
    console.log("4: rdf to jsonld");
    console.log("Extract a conceptscheme as a tree using a frame.");
    let my_json = await jsonld.fromRDF(dataset);
    fs.writeFileSync(config.skos.jsonld, JSON.stringify(my_json, null, 4));
    let framed = await jsonld.frame(my_json, frame);
    fs.writeFileSync(config.skos.jsonld_framed, JSON.stringify(framed, null, 4));
    jsonld_to_csv(my_json);
}

async function jsonld_to_csv(my_json){
    console.log("7: jsonld to csv");
    let framed_csv = await jsonld.frame(my_json, frame_csv_result);
    var array = jp.query(framed_csv, '$.graph[*]');
    let temp = {};
    const results = [];
    for (const row of array){
        temp = {};
        for (const [key] of Object.entries(row)) {
            temp[key] = arrayToDelimitedString(row[key])
        }
        results.push(temp)
    }
    const csv = await json2csv(results,
        {emptyFieldValue: null,
            expandArrayObjects: false});
    fs.writeFileSync('/tmp/test2.csv', csv, 'utf8' );
}

async function store_to_csv(store){
    console.log("5: store to csv");
    const myEngine = new QueryEngine();
    const query = readFileSync(config.sparql.select, 'utf8');
    const result = await myEngine.query(query, { sources: [ store ] });
    const { data } = await myEngine.resultToString(result,'text/csv');
    var csv_file = fs.createWriteStream(config.skos.csv, 'utf8') ;
    data.pipe(csv_file);
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
            console.log("1: Csv to Jsonld");
            n3_reasoning(jsonld)
        })
}

csv_to_jsonld();






