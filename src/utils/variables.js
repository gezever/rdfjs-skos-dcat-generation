'use strict';
import yaml from 'js-yaml';
import fs, {readFileSync} from "fs";
import rdf from "@zazuko/env-node";
import convert from "xml-js";
import jp from "jsonpath";


const config = yaml.load(fs.readFileSync('./source/config.yml', 'utf8'));
const prefixes = Object.assign( {}, config.skos.prefixes, config.prefixes, { '@base' : config.skos.prefixes.concept })

const context = JSON.parse(readFileSync(config.source.path + config.source.context));

const context_prefixes = Object.assign({},context , prefixes)

const shapes_skos = await rdf.dataset().import(rdf.fromFile(config.ap.path + config.ap.name + '-' + config.ap.type + '/' + config.ap.name + '-' + config.ap.type + config.ap.turtle))

var result = JSON.parse(convert.xml2json(readFileSync('../pom.xml', 'utf8'), {compact: true, spaces: 4}));

const groupId = jp.query(result, '$.project.groupId._text').toString();

const artifactId = jp.query(result, '$.project.artifactId._text').toString();

const version = jp.query(result, '$.project.version._text').toString();

const next_release_version = jp.query(result, '$.project.version._text').toString().split('-')[0];






const skos_rules = fs.readFileSync(config.n3.skos_rules, 'utf8');

const dcat_rules = fs.readFileSync(config.n3.dcat_rules, 'utf8');

const dcterms_rules = fs.readFileSync(config.n3.dcterms_rules, 'utf8');

const foaf_rules = fs.readFileSync(config.n3.foaf_rules, 'utf8');

const void_rules = fs.readFileSync(config.n3.void_rules, 'utf8');

const rdf_rules = fs.readFileSync(config.n3.rdf_rules, 'utf8');

const spdx_rules = fs.readFileSync(config.n3.spdx_rules, 'utf8');

const spdx_extra_rules = fs.readFileSync(config.n3.spdx_extra_rules, 'utf8');



// const skos_prefixes = {
//     xsd: "http://www.w3.org/2001/XMLSchema#",
//     skos: "http://www.w3.org/2004/02/skos/core#",
//     rdfs: "http://www.w3.org/2000/01/rdf-schema#",
//     vlcs: "https://data.omgeving.vlaanderen.be/id/conceptscheme/",
//     cm: "https://data.omgeving.vlaanderen.be/id/concept/matrix/",
//     com: "https://data.omgeving.vlaanderen.be/id/collection/matrix/",
//     dcat: "http://www.w3.org/ns/dcat#",
//     dct: "http://purl.org/dc/terms/",
//     dc: "http://purl.org/dc/elements/1.1/",
//     gemet: "http://www.eionet.europa.eu/gemet/concept/",
// }


const frame_skos_prefixes = {
    "@context": context_prefixes,
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

const frame_skos_no_prefixes = {
    "@context": context,
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


export {  rdf_rules, spdx_rules, spdx_extra_rules, void_rules, foaf_rules, dcterms_rules, dcat_rules, skos_rules, groupId, artifactId, version,  frame_skos_prefixes, frame_skos_no_prefixes, config, context_prefixes, context, shapes_skos };

skos_rules,
    frame_skos_prefixes,
    frame_skos_no_prefixes,
    config,
    context_prefixes,
    shapes_skos