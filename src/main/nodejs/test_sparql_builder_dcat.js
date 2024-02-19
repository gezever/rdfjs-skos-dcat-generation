import rdf from '@rdfjs/data-model'
import namespace from '@rdfjs/namespace'
import * as sparql from 'rdf-sparql-builder'
import N3 from 'n3';
import fs from "fs";
import {readFileSync} from "fs";
import convert from 'xml-js';
import jp from 'jsonpath';
import { QueryEngine } from '@comunica/query-sparql';
//import rdf from '@zazuko/env-node'
import { RdfStore } from 'rdf-stores';
const xml_file = readFileSync('../../../pom.xml', 'utf8');
import { Readable } from 'readable-stream'
import ParserN3 from '@rdfjs/parser-n3'
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
} from '../../main/nodejs/var/variables.js';



const pom = Readable.from(`
<https://data.omgeving.vlaanderen.be/id/metadata/template/2.0.1> <http://spdx.org/rdf/terms#name> "codelijst-matrix" .
<https://data.omgeving.vlaanderen.be/id/metadata/template/2.0.1> <http://www.w3.org/2002/07/owl#versionInfo> "2.0.1" .
<https://data.omgeving.vlaanderen.be/id/metadata/template/2.0.1> <https://data.omgeving.vlaanderen.be/ns/metadata#artifactId> "codelijst-matrix" .
<https://data.omgeving.vlaanderen.be/id/metadata/template/2.0.1> <https://data.omgeving.vlaanderen.be/ns/metadata#date_time> "2024-02-13T13:07:57.592Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> .
<https://data.omgeving.vlaanderen.be/id/metadata/template/2.0.1> <https://data.omgeving.vlaanderen.be/ns/metadata#groupId> "be.vlaanderen.omgeving.data.id.graph" .

`)


