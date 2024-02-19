import rdf from '@rdfjs/data-model'
import namespace from '@rdfjs/namespace'
import * as sparql from 'rdf-sparql-builder'
import N3 from 'n3';
import fs from "fs";
import {readFileSync} from "fs";
import convert from 'xml-js';
import jp from 'jsonpath';
import { QueryEngine } from '@comunica/query-sparql';


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

async function construct_dcat_dataset(querystring){
    console.log("2. construct dcat dataset");
    const myConstructEngine = new QueryEngine();
    const quadStream = await myConstructEngine.queryQuads(querystring, { sources: [ 'https://data.omgeving.vlaanderen.be/sparql'] });
    const ttl_writer = new N3.Writer({ format: 'text/turtle' , prefixes: prefixen });
    quadStream.on('data', (quad) => {
        ttl_writer.addQuad(quad);
    });
    quadStream.on('end', () => {
        ttl_writer.end((error, result) => fs.writeFileSync('/tmp/test.ttl', result));
    });
    quadStream.on('error', (error) => {
    });
}

function construct_dcat_dataset_previous_versions_query(){
    const ns = {
        dcat: namespace('http://www.w3.org/ns/dcat#'),
        rdf: namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#'),
        dct: namespace('http://purl.org/dc/terms/'),
        omg_dataset: namespace('https://data.omgeving.vlaanderen.be/id/dataset/')
    }
    var result = JSON.parse(convert.xml2json(xml_file, {compact: true, spaces: 4}))
    const dataset_uri = rdf.namedNode('https://data.omgeving.vlaanderen.be/id/dataset/' + jp.query(result, '$.project.artifactId._text').toString())
    const catalog = rdf.variable('catalog')
    const dataset = rdf.variable('dataset')
    const dataset_version = rdf.variable('dataset_version')
    const p = rdf.variable('p')
    const o = rdf.variable('o')
    const p2 = rdf.variable('p2')
    const o2 = rdf.variable('o2')
    const p3 = rdf.variable('p3')
    const o3 = rdf.variable('o3')
    const distribution = rdf.variable('distribution')
    const query = sparql
        .construct([
            [catalog, ns.dcat.dataset, dataset],
            [dataset, p, o],
            [dataset_version, p2, o2],
            [distribution, p3, o3]
        ])
        .where([
            [catalog, ns.dcat.dataset, dataset],
            [dataset, ns.rdf.type, ns.dcat.Dataset],
            [dataset, p, o],
            [dataset, ns.dct.hasVersion, dataset_version],
            [dataset_version, p2, o2],
            [dataset_version, ns.dcat.distribution, distribution],
            [distribution, p3, o3]
        ])
        .filter([
            sparql.eq(dataset, dataset_uri)
        ])
    construct_dcat_dataset(query.toString())
    console.log(query.toString())
}

construct_dcat_dataset_previous_versions_query()
