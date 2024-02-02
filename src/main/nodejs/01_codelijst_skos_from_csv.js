'use strict';
import fs from "fs";
import jsonld from 'jsonld';
import csv from 'csvtojson';
import N3 from 'n3';
import rdfDataset from '@rdfjs/dataset';
import {RoxiReasoner} from "roxi-js";
import jp from 'jsonpath';
import  { json2csv }  from 'json-2-csv';
import validate from './shacl/shacl_validation.js';
import { frame, frame_csv_result, config, context, shapes, prefixen } from './var/variables.js';


function separateString(originalString) {
    if (originalString.includes('|')) {
        return originalString.split('|'); // pipe separated string to array
    }
    else {
        return originalString; // is string
    }
}

function joinArray(arr) {
    if (Array.isArray(arr)) {
        return arr.join('|') // array to pipe separated string
    }
    else {
        return arr; // is string
    }
}

async function n3_reasoning(json_ld) {
    console.log("2: n3 reasoning ");
    let rdf = await jsonld.toRDF(json_ld, { format: "application/n-quads" })
    const rules = fs.readFileSync(config.n3.skos_rules, 'utf8');
    const reasoner = RoxiReasoner.new();
    reasoner.add_abox(rdf);
    reasoner.add_rules(rules);
    reasoner.materialize();
    output(reasoner.get_abox_dump());
}


function output(rdf) {
    console.log("3: output");
    const ttl_writer = new N3.Writer({ format: 'text/turtle' , prefixes: prefixen });
    const nt_writer = new N3.Writer({ format: 'N-Triples' });
    const dataset = rdfDataset.dataset()
    const parser = new N3.Parser();
    parser.parse(
        rdf,
        (error, quad, prefixen) => {
            if (quad)
                ttl_writer.addQuad(quad),
                    nt_writer.addQuad(quad),
                    dataset.add(quad);
            else
                (async () => {
                    if (await validate(shapes, dataset)) {
                        nt_writer.end((error, result) => fs.writeFileSync(config.skos.nt, result)),
                            ttl_writer.end((error, result) => fs.writeFileSync(config.skos.turtle, result)),
                            rdf_to_jsonld(dataset)
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
    console.log("5: jsonld to csv");
    let framed_csv = await jsonld.frame(my_json, frame_csv_result);
    var array = jp.query(framed_csv, '$.graph[*]');
    let temp = {};
    const results = [];
    for (const row of array){
        temp = {};
        for (const [key] of Object.entries(row)) {
            temp[key] = joinArray(row[key])
        }
        results.push(temp)
    }
    const csv = await json2csv(results,
        {emptyFieldValue: null,
            expandArrayObjects: false});
    fs.writeFileSync(config.skos.csv, csv, 'utf8' );
}

async function csv_to_jsonld() {
    console.log("1: csv to jsonld ");
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





// async function roxy_select_to_json(result){
// const query = fs.readFileSync('/home/gehau/git/rdfjs-skos-dcat-generation/src/main/sparql/rdf_to_csv_test.rq', 'utf8');
// const result = reasoner.query(query);
//const result = reasoner.query('select  ?s ?o where {?s a ?o}');
//roxy_select_to_csv(result);

//console.log("3: output");
//     const urlRegex = new RegExp(/<?(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*))>?/);
//     const results = [];
//     let temp = {};
//     let headVars = new Map();
//     for (const row of result){
//         temp = {};
//         for(const binding of row){
//             headVars.set(binding.getVar(), binding.getVar());
//             const regexArray = urlRegex.exec(binding.getValue());
//             if (regexArray == null) {
//                 temp[binding.getVar()] = {type:"literal",value: binding.getValue()};
//             }
//             else {
//                 temp[binding.getVar()] = {type:"uri",value: regexArray[1]};
//             }
//         }
//         results.push(temp)
//     }
//     const data = {head:{vars:Array.from(headVars.keys())},results:{bindings:results}};
//     fs.writeFileSync(config.skos.json, JSON.stringify(data, null, 4));
// }