async function construct_dcat_dataset(querystring){
    const parser = new N3.Parser();
    const store = RdfStore.createDefault();
    parser.parse(
        `<https://data.omgeving.vlaanderen.be/id/metadata/template/2.0.1> <http://spdx.org/rdf/terms#name> "codelijst-matrix" .
<https://data.omgeving.vlaanderen.be/id/metadata/template/2.0.1> <http://www.w3.org/2002/07/owl#versionInfo> "2.0.1" .
<https://data.omgeving.vlaanderen.be/id/metadata/template/2.0.1> <https://data.omgeving.vlaanderen.be/ns/metadata#artifactId> "codelijst-matrix" .
<https://data.omgeving.vlaanderen.be/id/metadata/template/2.0.1> <https://data.omgeving.vlaanderen.be/ns/metadata#date_time> "2024-02-13T13:07:57.592Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> .
<https://data.omgeving.vlaanderen.be/id/metadata/template/2.0.1> <https://data.omgeving.vlaanderen.be/ns/metadata#groupId> "be.vlaanderen.omgeving.data.id.graph" .`,
        (error, quad, prefixes) => {
            if (quad)
                store.addQuad(quad);
            else
                console.log("# That's all, folks!", prefixes);
        });
    console.log("2. construct dcat dataset");
    const myConstructEngine = new QueryEngine();
    const quadStream = await myConstructEngine.queryQuads(querystring, { sources: [store] });
    const ttl_writer = new N3.Writer({ format: 'text/turtle' , prefixes: dcat_prefixes });
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
        access_right: namespace('http://publications.europa.eu/resource/authority/access-right/'),
        adms: namespace('http://www.w3.org/ns/adms#'),
        assettype: namespace('http://purl.org/adms/assettype/'),
        country: namespace('http://publications.europa.eu/resource/authority/country/'),
        datasets: namespace('https://datasets.omgeving.vlaanderen.be/'),
        datatheme_be: namespace('http://vocab.belgif.be/auth/datatheme/'),
        datatheme_eu: namespace('http://publications.europa.eu/resource/authority/data-theme/'),
        dc: namespace('http://purl.org/dc/elements/1.1/'),
        dcat: namespace('http://www.w3.org/ns/dcat#'),
        dcterms: namespace('http://purl.org/dc/terms/'),
        eurovoc: namespace('http://eurovoc.europa.eu/'),
        file_type: namespace('http://publications.europa.eu/resource/authority/file-type/'),
        foaf: namespace('http://xmlns.com/foaf/0.1/'),
        formats: namespace('http://www.w3.org/ns/formats/'),
        frequency: namespace('http://publications.europa.eu/resource/authority/frequency/'),
        gemet: namespace('http://www.eionet.europa.eu/gemet/concept/'),
        language: namespace('http://publications.europa.eu/resource/authority/language/'),
        metadata: namespace('https://data.omgeving.vlaanderen.be/ns/metadata#'),
        licence: namespace('http://data.vlaanderen.be/id/licentie/modellicentie-gratis-hergebruik/'),
        omg_catalog: namespace('https://data.omgeving.vlaanderen.be/id/catalog/'),
        omg_collection: namespace('https://data.omgeving.vlaanderen.be/id/collection/'),
        omg_conceptscheme: namespace('https://data.omgeving.vlaanderen.be/id/conceptscheme/'),
        omg_dataservice: namespace('https://data.omgeving.vlaanderen.be/id/dataservice/'),
        omg_dataset: namespace('https://data.omgeving.vlaanderen.be/id/dataset/'),
        omg_distribution: namespace('https://data.omgeving.vlaanderen.be/id/distribution/'),
        omg_distribution_doc: namespace('https://data.omgeving.vlaanderen.be/doc/distribution/'),
        omg_graph: namespace('https://data.omgeving.vlaanderen.be/id/graph/'),
        omg_graphcollection: namespace('https://data.omgeving.vlaanderen.be/id/graphcollection/'),
        omg_id: namespace('https://data.omgeving.vlaanderen.be/id/'),
        omg_named_graph: namespace('https://data.omgeving.vlaanderen.be/id/namedgraph/'),
        omg_ontology: namespace('https://data.omgeving.vlaanderen.be/id/ontology/'),
        omg_package: namespace('https://data.omgeving.vlaanderen.be/id/package/'),
        omg_periodoftime: namespace('https://data.omgeving.vlaanderen.be/id/periodoftime/'),
        omg_service: namespace('https://data.omgeving.vlaanderen.be/id/service/'),
        omg_vcard: namespace('https://data.omgeving.vlaanderen.be/id/vcard/'),
        ovo: namespace('http://data.vlaanderen.be/id/organisatie/'),
        owl: namespace('http://www.w3.org/2002/07/owl#'),
        rdf: namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#'),
        rdfs: namespace('http://www.w3.org/2000/01/rdf-schema#'),
        sd: namespace('http://www.w3.org/ns/sparql-service-description#'),
        skos: namespace('http://www.w3.org/2004/02/skos/core#'),
        spdx: namespace('http://spdx.org/rdf/terms#'),
        ssd: namespace('http://www.w3.org/ns/sparql-service-description#'),
        vcard: namespace('http://www.w3.org/2006/vcard/ns#'),
        void: namespace('http://rdfs.org/ns/void#'),
        xsd: namespace('http://www.w3.org/2001/XMLSchema#')
    }
    var result = JSON.parse(convert.xml2json(xml_file, {compact: true, spaces: 4}))
    const nl = rdf.literal('nl@nl')
    const theme1 = rdf.namedNode('http://eurovoc.europa.eu/2407')
    const theme2 = rdf.namedNode('http://publications.europa.eu/resource/authority/data-theme/ENVI')
    const theme3 = rdf.namedNode('http://vocab.belgif.be/auth/datatheme/ENVI')
    const theme4 = rdf.namedNode('http://www.eionet.europa.eu/gemet/concept/10087')
    const access_rights = rdf.namedNode('http://publications.europa.eu/resource/authority/access-right/PUBLIC')



    const frequency = rdf.namedNode('http://publications.europa.eu/resource/authority/frequency/IRREG')
    const licentie = rdf.namedNode('http://data.vlaanderen.be/id/licentie/modellicentie-gratis-hergebruik/v1.0')
    const publisher = rdf.namedNode('http://data.vlaanderen.be/id/organisatie/OVO003323')
    const nederlands = rdf.namedNode('http://publications.europa.eu/resource/authority/language/NLD')
    const rightsHolder = rdf.namedNode('http://data.vlaanderen.be/id/organisatie/OVO003751')

    const catalog_landingspage = rdf.namedNode('https://data.omgeving.vlaanderen.be/doc/catalog/codelijst.html')
    const dataset_uri = rdf.namedNode('https://data.omgeving.vlaanderen.be/id/dataset/' + jp.query(result, '$.project.artifactId._text').toString())
    const catalog = rdf.variable('catalog')
    const dataset = rdf.variable('dataset')
    const dataset_version = rdf.variable('dataset_version')
    const s = rdf.variable('s')
    const p = rdf.variable('p')
    const o = rdf.variable('o')
    const p2 = rdf.variable('p2')
    const o2 = rdf.variable('o2')
    const p3 = rdf.variable('p3')
    const o3 = rdf.variable('o3')

    const distribution = rdf.variable('distribution')
    const artifactid = rdf.variable('artifactId')
    const dataset_id = rdf.variable('dataset_id')

    const belgium = rdf.namedNode('http://publications.europa.eu/resource/authority/country/BEL')
    const flanders = rdf.namedNode('https://www.geonames.org/3337388/flanders')
    const conceptscheme = rdf.variable('conceptscheme')
    const dataset_alternative = rdf.variable('dataset_alternative')
    const dataset_description = rdf.variable('dataset_description')
    const dataset_label = rdf.variable('dataset_label')
    const dataset_page = rdf.variable('dataset_page')

    const themes = [theme1, theme2, theme3, theme4 ]
    const query = sparql
        .construct([
            [ns.omg_catalog.codelijst, ns.dcat.dataset, dataset_uri],
            [dataset_uri, ns.rdf.type, ns.dcat.Dataset],
            [dataset_uri, ns.dc.language, nl],
            //[dataset_uri, ns.dc.identifier, dataset_id],
            [dataset_uri,ns.dcterms.accessRights, access_rights],
            [dataset_uri,ns.dcterms.accrualPeriodicity, frequency],
            //[dataset_uri,ns.dcterms.alternative, dataset_alternative],
            //[dataset_uri,ns.rdfs.label, dataset_label],
            //[dataset_uri,ns.dcterms.description, dataset_description],
            [dataset_uri,ns.dcterms.identifier, dataset_uri],
            [dataset_uri,ns.dcterms.language, nederlands ],
            [dataset_uri,ns.dcterms.license, licentie],
            [dataset_uri,ns.dcterms.publisher, publisher],
            [dataset_uri,ns.dcterms.rightsHolder, rightsHolder],
            [dataset_uri,ns.dcterms.spatial, flanders],
            [dataset_uri,ns.dcterms.spatial, belgium],
            [dataset_uri,ns.dcterms.temporal, ns.omg_periodoftime.dataset_omg],
            //[dataset_uri,ns.dcterms.title, dataset_label],
            //[dataset_uri,ns.void.rootResource, conceptscheme],
            [dataset_uri,ns.dcat.contactPoint, ns.omg_vcard.helpdesk],
            [dataset_uri,ns.dcat.landingPage, catalog_landingspage],
            [dataset_uri,ns.dcat.theme, themes ]
            //[dataset_uri,ns.dcat.theme, theme2 ],
            //[dataset_uri,ns.dcat.theme, theme3 ],
            //[dataset_uri,ns.dcat.theme, theme4 ]//,
            //[dataset_uri,ns.foaf.page, dataset_page],
            //[dataset_uri,ns.dcterms.hasVersion,  dataset_version]



               // [s, ns.metadata.artifactId, artifactId]
                 //   [ns.omg_catalog.codelijst, ns.dcat.dataset, dataset_uri]
            // [dataset, p, o],
            // [dataset_version, p2, o2],
            // [distribution, p3, o3]
        ])
        .where([
            //[s, ns.metadata.artifactId, artifactId]//,
                [s, ns.metadata.artifactId, artifactId]

            // [dataset, ns.rdf.type, ns.dcat.Dataset],
            // [dataset, p, o],
            // [dataset, ns.dct.hasVersion, dataset_version],
            // [dataset_version, p2, o2],
            // [dataset_version, ns.dcat.distribution, distribution],
            // [distribution, p3, o3]
        ])
        // .bind( dataset
        // )

        // .filter([
        //     sparql.eq(dataset, dataset_uri)
        // ])
    construct_dcat_dataset(query.toString())
    console.log(query.toString())
}

construct_dcat_dataset_previous_versions_query()
