import rdf from '@zazuko/env-node'
import SHACLValidator from 'rdf-validate-shacl'

async function validate(shapes, data) {
    //const shapes = await rdf.dataset().import(rdf.fromFile('my-shapes.ttl'))
    //const data = await rdf.dataset().import(rdf.fromFile('my-data.ttl'))
    console.log("Validation");
    const validator = new SHACLValidator(shapes, { factory: rdf })
    const report = await validator.validate(data)

    // Check conformance: `true` or `false`
    console.log(report.conforms)

    for (const result of report.results) {
        // See https://www.w3.org/TR/shacl/#results-validation-result for details
        // about each property
        console.log(result.message)
        console.log(result.path)
        console.log(result.focusNode)
        console.log(result.severity)
        console.log(result.sourceConstraintComponent)
        console.log(result.sourceShape)
    }

    // Validation report as RDF dataset
    console.log(await report.dataset.serialize({ format: 'text/n3' }))
}
export default validate

